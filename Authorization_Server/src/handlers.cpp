#include "../include/handlers.hpp"
#include "../include/utils.hpp"
#include "../include/oauth_github.hpp"
#include "../include/oauth_yandex.hpp"
#include "../include/mongodb.hpp"
#include "../include/oauth_code.hpp"
#include <iostream>
#include <random>

using json = nlohmann::json;
using namespace httplib;

void register_handlers(
    Server& server,
    SessionStorage& session_storage,
    const json& config,
    std::shared_ptr<MongoDB> mongo_db,
    std::shared_ptr<JWTHandler> jwt_handler
) {
    auto code_auth = std::make_shared<CodeAuthentication>();
    
    // OPTIONS handler
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
            res.set_content("{\"error\":\"Missing parameters\"}", "application/json");
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
            std::nullopt,
            std::nullopt,
            std::nullopt
        };
    
        session_storage.add_session(session);
        std::cout << "Created session - login_token: " << login_token << ", oauth_state: " << oauth_state << std::endl;
        
        json response;
        response["oauth_state"] = oauth_state;
        
        if (provider == "github") {
            if (!config.contains("github")) {
                res.status = 500;
                res.set_content("{\"error\":\"GitHub not configured\"}", "application/json");
                return;
            }
            
            std::string client_id = config["github"]["client_id"].get<std::string>();
            std::string redirect_uri = config["github"]["redirect_uri"].get<std::string>();
            std::string url = "https://github.com/login/oauth/authorize?client_id=" + client_id + 
                             "&redirect_uri=" + redirect_uri + "&response_type=code&state=" + oauth_state + 
                             "&scope=user:email";
            
            response["auth_url"] = url;
            response["redirect_required"] = true;
            
        } else if (provider == "yandex") {
            if (!config.contains("yandex")) {
                res.status = 500;
                res.set_content("{\"error\":\"Yandex not configured\"}", "application/json");
                return;
            }
            
            std::string client_id = config["yandex"]["client_id"].get<std::string>();
            std::string redirect_uri = config["yandex"]["redirect_uri"].get<std::string>();
            std::string url = "https://oauth.yandex.ru/authorize?response_type=code&client_id=" + 
                             client_id + "&redirect_uri=" + redirect_uri + "&state=" + oauth_state;
            
            response["auth_url"] = url;
            response["redirect_required"] = true;
            
        } else if (provider == "code") {
            std::string auth_code = code_auth->generate_code(login_token);
            response["code"] = auth_code;
            response["expires_in"] = 60;
            
        } else {
            res.status = 400;
            res.set_content("{\"error\":\"Unsupported provider\"}", "application/json");
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
            res.set_content("{\"error\":\"Missing login_token\"}", "application/json");
            return;
        }
        
        auto session_opt = session_storage.get_session_by_login(login_token);
        if (!session_opt) {
            json response = {{"status", "not_found"}};
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
                if (session.access_token) response["access_token"] = *session.access_token;
                if (session.refresh_token) response["refresh_token"] = *session.refresh_token;
                if (session.user_id) response["user_id"] = *session.user_id;
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
        handle_github_callback(req, res, session_storage, config, mongo_db, jwt_handler);
    });

    // callback от yandex
    server.Get("/callback/yandex", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        handle_yandex_callback(req, res, session_storage, config, mongo_db, jwt_handler);
    });

    // обновление токенов
    server.Post("/refresh", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        json body;
        try {
            body = json::parse(req.body);
        } catch (...) {
            res.status = 400;
            res.set_content("{\"error\":\"Invalid JSON\"}", "application/json");
            return;
        }
        
        std::string refresh_token = body.value("refresh_token", "");
        
        if (refresh_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"refresh_token required\"}", "application/json");
            return;
        }
    
        std::cout << "POST /refresh - refresh_token: " << refresh_token.substr(0, 20) << "..." << std::endl;

        if (!jwt_handler->validate_token(refresh_token)) {
            res.status = 401;
            res.set_content("{\"error\":\"Invalid refresh token\"}", "application/json");
            return;
        }
        
        auto email_opt = jwt_handler->get_email(refresh_token);
        if (!email_opt) {
            res.status = 401;
            res.set_content("{\"error\":\"Cannot extract email\"}", "application/json");
            return;
        }
        
        auto user_opt = mongo_db->find_user_by_email(*email_opt);
        if (!user_opt) {
            res.status = 404;
            res.set_content("{\"error\":\"User not found\"}", "application/json");
            return;
        }
        
        User user = *user_opt;
        auto user_id_opt = jwt_handler->get_user_id(refresh_token);
        std::string user_id = user_id_opt ? *user_id_opt : "user_" + *email_opt;
        
        std::vector<std::string> permissions = JWTHandler::get_permissions_for_roles(user.roles);
        
        std::string new_access_token = jwt_handler->generate_access_token(
            user_id, *email_opt, user.roles, permissions
        );
        
        std::string new_refresh_token = jwt_handler->generate_refresh_token(user_id, *email_opt);
        
        json response = {
            {"access_token", new_access_token},
            {"refresh_token", new_refresh_token}
        };
        
        res.set_content(response.dump(), "application/json");
    });
    
    // выход из системы
    server.Post("/logout", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        json body;
        try {
            body = json::parse(req.body);
        } catch (...) {
            res.status = 400;
            res.set_content("{\"error\":\"Invalid JSON\"}", "application/json");
            return;
        }
        
        std::string refresh_token = body.value("refresh_token", "");
        
        if (refresh_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"refresh_token required\"}", "application/json");
            return;
        }
        
        auto email_opt = jwt_handler->get_email(refresh_token);
        if (!email_opt) {
            res.status = 400;
            res.set_content("{\"error\":\"Invalid refresh token\"}", "application/json");
            return;
        }
        
        mongo_db->remove_refresh_token(*email_opt, refresh_token);
        
        json response = {{"message", "Logged out successfully"}};
        res.set_content(response.dump(), "application/json");
    });
}
