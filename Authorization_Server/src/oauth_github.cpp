#include "../include/oauth_github.hpp"
#include "../include/utils.hpp"
#include <iostream>

using json = nlohmann::json;
using namespace httplib;

void handle_github_callback(
    const Request& req,
    Response& res,
    SessionStorage& storage,
    const json& config
) {
    std::string code = req.get_param_value("code");
    std::string state = req.get_param_value("state");
    std::string error = req.get_param_value("error");
    std::string error_description = req.get_param_value("error_description");
        
    std::cout << "GET /callback/github - code: " << code << ", state: " << state 
        << ", error: " << error << ", error_desc: " << error_description << std::endl;
        
    if (!error.empty()) {
        std::cout << "GitHub returned error: " << error_description << std::endl;

        auto session_opt = storage.get_session_by_state(state);
        if (session_opt) {
            session_opt->status = AuthStatus::DENIED;
            storage.update_session(*session_opt);
        }
            
        res.set_content("<h1>Авторизация отменена</h1><p>Вы отказались от авторизации через GitHub.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
        return;
    }
        
    if (code.empty() || state.empty()) {
        res.set_content("<h1>Ошибка</h1><p>Отсутствуют необходимые параметры.</p>", "text/html; charset=utf-8");
        return;
    }
        
    auto session_opt = storage.get_session_by_state(state);
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
        
    auto token_response = http_post("https://github.com", "/login/oauth/access_token", post_body);
    if (!token_response) {
        std::cerr << "Failed to exchange code for token" << std::endl;
        res.set_content("<h1>Ошибка сервера</h1><p>Не удалось получить токен от GitHub.</p>", "text/html; charset=utf-8");
        return;
    }

    std::string response_body = *token_response;
    std::string access_token;
    size_t token_start = response_body.find("access_token=");
    if (token_start != std::string::npos) {
        token_start += 13;
        size_t token_end = response_body.find('&', token_start);
        if (token_end == std::string::npos) {
            access_token = response_body.substr(token_start);
        } else {
            access_token = response_body.substr(token_start, token_end - token_start);
        }
    }
        
    if (access_token.empty()) {
        std::cerr << "No access token in response: " << response_body << std::endl;
        res.set_content("<h1>Ошибка</h1><p>Не удалось получить токен доступа от GitHub.</p>", "text/html; charset=utf-8");
        return;
    }

    auto user_response = http_get_with_auth("https://api.github.com", "/user", access_token);
    if (!user_response) {
        std::cerr << "Failed to get user data from GitHub" << std::endl;
        res.set_content("<h1>Ошибка</h1><p>Не удалось получить данные пользователя от GitHub.</p>", "text/html; charset=utf-8");
        return;
    }
        
    try {
        json user_data = json::parse(*user_response);
        std::string email;

        if (user_data.contains("email") && !user_data["email"].is_null()) {
            email = user_data["email"].get<std::string>();
        } else {
            auto emails_response = http_get_with_auth("https://api.github.com", "/user/emails", access_token);
            if (emails_response) {
                json emails = json::parse(*emails_response);
                if (emails.is_array() && !emails.empty()) {
                    for (const auto& e : emails) {
                        if (e.contains("primary") && e["primary"].get<bool>() && 
                            e.contains("verified") && e["verified"].get<bool>()) {
                                email = e["email"].get<std::string>();
                                break;
                        }
                    }
                    if (email.empty()) {
                        for (const auto& e : emails) {
                            if (e.contains("verified") && e["verified"].get<bool>()) {
                                email = e["email"].get<std::string>();
                                break;
                            }
                        }
                    }
                }
            }
        }
            
        if (email.empty()) {
            throw std::runtime_error("Не удалось получить email пользователя от GitHub");
        }
            
        std::cout << "GitHub user email: " << email << std::endl;
            
        // mongdb

        std::string user_id = "user_" + email.substr(0, email.find('@'));
            
        // jwt токены

        std::string jwt_access_token = "github_access_" + generate_state_token();
        std::string jwt_refresh_token = "github_refresh_" + generate_state_token();

        session.status = AuthStatus::GRANTED;
        session.access_token = jwt_access_token;
        session.refresh_token = jwt_refresh_token;
        session.user_id = user_id;
        storage.update_session(session);
            
        std::cout << "Authorization granted for user: " << user_id << ", login_token: " << session.login_token << std::endl;

        res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через GitHub.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
            
    } catch (const std::exception& e) {
        std::cerr << "Error processing GitHub response: " << e.what() << std::endl;
        res.set_content("<h1>Ошибка</h1><p>Ошибка обработки данных пользователя: " + std::string(e.what()) + "</p>", "text/html; charset=utf-8");
        return;
    }
}
