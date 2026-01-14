#include "../include/oauth_yandex.hpp"
#include "../include/utils.hpp"
#include <iostream>

using json = nlohmann::json;
using namespace httplib;

void handle_yandex_callback(
    const Request& req,
    Response& res,
    SessionStorage& storage,
    const json& config
) {
    std::string code = req.get_param_value("code");
    std::string oauth_state = req.get_param_value("state");
    std::string error = req.get_param_value("error");
    
    std::cout << "=== YANDEX CALLBACK START ===" << std::endl;
    std::cout << "GET /callback/yandex - code: " << code 
              << ", oauth_state: " << oauth_state 
              << ", error: " << error << std::endl;

    if (!error.empty()) {
        std::cout << "Yandex returned error: " << error << std::endl;
        
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        
        res.set_content("<h1>Авторизация отменена</h1><p>Вы отказались от авторизации через Яндекс.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
        return;
    }
    
    if (code.empty() || oauth_state.empty()) {
        res.set_content("<h1>Ошибка</h1><p>Отсутствуют необходимые параметры.</p>", "text/html; charset=utf-8");
        return;
    }

    auto session_opt = storage.get_and_update_session_by_oauth_state(
        oauth_state,
        [&](AuthSession& session) {
            std::cout << "Processing session for login_token: " << session.login_token << std::endl;
            
            // Проверяем конфигурацию
            if (!config.contains("yandex") || !config["yandex"].contains("client_id") || 
                !config["yandex"].contains("client_secret")) {
                throw std::runtime_error("Yandex config missing or incomplete");
            }
            
            std::string client_id = config["yandex"]["client_id"].get<std::string>();
            std::string client_secret = config["yandex"]["client_secret"].get<std::string>();
            
            if (client_id.empty() || client_secret.empty()) {
                throw std::runtime_error("Yandex client_id or client_secret is empty");
            }
            
            // Получаем токен от Яндекс
            std::string post_body = "grant_type=authorization_code" + 
                                   std::string("&code=") + code +
                                   "&client_id=" + client_id + 
                                   "&client_secret=" + client_secret;
            
            std::cout << "Requesting token from Yandex..." << std::endl;
            auto token_response = http_post("https://oauth.yandex.ru", "/token", post_body);
            
            if (!token_response) {
                throw std::runtime_error("Failed to exchange code for Yandex token");
            }
            
            std::cout << "Token response received" << std::endl;
            
            json token_data;
            try {
                token_data = json::parse(*token_response);
            } catch (const json::exception& e) {
                throw std::runtime_error("Failed to parse token response: " + std::string(e.what()));
            }
            
            if (!token_data.contains("access_token") || token_data["access_token"].is_null()) {
                std::cerr << "ERROR: No access_token in response" << std::endl;
                std::cerr << "Full response: " << token_data.dump() << std::endl;
                throw std::runtime_error("Не удалось получить access_token от Яндекс");
            }
            
            std::string yandex_access_token = token_data["access_token"].get<std::string>();
            std::cout << "Yandex access token received (first 20 chars): " 
                      << yandex_access_token.substr(0, std::min(20, (int)yandex_access_token.length())) 
                      << "..." << std::endl;

            // Получаем данные пользователя
            httplib::Client cli("https://login.yandex.ru");
            cli.set_connection_timeout(5);
            cli.set_read_timeout(5);
            
            httplib::Headers headers = {
                {"Authorization", "OAuth " + yandex_access_token}
            };
            
            std::cout << "Requesting user info from Yandex..." << std::endl;
            auto user_res = cli.Get("/info?format=json", headers);
            
            if (!user_res) {
                throw std::runtime_error("Failed to connect to login.yandex.ru");
            }
            
            std::cout << "User info status: " << user_res->status << std::endl;
            
            if (user_res->status != 200) {
                throw std::runtime_error("Failed to get user data from Yandex. Status: " + 
                                         std::to_string(user_res->status));
            }
            
            json user_data;
            try {
                user_data = json::parse(user_res->body);
            } catch (const json::exception& e) {
                throw std::runtime_error("Failed to parse user data: " + std::string(e.what()));
            }
            
            if (!user_data.contains("default_email") || user_data["default_email"].is_null()) {
                std::cerr << "ERROR: No default_email in user data" << std::endl;
                std::cerr << "Full user data: " << user_data.dump() << std::endl;
                throw std::runtime_error("Не удалось получить email пользователя от Яндекс");
            }
            
            std::string email = user_data["default_email"].get<std::string>();
            std::cout << "Yandex user email: " << email << std::endl;
            
            // Генерируем токены
            std::string jwt_access_token = "yandex_access_" + generate_state_token();
            std::string jwt_refresh_token = "yandex_refresh_" + generate_state_token();
            
            // Обновляем сессию
            session.status = AuthStatus::GRANTED;
            session.access_token = jwt_access_token;
            session.refresh_token = jwt_refresh_token;
            session.user_id = "yandex_user_" + email.substr(0, email.find('@'));
            
            std::cout << "Session updated successfully" << std::endl;
        }
    );
    
    if (!session_opt) {
        std::cout << "ERROR: Session not found or update failed for state: " << oauth_state << std::endl;
        res.set_content("<h1>Ошибка</h1><p>Сессия не найдена или истекла.</p>", "text/html; charset=utf-8");
        return;
    }
    
    std::cout << "Authorization granted for user: " << *session_opt->user_id 
              << ", login_token: " << session_opt->login_token << std::endl;
    std::cout << "=== YANDEX CALLBACK SUCCESS ===" << std::endl;
    
    res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через Яндекс.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
}