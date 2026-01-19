#include "../include/handlers.hpp"
#include "../include/utils.hpp"
#include "../include/oauth_github.hpp"
#include "../include/oauth_yandex.hpp"
#include "../include/mongodb.hpp"
#include "../include/permissions.hpp"
#include <iostream>

using json = nlohmann::json;
using namespace httplib;

void register_handlers(
    Server& server,
    SessionStorage& session_storage,
    const json& config,
    std::shared_ptr<MongoDB> mongo_db,
    std::shared_ptr<JWTHandler> jwt_handler
) {
    server.Options(R"(.*)", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        res.status = 200;
    });

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

        session_storage.create_session(login_token, provider);
        
        json response;
        
        if (provider == "github") {
            std::string client_id = config["github"]["client_id"].get<std::string>();
            std::string redirect_uri = config["github"]["redirect_uri"].get<std::string>();

            std::string url = "https://github.com/login/oauth/authorize?client_id=" + client_id + 
                "&redirect_uri=" + redirect_uri + "&response_type=code&state=" + login_token + "&scope=user:email";
            
            response["auth_url"] = url;
            std::cout << "GitHub auth URL: " << url << std::endl;
            
        } else if (provider == "yandex") {
            std::string client_id = config["yandex"]["client_id"].get<std::string>();
            std::string redirect_uri = config["yandex"]["redirect_uri"].get<std::string>();
            
            std::string url = "https://oauth.yandex.ru/authorize?response_type=code&client_id=" + 
                client_id + "&redirect_uri=" + redirect_uri + "&state=" + login_token;
            
            response["auth_url"] = url;
            std::cout << "Yandex auth URL: " << url << std::endl;
            
        }
        
        res.set_content(response.dump(), "application/json");
    });

    server.Get("/callback/github", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        handle_github_callback(req, res, session_storage, config, mongo_db, jwt_handler);
    });

    server.Get("/callback/yandex", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        handle_yandex_callback(req, res, session_storage, config, mongo_db, jwt_handler);
    });

    server.Get("/check", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        std::string login_token = req.get_param_value("login_token");

        std::cout << "GET /check - login_token: " << login_token << std::endl;
        
        if (login_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"Missing login_token\"}", "application/json");
            return;
        }
        
        auto session_opt = session_storage.get_session(login_token);
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
        
        json response = {{"status", ""}, {"provider", session.provider}};
        
        switch (session.status) {
            case AuthStatus::PENDING:
                response["status"] = "pending";
                break;
            case AuthStatus::GRANTED:
                response["status"] = "granted";
                if (session.access_token) response["access_token"] = *session.access_token;
                if (session.refresh_token) response["refresh_token"] = *session.refresh_token;
                session_storage.remove_session(login_token);
                break;
            case AuthStatus::DENIED:
                response["status"] = "denied";
                session_storage.remove_session(login_token);
                break;
            case AuthStatus::EXPIRED:
                response["status"] = "expired";
                session_storage.remove_session(login_token);
                break;
        }
        
        res.set_content(response.dump(), "application/json");
    });

    server.Post("/refresh", [&](const Request& req, Response& res) {
        set_cors_headers(res);
    
        json body = json::parse(req.body);
        std::string refresh_token = body.value("refresh_token", "");
    
        if (refresh_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"refresh_token required\"}", "application/json");
            return;
        }

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
    
        auto user_opt = mongo_db->find_user(*email_opt);
        if (!user_opt) {
            res.status = 404;
            res.set_content("{\"error\":\"User not found\"}", "application/json");
            return;
        }
    
        User user = *user_opt;

        bool token_found = false;
        for (const auto& token : user.refresh_tokens) {
            if (token == refresh_token) {
                token_found = true;
                break;
            }
        }
    
        if (!token_found) {
            res.status = 401;
            res.set_content("{\"error\":\"Refresh token not found in database\"}", "application/json");
            return;
        }

        std::vector<std::string> permissions = get_permissions_from_roles(user.roles);

        std::string new_access_token = jwt_handler->generate_access_token(permissions);
        std::string new_refresh_token = jwt_handler->generate_refresh_token(*email_opt);

        mongo_db->remove_refresh_token(*email_opt, refresh_token);
        mongo_db->add_tokens(*email_opt, new_access_token, new_refresh_token);
    
        json response = {
            {"access_token", new_access_token},
            {"refresh_token", new_refresh_token}
        };
    
        res.set_content(response.dump(), "application/json");
    });
    
    server.Post("/logout", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        json body = json::parse(req.body);
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