#include "../include/oauth_yandex.hpp"
#include "../include/utils.hpp"
#include "../include/mongodb.hpp"
#include "../include/jwt_token.hpp"
#include <iostream>
#include <random>

using json = nlohmann::json;
using namespace httplib;

void handle_yandex_callback(
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
        res.set_content("<h1>Авторизация отменена</h1><p>Вы отказались от авторизации через Яндекс.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
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
    
    std::string client_id = config["yandex"]["client_id"].get<std::string>();
    std::string client_secret = config["yandex"]["client_secret"].get<std::string>();
    
    std::string post_body = "grant_type=authorization_code&code=" + code +
        "&client_id=" + client_id + "&client_secret=" + client_secret;
    
    httplib::Client cli("https://oauth.yandex.ru");
    auto token_res = cli.Post("/token", post_body, "application/x-www-form-urlencoded");
    
    if (!token_res || token_res->status != 200) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Ошибка</h1><p>Не удалось получить токен от Яндекс.</p>", "text/html; charset=utf-8");
        return;
    }
    
    json token_data = json::parse(token_res->body);
    std::string yandex_access_token = token_data["access_token"].get<std::string>();
    
    httplib::Client yandex_cli("https://login.yandex.ru");
    httplib::Headers headers = {{"Authorization", "OAuth " + yandex_access_token}};
    auto user_res = yandex_cli.Get("/info?format=json", headers);
    
    if (!user_res || user_res->status != 200) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Ошибка</h1><p>Не удалось получить данные пользователя.</p>", "text/html; charset=utf-8");
        return;
    }
    
    json user_data = json::parse(user_res->body);
    std::string email = user_data["default_email"].get<std::string>();
    
    auto user_opt = mongo_db->find_user_by_email(email);
    
    if (!user_opt) {
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(1000, 9999);
        std::string username = "Аноним" + std::to_string(dis(gen));
        
        mongo_db->create_user(email, username);
    }

    send_user_to_main_module(email);
    
    std::string user_id = "yandex_user_" + email.substr(0, email.find('@'));
    
    std::string jwt_access_token = jwt_handler->generate_access_token(user_id, email);
    std::string jwt_refresh_token = jwt_handler->generate_refresh_token(user_id, email);
    
    mongo_db->add_refresh_token(email, jwt_refresh_token);
    
    session.status = AuthStatus::GRANTED;
    session.access_token = jwt_access_token;
    session.refresh_token = jwt_refresh_token;
    session.user_id = user_id;
    
    storage.update_session(session);
    
    res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через Яндекс.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
}