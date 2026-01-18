#include "../include/oauth_github.hpp"
#include "../include/utils.hpp"
#include "../include/mongodb.hpp"
#include "../include/jwt_token.hpp"
#include <iostream>
#include <random>

using json = nlohmann::json;
using namespace httplib;

void handle_github_callback(
    const Request& req,
    Response& res,
    SessionStorage& storage,
    const json& config,
    std::shared_ptr<MongoDB> mongo_db,
    std::shared_ptr<JWTHandler> jwt_handler
) {
    std::string code = req.get_param_value("code");
    std::string oauth_state = req.get_param_value("state");
    std::string error = req.get_param_value("error");
    
    if (!error.empty()) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Авторизация отменена</h1><p>Вы отказались от авторизации через GitHub.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
        return;
    }
    
    if (code.empty() || oauth_state.empty()) {
        res.set_content("<h1>Ошибка</h1><p>Отсутствуют необходимые параметры.</p>", "text/html; charset=utf-8");
        return;
    }

    auto session_opt = storage.get_session_by_oauth_state(oauth_state);
    if (!session_opt) {
        res.set_content("<h1>Ошибка</h1><p>Сессия не найдена или истекла.</p>", "text/html; charset=utf-8");
        return;
    }
    
    AuthSession session = *session_opt;
    
    std::string client_id = config["github"]["client_id"].get<std::string>();
    std::string client_secret = config["github"]["client_secret"].get<std::string>();
    std::string redirect_uri = config["github"]["redirect_uri"].get<std::string>();
    
    std::string post_body = "client_id=" + client_id + "&client_secret=" + client_secret +
        "&code=" + code + "&redirect_uri=" + redirect_uri;
    
    httplib::Client token_cli("https://github.com");
    httplib::Headers headers = {{"Accept", "application/json"}};
    auto token_res = token_cli.Post("/login/oauth/access_token", headers, post_body, "application/x-www-form-urlencoded");
    
    if (!token_res || token_res->status != 200) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Ошибка</h1><p>Не удалось получить токен от GitHub.</p>", "text/html; charset=utf-8");
        return;
    }
    
    json token_data = json::parse(token_res->body);
    std::string github_access_token = token_data["access_token"].get<std::string>();
    
    httplib::Client github_cli("https://api.github.com");
    httplib::Headers user_headers = {{"Authorization", "Bearer " + github_access_token}};
    auto user_res = github_cli.Get("/user", user_headers);
    
    if (!user_res || user_res->status != 200) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Ошибка</h1><p>Не удалось получить данные пользователя.</p>", "text/html; charset=utf-8");
        return;
    }
    
    json user_data = json::parse(user_res->body);
    std::string email;
    
    if (user_data.contains("email") && !user_data["email"].is_null()) {
        email = user_data["email"].get<std::string>();
    } else {
        auto emails_res = github_cli.Get("/user/emails", user_headers);
        if (emails_res && emails_res->status == 200) {
            json emails_data = json::parse(emails_res->body);
            for (const auto& email_entry : emails_data) {
                if (email_entry.contains("primary") && email_entry["primary"].get<bool>()) {
                    email = email_entry["email"].get<std::string>();
                    break;
                }
            }
        }
    }
    
    if (email.empty()) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Ошибка</h1><p>Не удалось получить email пользователя.</p>", "text/html; charset=utf-8");
        return;
    }
    
    auto user_opt = mongo_db->find_user_by_email(email);
    
    if (!user_opt) {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(1000, 9999);
        std::string username = "Аноним" + std::to_string(dis(gen));
        
        mongo_db->create_user(email, username);
    }
    
    send_user_to_main_module(session.user_id_front, email);
    
    std::string user_id = "github_user_" + email.substr(0, email.find('@'));
    
    std::string jwt_access_token = jwt_handler->generate_access_token(user_id, email);
    std::string jwt_refresh_token = jwt_handler->generate_refresh_token(user_id, email);
    
    mongo_db->add_refresh_token(email, jwt_refresh_token);
    
    session.status = AuthStatus::GRANTED;
    session.access_token = jwt_access_token;
    session.refresh_token = jwt_refresh_token;
    session.user_id = user_id;
    
    storage.update_session(session);
    
    res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через GitHub.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
}