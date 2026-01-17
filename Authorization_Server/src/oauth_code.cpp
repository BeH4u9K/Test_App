#include "../include/oauth_code.hpp"
#include "../include/utils.hpp"
#include "../include/mongodb.hpp"
#include "../include/jwt_token.hpp"
#include <iostream>
#include <random>

using json = nlohmann::json;
using namespace httplib;

void process_code_session(
    AuthSession& session,
    const std::string& email,
    const std::string& code,
    std::shared_ptr<MongoDB> mongo_db,
    std::shared_ptr<JWTHandler> jwt_handler,
    std::shared_ptr<CodeAuthentication> code_auth
) {
    std::cout << "Processing session for login_token: " << session.login_token << std::endl;
    
    std::vector<std::string> user_roles = {"Student"};
    
    if (mongo_db) {
        auto user_opt = mongo_db->find_user_by_email(email);
        if (user_opt) {
            user_roles = user_opt->roles;
        } else {
            std::random_device rd;
            std::mt19937 gen(rd());
            std::uniform_int_distribution<> dis(1000, 9999);
            std::string username = "Аноним" + std::to_string(dis(gen));
            
            mongo_db->create_user(email, username, user_roles);
        }
    }
    
    std::vector<std::string> permissions = JWTHandler::get_permissions_for_roles(user_roles);
    std::string user_id = "code_user_" + email.substr(0, email.find('@'));
    
    std::string jwt_access_token = jwt_handler->generate_access_token(
        user_id, email, user_roles, permissions
    );
    
    std::string jwt_refresh_token = jwt_handler->generate_refresh_token(user_id, email);
    
    if (mongo_db) {
        mongo_db->add_refresh_token(email, jwt_refresh_token);
    }
    
    code_auth->remove_code(code);
    
    session.status = AuthStatus::GRANTED;
    session.access_token = jwt_access_token;
    session.refresh_token = jwt_refresh_token;
    session.user_id = user_id;
}

void handle_code_callback(
    const Request& req,
    Response& res,
    SessionStorage& storage,
    const json& config,
    std::shared_ptr<MongoDB> mongo_db,
    std::shared_ptr<JWTHandler> jwt_handler,
    std::shared_ptr<CodeAuthentication> code_auth
) {
    std::string code = req.get_param_value("code");
    std::string oauth_state = req.get_param_value("state");
    std::string refresh_token = req.get_param_value("refresh_token");
    
    std::cout << "=== CODE CALLBACK START ===" << std::endl;
    std::cout << "GET /callback/code" << std::endl;
    
    if (code.empty() || oauth_state.empty() || refresh_token.empty()) {
        res.set_content("<h1>Ошибка</h1><p>Отсутствуют необходимые параметры.</p>", "text/html; charset=utf-8");
        return;
    }
    
    auto code_entry_opt = code_auth->find_code(code);
    if (!code_entry_opt) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Ошибка</h1><p>Код не найден или истек.</p>", "text/html; charset=utf-8");
        return;
    }
    
    CodeEntry code_entry = *code_entry_opt;
    
    if (code_entry.login_token != oauth_state) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Ошибка</h1><p>Invalid state parameter.</p>", "text/html; charset=utf-8");
        return;
    }
    
    if (!jwt_handler->validate_token(refresh_token) || !jwt_handler->is_refresh_token(refresh_token)) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Error</h1><p>Invalid refresh token.</p>", "text/html; charset=utf-8");
        return;
    }
    
    auto email_opt = jwt_handler->get_email(refresh_token);
    if (!email_opt) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Error</h1><p>Failed to extract email from token.</p>", "text/html; charset=utf-8");
        return;
    }
    
    std::string email = *email_opt;
    
    auto session_opt = storage.get_and_update_session_by_oauth_state(
        oauth_state,
        [&](AuthSession& session) {
            process_code_session(session, email, code, mongo_db, jwt_handler, code_auth);
        }
    );
    
    if (!session_opt) {
        res.set_content("<h1>Error</h1><p>Session not found or expired.</p>", "text/html; charset=utf-8");
        return;
    }
    
    std::cout << "=== CODE CALLBACK SUCCESS ===" << std::endl;
    res.set_content("<h1>Authorization Successful</h1><p>You have successfully authorized via code.</p><p>Close this window and return to the application.</p>", "text/html; charset=utf-8");
}

void handle_code_verify(
    const Request& req,
    Response& res,
    SessionStorage& storage,
    const json& config,
    std::shared_ptr<MongoDB> mongo_db,
    std::shared_ptr<JWTHandler> jwt_handler,
    std::shared_ptr<CodeAuthentication> code_auth
) {
    std::string body_str = req.body;
    json body;
    
    try {
        body = json::parse(body_str);
    } catch (...) {
        res.status = 400;
        res.set_content("{\"error\":\"Invalid JSON\"}", "application/json");
        return;
    }
    
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
}