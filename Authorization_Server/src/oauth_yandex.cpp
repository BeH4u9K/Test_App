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
    
    std::cout << "=== YANDEX CALLBACK START ===" << std::endl;
    std::cout << "GET /callback/yandex - code: " << code << ", oauth_state: " << oauth_state  << ", error: " << error << std::endl;

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
            
            if (!config.contains("yandex") || !config["yandex"].contains("client_id") || !config["yandex"].contains("client_secret")) {
                throw std::runtime_error("Yandex config missing or incomplete");
            }
            
            std::string client_id = config["yandex"]["client_id"].get<std::string>();
            std::string client_secret = config["yandex"]["client_secret"].get<std::string>();
            
            if (client_id.empty() || client_secret.empty()) {
                throw std::runtime_error("Yandex client_id or client_secret is empty");
            }
            
            std::string post_body = "grant_type=authorization_code" + std::string("&code=") + code +
                "&client_id=" + client_id + "&client_secret=" + client_secret;
            
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
                throw std::runtime_error("Failed to get user data from Yandex. Status: " + std::to_string(user_res->status));
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

            bool user_exists = false;
            std::vector<std::string> user_roles;
            
            if (mongo_db) {
                auto user_opt = mongo_db->find_user_by_email(email);
                if (user_opt) {
                    user_exists = true;
                    user_roles = user_opt->roles;
                    
                    std::cout << "User found in database, roles: ";
                    for (const auto& role : user_roles) {
                        std::cout << role << " ";
                    }
                    std::cout << std::endl;
                } else {
                    std::cout << "Creating new user account for email: " << email << std::endl;
                    
                    std::random_device rd;
                    std::mt19937 gen(rd());
                    std::uniform_int_distribution<> dis(1000, 9999);
                    std::string username = "Аноним" + std::to_string(dis(gen));
                    
                    user_roles = {"Student"};
                    
                    if (mongo_db->create_user(email, username, user_roles)) {
                        std::cout << "Created user: " << username << " with role: Student" << std::endl;
                        user_exists = true;
                    } else {
                        std::cerr << "ERROR: Failed to create user in database" << std::endl;
                    }
                }
            } else {
                std::cout << "WARNING: MongoDB not available, using default roles" << std::endl;
                user_roles = {"Student"};
                user_exists = true;
            }
            
            std::vector<std::string> permissions = JWTHandler::get_permissions_for_roles(user_roles);
            
            std::cout << "User permissions: ";
            for (const auto& perm : permissions) {
                std::cout << perm << " ";
            }
            std::cout << std::endl;

            std::string user_id = "yandex_user_" + email.substr(0, email.find('@'));
    
            std::string jwt_access_token = jwt_handler->generate_access_token(
                user_id, email, user_roles, permissions
            );

            std::string jwt_refresh_token = jwt_handler->generate_refresh_token(user_id, email);
            
            std::cout << "Generated JWT access token: " << jwt_access_token.substr(0, 50) << "..." << std::endl;
            std::cout << "Generated JWT refresh token: " << jwt_refresh_token.substr(0, 50) << "..." << std::endl;

            if (mongo_db && user_exists) {
                if (mongo_db->add_refresh_token(email, jwt_refresh_token)) {
                    std::cout << "Refresh token saved to database" << std::endl;
                } else {
                    std::cerr << "ERROR: Failed to save refresh token to database" << std::endl;
                }
            }

            session.status = AuthStatus::GRANTED;
            session.access_token = jwt_access_token;
            session.refresh_token = jwt_refresh_token;
            session.user_id = user_id;
            
            std::cout << "Session updated successfully" << std::endl;
        }
    );
    
    if (!session_opt) {
        std::cout << "ERROR: Session not found or update failed for state: " << oauth_state << std::endl;
        res.set_content("<h1>Ошибка</h1><p>Сессия не найдена или истекла.</p>", "text/html; charset=utf-8");
        return;
    }
    
    std::cout << "Authorization granted for user: " << *session_opt->user_id << ", login_token: " << session_opt->login_token << std::endl;
    std::cout << "=== YANDEX CALLBACK SUCCESS ===" << std::endl;
    
    res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через Яндекс.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
}