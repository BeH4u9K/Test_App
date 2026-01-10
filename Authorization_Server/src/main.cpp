#include <iostream>
#include <fstream>
#include <random>
#include <sstream>
#include "../libs/httplib.h"
#include "../libs/json/json.hpp"
#include "../include/session_storage.hpp"

using json = nlohmann::json;
using namespace httplib;

SessionStorage session_storage;
json config;

// загрузка конфигурации сервера из json файла
bool load_config() {
    try {
        std::ifstream config_file("config/config.json");
        config_file >> config;
        return true;
    } catch (...) {
        return false;
    }
}

// генерация случайного state токена для oauth
std::string generate_state_token() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    std::stringstream ss;
    for (int i = 0; i < 32; ++i) {
        ss << std::hex << dis(gen);
    }
    return ss.str();
}

// функция для установки CORS заголовков
void set_cors_headers(Response& res) {
    res.set_header("Access-Control-Allow-Origin", "http://localhost:5175");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    res.set_header("Access-Control-Allow-Credentials", "true");
    res.set_header("Access-Control-Max-Age", "3600");
}

int main() {
    if (!load_config()) {
        std::cout << "Config not found, using defaults" << std::endl;
        config = {{"server", {{"port", 8080}, {"host", "0.0.0.0"}}}};
    }
    
    std::string host = config["server"]["host"];
    int port = config["server"]["port"];
    
    Server svr;
    
    std::cout << "Server starting on " << host << ":" << port << std::endl;
    
    // обработчик для OPTIONS запросов (preflight CORS)
    svr.Options(R"(.*)", [](const Request& req, Response& res) {
        std::cout << "OPTIONS request for CORS preflight" << std::endl;
        set_cors_headers(res);
        res.status = 200;
    });
    
    // тестовый эндпоинт
    svr.Get("/ping", [](const Request& req, Response& res) {
        std::cout << "GET /ping - ping request received" << std::endl;

        // CORS заголовки
        set_cors_headers(res);

        res.set_content("{\"message\": \"Hello World\"}", "application/json");
    });

    // эндпоинт /auth - начало авторизации
    svr.Get("/auth", [](const Request& req, Response& res) {

        // CORS заголовки
        set_cors_headers(res);
        
        std::string type = req.get_param_value("type");
        std::string login_token = req.get_param_value("state");
        if (type.empty() || login_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"Missing parameters\"}", "application/json");
            return;
        }
        
        std::string state_token = generate_state_token();
        auto now = std::chrono::system_clock::now();
        
        AuthSession session{
            state_token,
            now,
            now + std::chrono::minutes(5),
            AuthStatus::PENDING,
            type
        };
        
        session_storage.add_session(session);
        
        json response = {
            {"state_token", state_token},
            {"expires_at", std::chrono::duration_cast<std::chrono::seconds>(session.expires_at.time_since_epoch()).count()}
        };
        
        if (type == "github") {
            std::string url = "https://github.com/login/oauth/authorize?client_id=" + config["github"]["client_id"].get<std::string>() +
                "&redirect_uri=" + config["github"]["redirect_uri"].get<std::string>() + "&state=" + state_token;
            response["auth_url"] = url;
        } else if (type == "yandex") {
            std::string url = "https://oauth.yandex.ru/authorize?response_type=code&client_id=" + config["yandex"]["client_id"].get<std::string>() +
                "&redirect_uri=" + config["yandex"]["redirect_uri"].get<std::string>() + "&state=" + state_token;
            response["auth_url"] = url;
        } else if (type == "code") {   

            // будет генерация кода

            response["auth_type"] = "code";
            response["message"] = "Code generation not implemented yet";
        } else {
            res.status = 400;
            res.set_content("{\"error\":\"Unsupported auth type\"}", "application/json");
            return;
        }
        
        res.set_content(response.dump(), "application/json");
    });
    
    // эндпоинт /check - проверка статуса сессии
    svr.Get("/check", [](const Request& req, Response& res) {

        // CORS заголовки
        set_cors_headers(res);

        std::string state_token = req.get_param_value("state");
        if (state_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"Missing state token\"}", "application/json");
            return;
        }
        
        auto session_opt = session_storage.get_session(state_token);
        if (!session_opt) {
            res.status = 404;
            res.set_content("{\"error\":\"Session not found\"}", "application/json");
            return;
        }
        
        AuthSession session = session_opt.value();
        if (session.is_expired()) {
            session.status = AuthStatus::EXPIRED;
            session_storage.update_session(session);
        }
        
        json response = {
            {"state_token", session.state_token},
            {"status", static_cast<int>(session.status)},
            {"provider", session.provider},
            {"expires_at", std::chrono::duration_cast<std::chrono::seconds>(session.expires_at.time_since_epoch()).count()}
        };
        
        if (session.status == AuthStatus::GRANTED) {
            response["access_token"] = "JWT_ACCESS_TOKEN_PLACEHOLDER";
            response["refresh_token"] = "JWT_REFRESH_TOKEN_PLACEHOLDER";
        }
        
        res.set_content(response.dump(), "application/json");
    });
    
    // callback от GitHub
    svr.Get("/callback/github", [](const Request& req, Response& res) {

        // CORS заголовки
        set_cors_headers(res);

        std::string code = req.get_param_value("code");
        std::string state = req.get_param_value("state");
        std::string error = req.get_param_value("error");
        
        std::cout << "GET /callback/github - code: " << code 
                  << ", state: " << state << ", error: " << error << std::endl;
        
        res.set_content("{\"message\":\"GitHub callback\"}", "application/json");
    });
    
    // callback от Yandex
    svr.Get("/callback/yandex", [](const Request& req, Response& res) {

        // CORS заголовки
        set_cors_headers(res);

        std::string code = req.get_param_value("code");
        std::string state = req.get_param_value("state");
        
        std::cout << "GET /callback/yandex - code: " << code 
                  << ", state: " << state << std::endl;
        
        res.set_content("{\"message\":\"Yandex callback\"}", "application/json");
    });
    
    // обновление токенов
    svr.Post("/refresh", [](const Request& req, Response& res) {

        // CORS заголовки
        set_cors_headers(res);

        std::cout << "POST /refresh - body: " << req.body << std::endl;
        res.set_content("{\"message\":\"Refresh endpoint\"}", "application/json");
    });
    
    // выход из системы
    svr.Post("/logout", [](const Request& req, Response& res) {

        // CORS заголовки
        set_cors_headers(res);

        std::cout << "POST /logout - body: " << req.body << std::endl;
        res.set_content("{\"message\":\"Logout endpoint\"}", "application/json");
    });
    
    svr.listen(host.c_str(), port);
    return 0;
}