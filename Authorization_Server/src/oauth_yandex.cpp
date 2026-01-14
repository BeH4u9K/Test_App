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
    std::cout << "GET /callback/yandex - code: " << code << ", oauth_state: " << oauth_state 
              << ", error: " << error << std::endl;
    
    if (!error.empty()) {
        std::cout << "Yandex returned error: " << error << std::endl;
        
        auto session_opt = storage.get_session_by_oauth_state(oauth_state);
        if (session_opt) {
            session_opt->status = AuthStatus::DENIED;
            storage.update_session(*session_opt);
        }
        
        res.set_content("<h1>Авторизация отменена</h1><p>Вы отказались от авторизации через Яндекс.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
        return;
    }
    
    if (code.empty() || oauth_state.empty()) {
        std::cout << "ERROR: Missing code or state" << std::endl;
        res.set_content("<h1>Ошибка</h1><p>Отсутствуют необходимые параметры.</p>", "text/html; charset=utf-8");
        return;
    }

    auto session_opt = storage.get_session_by_oauth_state(oauth_state);
    if (!session_opt) {
        std::cout << "ERROR: Session not found for state: " << oauth_state << std::endl;
        res.set_content("<h1>Ошибка</h1><p>Сессия не найдена или истекла.</p>", "text/html; charset=utf-8");
        return;
    }
    
    AuthSession session = *session_opt;
    std::cout << "Found session - login_token: " << session.login_token 
              << ", provider: " << session.provider << std::endl;

    // ПРОВЕРЬТЕ КОНФИГУРАЦИЮ
    if (!config.contains("yandex") || !config["yandex"].contains("client_id") || 
        !config["yandex"].contains("client_secret")) {
        std::cerr << "ERROR: Yandex config missing or incomplete" << std::endl;
        res.set_content("<h1>Ошибка сервера</h1><p>Конфигурация Яндекс не настроена.</p>", "text/html; charset=utf-8");
        return;
    }

    std::string client_id = config["yandex"]["client_id"].get<std::string>();
    std::string client_secret = config["yandex"]["client_secret"].get<std::string>();

    std::cout << "Client ID: " << client_id << std::endl;
    std::cout << "Client Secret: " << (client_secret.empty() ? "EMPTY" : "SET") << std::endl;

    if (client_id.empty() || client_secret.empty()) {
        std::cerr << "ERROR: Yandex client_id or client_secret is empty" << std::endl;
        res.set_content("<h1>Ошибка сервера</h1><p>Не настроены OAuth credentials для Яндекс.</p>", "text/html; charset=utf-8");
        return;
    }

    std::string post_body = "grant_type=authorization_code" + 
                            std::string("&code=") + code +
                            "&client_id=" + client_id + 
                            "&client_secret=" + client_secret;
    
    std::cout << "Requesting token from Yandex..." << std::endl;
    std::cout << "POST body: " << post_body << std::endl;
    
    auto token_response = http_post("https://oauth.yandex.ru", "/token", post_body);
    if (!token_response) {
        std::cerr << "ERROR: Failed to exchange code for Yandex token" << std::endl;
        res.set_content("<h1>Ошибка сервера</h1><p>Не удалось получить токен от Яндекс.</p>", "text/html; charset=utf-8");
        return;
    }
    
    std::cout << "Token response received" << std::endl;
    std::cout << "Response: " << *token_response << std::endl;
    
    try {
        json token_data = json::parse(*token_response);

        if (!token_data.contains("access_token") || token_data["access_token"].is_null()) {
            std::cerr << "ERROR: No access_token in response" << std::endl;
            std::cerr << "Full response: " << token_data.dump() << std::endl;
            throw std::runtime_error("Не удалось получить access_token от Яндекс");
        }
        
        std::string yandex_access_token = token_data["access_token"].get<std::string>();
        std::cout << "Yandex access token received: " << yandex_access_token.substr(0, 20) << "..." << std::endl;

        httplib::Client cli("https://login.yandex.ru");
        cli.set_connection_timeout(5);
        cli.set_read_timeout(5);

        httplib::Headers headers = {
            {"Authorization", "OAuth " + yandex_access_token}
        };
        
        std::cout << "Requesting user info from Yandex..." << std::endl;
        auto user_res = cli.Get("/info?format=json", headers);
        if (!user_res) {
            std::cerr << "ERROR: Failed to connect to login.yandex.ru" << std::endl;
            throw std::runtime_error("Не удалось подключиться к Яндекс");
        }
        
        std::cout << "User info status: " << user_res->status << std::endl;
        std::cout << "User info body: " << user_res->body << std::endl;
        
        if (user_res->status != 200) {
            throw std::runtime_error("Не удалось получить данные пользователя от Яндекс. Код: " + std::to_string(user_res->status));
        }
        
        json user_data = json::parse(user_res->body);

        if (!user_data.contains("default_email") || user_data["default_email"].is_null()) {
            std::cerr << "ERROR: No default_email in user data" << std::endl;
            std::cerr << "Full user data: " << user_data.dump() << std::endl;
            throw std::runtime_error("Не удалось получить email пользователя от Яндекс");
        }
        
        std::string email = user_data["default_email"].get<std::string>();
        std::cout << "Yandex user email: " << email << std::endl;
        
        // mongodb

        std::string user_id = "yandex_user_" + email.substr(0, email.find('@'));
        
        // jwt токены

        std::string jwt_access_token = "yandex_access_" + generate_state_token();
        std::string jwt_refresh_token = "yandex_refresh_" + generate_state_token();
        
        session.status = AuthStatus::GRANTED;
        session.access_token = jwt_access_token;
        session.refresh_token = jwt_refresh_token;
        session.user_id = user_id;
        storage.update_session(session);
        
        std::cout << "Authorization granted for user: " << user_id << ", login_token: " << session.login_token << std::endl;
        std::cout << "=== YANDEX CALLBACK SUCCESS ===" << std::endl;
        
        res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через Яндекс.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
        
    } catch (const std::exception& e) {
        std::cerr << "ERROR processing Yandex response: " << e.what() << std::endl;
        res.set_content("<h1>Ошибка</h1><p>Ошибка обработки данных пользователя: " + std::string(e.what()) + "</p>", "text/html; charset=utf-8");
        return;
    }
}