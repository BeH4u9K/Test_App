#include "../include/oauth_code.hpp"
#include "../include/utils.hpp"
#include "../include/mongodb.hpp"
#include "../include/jwt_token.hpp"
#include <iostream>

using json = nlohmann::json;
using namespace httplib;

void handle_code_callback(
    const Request& req,
    httplib::Response& res,
    SessionStorage& storage,
    const json& config,
    std::shared_ptr<MongoDB> mongo_db,
    std::shared_ptr<JWTHandler> jwt_handler,
    std::shared_ptr<CodeAuthentication> code_auth
) {
    std::string code = req.get_param_value("code");
    std::string oauth_state = req.get_param_value("state");
    std::string refresh_token = req.get_param_value("refresh_token");
    
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
        res.set_content("<h1>Ошибка</h1><p>Неверный параметр state.</p>", "text/html; charset=utf-8");
        return;
    }
    
    if (!jwt_handler->validate_token(refresh_token) || !jwt_handler->is_refresh_token(refresh_token)) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Error</h1><p>Неверный refresh токен.</p>", "text/html; charset=utf-8");
        return;
    }
    
    auto email_opt = jwt_handler->get_email(refresh_token);
    if (!email_opt) {
        storage.update_session_status_by_oauth_state(oauth_state, AuthStatus::DENIED);
        res.set_content("<h1>Error</h1><p>Не удалось извлечь email из токена.</p>", "text/html; charset=utf-8");
        return;
    }
    
    auto session_opt = storage.get_session_by_oauth_state(oauth_state);
    if (!session_opt) {
        res.set_content("<h1>Error</h1><p>Сессия не найдена или истекла.</p>", "text/html; charset=utf-8");
        return;
    }
    
    AuthSession session = *session_opt;
    
    auto user_opt = mongo_db->find_user_by_email(*email_opt);
    
    if (!user_opt) {
        mongo_db->create_user(*email_opt, "Аноним");
    }
    
    std::string user_id = "code_user_" + email_opt->substr(0, email_opt->find('@'));
    
    std::string jwt_access_token = jwt_handler->generate_access_token(user_id, *email_opt);
    std::string jwt_refresh_token = jwt_handler->generate_refresh_token(user_id, *email_opt);
    
    mongo_db->add_refresh_token(*email_opt, jwt_refresh_token);
    code_auth->remove_code(code);
    
    session.status = AuthStatus::GRANTED;
    session.access_token = jwt_access_token;
    session.refresh_token = jwt_refresh_token;
    session.user_id = user_id;
    
    storage.update_session(session);
    
    res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через код.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
}