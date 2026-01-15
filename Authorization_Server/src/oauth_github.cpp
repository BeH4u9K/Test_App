#include "../include/oauth_github.hpp"
#include "../include/utils.hpp"
#include <iostream>
#include <sstream>

using json = nlohmann::json;
using namespace httplib;

void handle_github_callback(
    const Request& req,
    Response& res,
    SessionStorage& storage,
    const json& config
) {
    std::string code = req.get_param_value("code");
    std::string oauth_state = req.get_param_value("state");
    std::string error = req.get_param_value("error");
    std::string error_description = req.get_param_value("error_description");
    
    std::cout << "=== GITHUB CALLBACK START ===" << std::endl;
    std::cout << "GET /callback/github - code: " << code << ", oauth_state: " << oauth_state << ", error: " << error << std::endl;

    if (!error.empty()) {
        std::cout << "GitHub returned error: " << error;
        if (!error_description.empty()) {
            std::cout << " - " << error_description;
        }
        std::cout << std::endl;
        
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        
        res.set_content("<h1>Авторизация отменена</h1><p>Вы отказались от авторизации через GitHub.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
        return;
    }
    
    if (code.empty() || oauth_state.empty()) {
        res.set_content("<h1>Ошибка</h1><p>Отсутствуют необходимые параметры.</p>", "text/html; charset=utf-8");
        return;
    }

    auto session_opt = storage.get_and_update_session_by_oauth_state(oauth_state, [&](AuthSession& session) {
            std::cout << "Processing session for login_token: " << session.login_token << std::endl;
            
            if (!config.contains("github") || !config["github"].contains("client_id") || 
                !config["github"].contains("client_secret") || !config["github"].contains("redirect_uri")) {
                throw std::runtime_error("GitHub config missing or incomplete");
            }
            
            std::string client_id = config["github"]["client_id"].get<std::string>();
            std::string client_secret = config["github"]["client_secret"].get<std::string>();
            std::string redirect_uri = config["github"]["redirect_uri"].get<std::string>();
            
            if (client_id.empty() || client_secret.empty() || redirect_uri.empty()) {
                throw std::runtime_error("GitHub client_id, client_secret or redirect_uri is empty");
            }
            
            std::string post_body = "client_id=" + client_id + "&client_secret=" + client_secret +
                "&code=" + code + "&redirect_uri=" + redirect_uri;
            
            std::cout << "Requesting token from GitHub..." << std::endl;

            httplib::Client token_cli("https://github.com");
            token_cli.enable_server_certificate_verification(false);
            token_cli.set_connection_timeout(30);
            token_cli.set_read_timeout(30);

            httplib::Headers headers = {
                {"Accept", "application/json"},
                {"Content-Type", "application/x-www-form-urlencoded"},
                {"User-Agent", "Authorization-Server/1.0"}
            };

            auto res = token_cli.Post("/login/oauth/access_token", headers, post_body, "application/x-www-form-urlencoded");

            if (!res) {
                std::cerr << "ERROR: Connection to GitHub failed" << std::endl;
                throw std::runtime_error("Failed to connect to GitHub");
            }

            if (res->status != 200) {
                std::cerr << "ERROR: GitHub returned status " << res->status << std::endl;
                std::cerr << "Response: " << res->body << std::endl;
                throw std::runtime_error("GitHub API error: " + std::to_string(res->status));
            }

            json token_data;
            try {
                token_data = json::parse(res->body);
            } catch (const json::exception& e) {
                std::cerr << "ERROR: Failed to parse JSON from GitHub: " << e.what() << std::endl;
                std::cerr << "Raw response: " << res->body << std::endl;
                throw std::runtime_error("Failed to parse GitHub response: " + std::string(e.what()));
            }

            if (!token_data.contains("access_token") || token_data["access_token"].is_null()) {
                std::cerr << "ERROR: No access_token in response" << std::endl;
                std::cerr << "Full response: " << token_data.dump() << std::endl;
                throw std::runtime_error("Не удалось получить access_token от GitHub");
            }
            
            std::string github_access_token = token_data["access_token"].get<std::string>();
            std::cout << "GitHub access token received (first 20 chars): " 
                      << github_access_token.substr(0, std::min(20, (int)github_access_token.length())) 
                      << "..." << std::endl;

            httplib::Client cli("https://api.github.com");
            cli.set_connection_timeout(5);
            cli.set_read_timeout(5);
            
            httplib::Headers user_headers = {
                {"Authorization", "Bearer " + github_access_token},
                {"Accept", "application/json"},
                {"User-Agent", "Authorization-Server/1.0"}
            };
            
            std::cout << "Requesting user info from GitHub..." << std::endl;
            auto user_res = cli.Get("/user", user_headers);
            
            if (!user_res) {
                throw std::runtime_error("Failed to connect to api.github.com");
            }
            
            std::cout << "User info status: " << user_res->status << std::endl;
            
            if (user_res->status != 200) {
                throw std::runtime_error("Failed to get user data from GitHub. Status: " + 
                    std::to_string(user_res->status) + "\nResponse: " + user_res->body);
            }
            
            json user_data;
            try {
                user_data = json::parse(user_res->body);
            } catch (const json::exception& e) {
                throw std::runtime_error("Failed to parse user data: " + std::string(e.what()));
            }
            
            std::string email;
            
            if (user_data.contains("email") && !user_data["email"].is_null()) {
                email = user_data["email"].get<std::string>();
                std::cout << "GitHub user email from profile: " << email << std::endl;
            } else {
                std::cout << "Email not in profile, requesting email list..." << std::endl;
                auto emails_res = cli.Get("/user/emails", user_headers);
                
                if (emails_res && emails_res->status == 200) {
                    try {
                        json emails_data = json::parse(emails_res->body);
                        if (emails_data.is_array() && !emails_data.empty()) {
                            for (const auto& email_entry : emails_data) {
                                if (email_entry.contains("primary") && email_entry["primary"].get<bool>() &&
                                    email_entry.contains("email") && !email_entry["email"].is_null()) {
                                    email = email_entry["email"].get<std::string>();
                                    std::cout << "GitHub user email from emails list (primary): " << email << std::endl;
                                    break;
                                }
                            }
                            if (email.empty()) {
                                for (const auto& email_entry : emails_data) {
                                    if (email_entry.contains("verified") && email_entry["verified"].get<bool>() &&
                                        email_entry.contains("email") && !email_entry["email"].is_null()) {
                                        email = email_entry["email"].get<std::string>();
                                        std::cout << "GitHub user email from emails list (verified): " << email << std::endl;
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (const json::exception& e) {
                        std::cerr << "Failed to parse emails data: " << e.what() << std::endl;
                    }
                }
            }
            
            if (email.empty()) {
                std::cerr << "ERROR: No email found in GitHub user data" << std::endl;
                std::cerr << "Full user data: " << user_data.dump() << std::endl;

                if (user_data.contains("id") && !user_data["id"].is_null()) {
                    std::string github_id = std::to_string(user_data["id"].get<int>());
                    email = "github_" + github_id + "@github.com";
                    std::cout << "Using generated email: " << email << std::endl;
                } else {
                    throw std::runtime_error("Не удалось получить email или ID пользователя от GitHub");
                }
            }
            
            // mongodb
            
            bool user_exists = false;
            
            if (user_exists) {
                std::vector<std::string> roles = {"Student"};
                std::cout << "User found in database, roles: ";
                for (const auto& role : roles) {
                    std::cout << role << " ";
                }
                std::cout << std::endl;
            } else {
                std::cout << "Creating new user account for email: " << email << std::endl;
                std::string username = "Аноним" + std::to_string(rand() % 10000);
                std::vector<std::string> roles = {"Student"};
                std::cout << "Created user: " << username << " with role: Student" << std::endl;
            }
            
            std::vector<std::string> permissions = {"read:profile", "write:profile"};
            
            // jwt токены

            std::string jwt_access_token = "github_access_" + generate_state_token() + "_" + 
                std::to_string(std::time(nullptr) + 60);
            std::cout << "Generated JWT access token (placeholder)" << std::endl;
            
            std::string jwt_refresh_token = "github_refresh_" + generate_state_token() + "_" +
                std::to_string(std::time(nullptr) + 7*24*60*60);
            std::cout << "Generated JWT refresh token (placeholder)" << std::endl;
            
            std::cout << "Refresh token saved to database (placeholder)" << std::endl;
            
            session.status = AuthStatus::GRANTED;
            session.access_token = jwt_access_token;
            session.refresh_token = jwt_refresh_token;
            session.user_id = "github_user_" + email.substr(0, email.find('@'));
            
            std::cout << "Session updated successfully for user: " << *session.user_id << std::endl;
        }
    );
    
    if (!session_opt) {
        std::cout << "ERROR: Session not found or update failed for state: " << oauth_state << std::endl;
        res.set_content("<h1>Ошибка</h1><p>Сессия не найдена или истекла.</p>", "text/html; charset=utf-8");
        return;
    }
    
    std::cout << "Authorization granted for user: " << *session_opt->user_id << ", login_token: " << session_opt->login_token << std::endl;
    std::cout << "=== GITHUB CALLBACK SUCCESS ===" << std::endl;
    
    res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через GitHub.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
}