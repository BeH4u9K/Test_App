#include "../include/handlers.hpp"
#include "../include/utils.hpp"
#include "../include/oauth_github.hpp"
#include "../include/oauth_yandex.hpp"
#include "../include/mongodb.hpp"
#include "../include/oauth_code.hpp"
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
    auto code_auth = std::make_shared<CodeAuthentication>();
    
    server.Options(R"(.*)", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        res.status = 200;
    });

    server.Get("/auth", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        std::string provider = req.get_param_value("provider");
        std::string login_token = req.get_param_value("login_token");
        std::string user_id_front = req.get_param_value("user_ID");
        
        if (provider.empty() || login_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"Missing parameters\"}", "application/json");
            return;
        }
        
        std::string oauth_state = generate_state_token();
        AuthSession session{
            login_token,
            oauth_state,
            provider,
            user_id_front,
            std::chrono::system_clock::now() + std::chrono::minutes(5),
            AuthStatus::PENDING,
            std::nullopt,
            std::nullopt,
            std::nullopt
        };
    
        session_storage.add_session(session);
        
        json response = {{"oauth_state", oauth_state}};
        
        if (provider == "github") {
            std::string client_id = config["github"]["client_id"].get<std::string>();
            std::string redirect_uri = config["github"]["redirect_uri"].get<std::string>();
            std::string url = "https://github.com/login/oauth/authorize?client_id=" + client_id + 
                "&redirect_uri=" + redirect_uri + "&response_type=code&state=" + oauth_state + "&scope=user:email";
            
            response["auth_url"] = url;
            
        } else if (provider == "yandex") {
            std::string client_id = config["yandex"]["client_id"].get<std::string>();
            std::string redirect_uri = config["yandex"]["redirect_uri"].get<std::string>();
            std::string url = "https://oauth.yandex.ru/authorize?response_type=code&client_id=" + 
                client_id + "&redirect_uri=" + redirect_uri + "&state=" + oauth_state;
            
            response["auth_url"] = url;
            
        } else if (provider == "code") {
            std::string auth_code = code_auth->generate_code(login_token);
            response["code"] = auth_code;
            response["expires_in"] = 60;
        }
        
        res.set_content(response.dump(), "application/json");
    });

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
        
        json response = {{"status", ""}, {"provider", session.provider}};
        
        switch (session.status) {
            case AuthStatus::PENDING:
                response["status"] = "pending";
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

    server.Get("/callback/github", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        handle_github_callback(req, res, session_storage, config, mongo_db, jwt_handler);
    });

    server.Get("/callback/yandex", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        handle_yandex_callback(req, res, session_storage, config, mongo_db, jwt_handler);
    });

    server.Get("/callback/code", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        handle_code_callback(req, res, session_storage, config, mongo_db, jwt_handler, code_auth);
    });

    server.Post("/code/verify", [&](const Request& req, Response& res) {
        set_cors_headers(res);
        
        json body = json::parse(req.body);
        std::string code = body.value("code", "");
        std::string refresh_token = body.value("refresh_token", "");
        
        if (code.empty() || refresh_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"code and refresh_token are required\"}", "application/json");
            return;
        }
        
        auto code_entry_opt = code_auth->find_code(code);
        if (!code_entry_opt) {
            res.status = 400;
            res.set_content("{\"error\":\"Code not found or expired\"}", "application/json");
            return;
        }
        
        CodeEntry code_entry = *code_entry_opt;
        
        if (!jwt_handler->validate_token(refresh_token) || !jwt_handler->is_refresh_token(refresh_token)) {
            code_auth->remove_code(code);
            res.status = 400;
            res.set_content("{\"error\":\"Invalid refresh token\"}", "application/json");
            return;
        }
        
        json response = {
            {"success", true},
            {"state", code_entry.login_token}
        };
        
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
        
        auto user_opt = mongo_db->find_user_by_email(*email_opt);
        if (!user_opt) {
            res.status = 404;
            res.set_content("{\"error\":\"User not found\"}", "application/json");
            return;
        }
        
        User user = *user_opt;
        auto user_id_opt = jwt_handler->get_user_id(refresh_token);
        std::string user_id = user_id_opt ? *user_id_opt : "user_" + *email_opt;
        
        std::string new_access_token = jwt_handler->generate_access_token(user_id, *email_opt);
        std::string new_refresh_token = jwt_handler->generate_refresh_token(user_id, *email_opt);
        
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