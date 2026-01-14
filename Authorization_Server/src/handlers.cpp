#include "../include/handlers.hpp"
#include "../include/utils.hpp"
#include "../include/oauth_github.hpp"
#include "../include/oauth_yandex.hpp"
#include <iostream>
#include <random>

using json = nlohmann::json;
using namespace httplib;

void register_handlers(
    Server& server,
    SessionStorage& session_storage,
    const json& config
) {
    // обработчик для OPTIONS запросов (preflight CORS)
    server.Options(R"(.*)", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        res.status = 200;
    });

    // эндпоинт /auth - начало авторизации
    server.Get("/auth", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        std::string provider = req.get_param_value("provider");
        std::string login_token = req.get_param_value("login_token");
        
        std::cout << "GET /auth - provider: " << provider << ", login_token: " << login_token << std::endl;
        
        if (provider.empty() || login_token.empty()) {
            res.status = 400;
            json error_response = {
                {"error", "Missing parameters"},
                {"required", {"provider", "login_token"}}
            };

            res.set_content(error_response.dump(), "application/json");
            return;
        }
        
        std::string oauth_state = generate_state_token();
        auto now = std::chrono::system_clock::now();
        
        AuthSession session{
            login_token,
            oauth_state,
            provider,
            now,
            now + std::chrono::minutes(5),
            AuthStatus::PENDING,
            std::nullopt, // access_token
            std::nullopt, // refresh_token
            std::nullopt // user_id
        };
    
        session_storage.add_session(session);
        std::cout << "Created session - login_token: " << login_token << ", oauth_state: " << oauth_state << std::endl;
        
        json response;
        response["oauth_state"] = oauth_state;
        response["expires_at"] = std::chrono::duration_cast<std::chrono::seconds>(session.expires_at.time_since_epoch()).count();

        if (provider == "github") {
            std::string redirect_uri;
            std::string client_id;

            if (config.contains("github") && config["github"].is_object() && config["github"].contains("client_id") && 
                config["github"]["client_id"].is_string() && !config["github"]["client_id"].get<std::string>().empty() &&
                config["github"].contains("redirect_uri") && config["github"]["redirect_uri"].is_string() &&
                !config["github"]["redirect_uri"].get<std::string>().empty()) {
                    client_id = config["github"]["client_id"].get<std::string>();
                    redirect_uri = config["github"]["redirect_uri"].get<std::string>();
            } else {
                res.status = 500;
                json error_response = {
                    {"error", "GitHub OAuth not configured properly"},
                    {"message", "Check your config/config.json file"}
                };

                res.set_content(error_response.dump(), "application/json");
                return;
            }
            
            std::string url = "https://github.com/login/oauth/authorize?client_id=" + client_id + 
                "&redirect_uri=" + redirect_uri + "&state=" + oauth_state + "&scope=user:email";
                
            response["auth_url"] = url;

        } else if (provider == "yandex") {
            std::string redirect_uri;
            std::string client_id;
            
            if (config.contains("yandex") && config["yandex"].is_object() && config["yandex"].contains("client_id") && 
                config["yandex"]["client_id"].is_string() && !config["yandex"]["client_id"].get<std::string>().empty() &&
                config["yandex"].contains("redirect_uri") && config["yandex"]["redirect_uri"].is_string() &&
                !config["yandex"]["redirect_uri"].get<std::string>().empty()) {
                    client_id = config["yandex"]["client_id"].get<std::string>();
                    redirect_uri = config["yandex"]["redirect_uri"].get<std::string>();
            } else {
                res.status = 500;
                json error_response = {
                    {"error", "Yandex OAuth not configured properly"},
                    {"message", "Check your config/config.json file"}
                };
                
                res.set_content(error_response.dump(), "application/json");
                return;
            }
            
            std::string url = "https://oauth.yandex.ru/authorize?response_type=code" + std::string("&client_id=") + 
                client_id + "&redirect_uri=" + redirect_uri + "&state=" + oauth_state;
                
            response["auth_url"] = url;
            
        } else if (provider == "code") {
            std::random_device rd;
            std::mt19937 gen(rd());
            std::uniform_int_distribution<> dis(100000, 999999);
            std::string code = std::to_string(dis(gen));
            
            response["auth_type"] = "code";
            response["code"] = code;
            response["message"] = "Enter this code in your authorized device";
            
        } else {
            res.status = 400;
            json error_response = {
                {"error", "Unsupported auth type"},
                {"supported_types", {"github", "yandex", "code"}}
            };
            res.set_content(error_response.dump(), "application/json");
            return;
        }
        
        res.set_content(response.dump(), "application/json");
    });

    // эндпоинт /check - проверка статуса авторизации
    server.Get("/check", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        std::string login_token = req.get_param_value("login_token");
        
        if (login_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"Missing parameter: login_token\"}", "application/json");
            return;
        }
        
        auto session_opt = session_storage.get_session_by_login(login_token);
        if (!session_opt) {
            json response = {
                {"status", "not_found"},
                {"message", "Session not found or already finalized"}
            };
            res.set_content(response.dump(), "application/json");
            return;
        }
        
        AuthSession session = *session_opt;
        
        if (session.is_expired()) {
            session.status = AuthStatus::EXPIRED;
            session_storage.update_session(session);
        }
        
        json response = {
            {"status", ""},
            {"provider", session.provider}
        };
        
        switch (session.status) {
            case AuthStatus::PENDING:
                response["status"] = "pending";
                response["expires_in"] = std::chrono::duration_cast<std::chrono::seconds>(session.expires_at - std::chrono::system_clock::now()).count();
                break;
                
            case AuthStatus::GRANTED:
                response["status"] = "granted";
                if (session.access_token) {
                    response["access_token"] = *session.access_token;
                }
                if (session.refresh_token) {
                    response["refresh_token"] = *session.refresh_token;
                }
                if (session.user_id) {
                    response["user_id"] = *session.user_id;
                }
                session_storage.remove_session_by_login(login_token);
                break;
            
            case AuthStatus::DENIED:
                response["status"] = "denied";
                session_storage.remove_session_by_login(login_token);
                break;
            
            case AuthStatus::EXPIRED:
                response["status"] = "expired";
                session_storage.remove_session_by_login(login_token);
                break;
        }
        
        res.set_content(response.dump(), "application/json");
    });

    // callback от github
    server.Get("/callback/github", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        handle_github_callback(req, res, session_storage, config);
    });

    // callback от yandex
    server.Get("/callback/yandex", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        handle_yandex_callback(req, res, session_storage, config);
    });

    // обновление токенов
    server.Post("/refresh", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        try {
            json body = json::parse(req.body);
            std::string refresh_token = body.value("refresh_token", "");
            
            if (refresh_token.empty()) {
                res.status = 400;
                res.set_content("{\"error\":\"refresh_token is required\"}", "application/json");
                return;
            }
            
            std::cout << "POST /refresh - refresh_token: " << refresh_token << std::endl;

            if (refresh_token.find("_refresh_") == std::string::npos) {
                res.status = 401;
                res.set_content("{\"error\":\"Invalid refresh token\"}", "application/json");
                return;
            }

            std::string user_id = "user_example";

            std::string new_access_token = "new_access_" + generate_state_token();
            std::string new_refresh_token = "new_refresh_" + generate_state_token();
            
            json response = {
                {"access_token", new_access_token},
                {"refresh_token", new_refresh_token}
            };
            
            res.set_content(response.dump(), "application/json");
            
        } catch (const json::exception& e) {
            res.status = 400;
            res.set_content("{\"error\":\"Invalid JSON format\"}", "application/json");
        }
    });
    
    // выход из системы
    server.Post("/logout", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        try {
            json body = json::parse(req.body);
            std::string refresh_token = body.value("refresh_token", "");
            
            if (refresh_token.empty()) {
                res.status = 400;
                res.set_content("{\"error\":\"refresh_token is required\"}", "application/json");
                return;
            }
            
            std::cout << "POST /logout - refresh_token: " << refresh_token << std::endl;
            
            if (refresh_token.find("_refresh_") == std::string::npos) {
                res.status = 401;
                res.set_content("{\"error\":\"Invalid refresh token\"}", "application/json");
                return;
            }
            
            json response = {
                {"message", "Logged out successfully"}
            };
            
            res.set_content(response.dump(), "application/json");
            
        } catch (const json::exception& e) {
            res.status = 400;
            res.set_content("{\"error\":\"Invalid JSON format\"}", "application/json");
        }
    });
}
