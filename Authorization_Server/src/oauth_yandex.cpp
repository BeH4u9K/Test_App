#include "../include/oauth_yandex.hpp"
#include "../include/utils.hpp"
#include "../include/jwt_utils.hpp"
#include "../include/mongodb_utils.hpp"
#include <iostream>
#include <sstream>

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
    std::string error_description = req.get_param_value("error_description");
    
    std::cout << "=== YANDEX CALLBACK START ===" << std::endl;
    std::cout << "GET /callback/yandex - code: " << code << ", oauth_state: " << oauth_state << ", error: " << error << std::endl;

    if (!error.empty()) {
        std::cout << "Yandex returned error: " << error;
        if (!error_description.empty()) {
            std::cout << " - " << error_description;
        }
        std::cout << std::endl;
        
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
            
            if (!config.contains("yandex") || !config["yandex"].contains("client_id") || 
                !config["yandex"].contains("client_secret") || !config["yandex"].contains("redirect_uri")) {
                throw std::runtime_error("Yandex config missing or incomplete");
            }
            
            std::string client_id = config["yandex"]["client_id"].get<std::string>();
            std::string client_secret = config["yandex"]["client_secret"].get<std::string>();
            std::string redirect_uri = config["yandex"]["redirect_uri"].get<std::string>();
            
            if (client_id.empty() || client_secret.empty() || redirect_uri.empty()) {
                throw std::runtime_error("Yandex client_id, client_secret or redirect_uri is empty");
            }
            
            std::string post_body = "grant_type=authorization_code&code=" + code +
                "&client_id=" + client_id + "&client_secret=" + client_secret;
            
            std::cout << "Requesting token from Yandex..." << std::endl;

            httplib::Client token_cli("https://oauth.yandex.ru");
            token_cli.enable_server_certificate_verification(false);
            token_cli.set_connection_timeout(30);
            token_cli.set_read_timeout(30);

            httplib::Headers headers = {
                {"Content-Type", "application/x-www-form-urlencoded"},
                {"Accept", "application/json"}
            };

            auto token_res = token_cli.Post("/token", headers, post_body, "application/x-www-form-urlencoded");

            if (!token_res) {
                std::cerr << "ERROR: Connection to Yandex failed" << std::endl;
                throw std::runtime_error("Failed to connect to Yandex OAuth");
            }

            if (token_res->status != 200) {
                std::cerr << "ERROR: Yandex returned status " << token_res->status << std::endl;
                std::cerr << "Response: " << token_res->body << std::endl;
                throw std::runtime_error("Yandex API error: " + std::to_string(token_res->status));
            }

            json token_data;
            try {
                token_data = json::parse(token_res->body);
            } catch (const json::exception& e) {
                std::cerr << "ERROR: Failed to parse JSON from Yandex: " << e.what() << std::endl;
                std::cerr << "Raw response: " << token_res->body << std::endl;
                throw std::runtime_error("Failed to parse Yandex response: " + std::string(e.what()));
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

            httplib::Client user_cli("https://login.yandex.ru");
            user_cli.set_connection_timeout(5);
            user_cli.set_read_timeout(5);
            
            httplib::Headers user_headers = {
                {"Authorization", "OAuth " + yandex_access_token},
                {"Accept", "application/json"}
            };
            
            std::cout << "Requesting user info from Yandex..." << std::endl;
            auto user_res = user_cli.Get("/info?format=json", user_headers);
            
            if (!user_res) {
                throw std::runtime_error("Failed to connect to login.yandex.ru");
            }
            
            std::cout << "User info status: " << user_res->status << std::endl;
            
            if (user_res->status != 200) {
                throw std::runtime_error("Failed to get user data from Yandex. Status: " + 
                    std::to_string(user_res->status) + "\nResponse: " + user_res->body);
            }
            
            json user_data;
            try {
                user_data = json::parse(user_res->body);
            } catch (const json::exception& e) {
                throw std::runtime_error("Failed to parse user data: " + std::string(e.what()));
            }
            
            std::string email;
            std::string username;
            
            if (user_data.contains("default_email") && !user_data["default_email"].is_null()) {
                email = user_data["default_email"].get<std::string>();
                std::cout << "Yandex user email: " << email << std::endl;
            } else {
                std::cerr << "ERROR: No default_email in user data" << std::endl;
                std::cerr << "Full user data: " << user_data.dump() << std::endl;
                throw std::runtime_error("Не удалось получить email пользователя от Яндекс");
            }
            
            if (user_data.contains("real_name") && !user_data["real_name"].is_null()) {
                username = user_data["real_name"].get<std::string>();
                std::cout << "Yandex user real name: " << username << std::endl;
            } else if (user_data.contains("display_name") && !user_data["display_name"].is_null()) {
                username = user_data["display_name"].get<std::string>();
                std::cout << "Yandex user display name: " << username << std::endl;
            } else if (user_data.contains("first_name") && !user_data["first_name"].is_null() &&
                       user_data.contains("last_name") && !user_data["last_name"].is_null()) {
                username = user_data["first_name"].get<std::string>() + " " + 
                          user_data["last_name"].get<std::string>();
                std::cout << "Yandex user full name: " << username << std::endl;
            } else if (user_data.contains("login") && !user_data["login"].is_null()) {
                username = user_data["login"].get<std::string>();
                std::cout << "Yandex user login: " << username << std::endl;
            } else {
                username = "ЯндексПользователь";
                std::cout << "Using default username: " << username << std::endl;
            }

            auto user = mongodb_utils::find_or_create_user(email, "yandex", username);
            auto permissions = jwt_utils::generate_permissions_from_roles(user.roles);

            if (!config.contains("jwt") || !config["jwt"].contains("access_token_expiry") || 
                !config["jwt"].contains("refresh_token_expiry")) {
                throw std::runtime_error("JWT config missing or incomplete");
            }

            std::string jwt_access_token = jwt_utils::generate_access_token(
                email, 
                permissions,
                std::chrono::seconds(config["jwt"]["access_token_expiry"].get<int>())
            );

            std::string jwt_refresh_token = jwt_utils::generate_refresh_token(
                email,
                std::chrono::seconds(config["jwt"]["refresh_token_expiry"].get<int>())
            );

            mongodb_utils::save_refresh_token(user.id, jwt_refresh_token);

            session.status = AuthStatus::GRANTED;
            session.access_token = jwt_access_token;
            session.refresh_token = jwt_refresh_token;
            session.user_id = user.id;

            std::cout << "Session updated successfully for user: " << user.username 
                      << " (ID: " << user.id << ", Email: " << email << ")" << std::endl;
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