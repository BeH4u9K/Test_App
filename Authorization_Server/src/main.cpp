#include <iostream>
#include <fstream>
#include <random>
#include <sstream>
#include <iomanip>
#include "../libs/httplib.h"
#include "../libs/json/json.hpp"
#include "../include/session_storage.hpp"
#include "../include/auth_session.hpp"

using json = nlohmann::json;
using namespace httplib;

SessionStorage session_storage;
json config;

// загрузка конфигурации сервера из json файла
bool load_config() {
    try {
        std::ifstream config_file("config/config.json");
        if (!config_file.is_open()) {
            std::cerr << "Config file not found. Create config/config.json from config.example.json" << std::endl;
            return false;
        }
        config_file >> config;
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error loading config: " << e.what() << std::endl;
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
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    res.set_header("Access-Control-Allow-Credentials", "true");
    res.set_header("Access-Control-Max-Age", "3600");
}

// для http post запросов
std::optional<std::string> http_post(const std::string& host, const std::string& path, 
                                     const std::string& body, const std::string& content_type = "application/x-www-form-urlencoded") {
    httplib::Client cli(host);
    cli.set_connection_timeout(5);
    cli.set_read_timeout(5);
    
    auto res = cli.Post(path.c_str(), body, content_type.c_str());
    if (res && res->status == 200) {
        return res->body;
    } else {
        std::cerr << "HTTP POST failed: " << (res ? std::to_string(res->status) : "no response") << std::endl;
        return std::nullopt;
    }
}

// для http get запросов с заголовками
std::optional<std::string> http_get_with_auth(const std::string& host, const std::string& path, 
                                              const std::string& token) {
    httplib::Client cli(host);
    cli.set_connection_timeout(5);
    cli.set_read_timeout(5);
    cli.set_bearer_token_auth(token.c_str());
    
    auto res = cli.Get(path.c_str());
    if (res && res->status == 200) {
        return res->body;
    } else {
        std::cerr << "HTTP GET with auth failed: " << (res ? std::to_string(res->status) : "no response") << std::endl;
        return std::nullopt;
    }
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

    // эндпоинт /auth - начало авторизации
    svr.Get("/auth", [](const Request& req, Response& res) {
        set_cors_headers(res);
        
        std::string type = req.get_param_value("type");
        std::string login_token = req.get_param_value("state");
        
        std::cout << "GET /auth - type: " << type << ", login_token: " << login_token << std::endl;
        
        if (type.empty() || login_token.empty()) {
            res.status = 400;
            json error_response = {{"error", "Missing parameters"}};
            res.set_content(error_response.dump(), "application/json");
            return;
        }
        
        std::string state_token = generate_state_token();
        auto now = std::chrono::system_clock::now();
        
        AuthSession session{
            state_token,
            login_token,
            now,
            now + std::chrono::minutes(5),
            AuthStatus::PENDING,
            type,
            std::nullopt, // access_token
            std::nullopt, // refresh_token
            std::nullopt // user_id
        };
        
        session_storage.add_session(session);
        std::cout << "Created session - state_token: " << state_token << ", login_token: " << login_token << std::endl;
        
        json response;
        response["state_token"] = state_token;
        response["expires_at"] = std::chrono::duration_cast<std::chrono::seconds>(session.expires_at.time_since_epoch()).count();
        
        if (type == "github") {
            std::string redirect_uri;
            std::string client_id;
            
            if (config.contains("github") && 
                config["github"].contains("client_id") && 
                config["github"].contains("redirect_uri")) {
                    redirect_uri = config["github"]["redirect_uri"].get<std::string>();
                    client_id = config["github"]["client_id"].get<std::string>();
            } else {
                client_id = "YOUR_GITHUB_CLIENT_ID";
                redirect_uri = "http://localhost:8080/callback/github";
            }
            
            std::string url = "https://github.com/login/oauth/authorize?client_id=" + client_id +
                "&redirect_uri=" + redirect_uri + "&state=" + state_token + "&scope=user:email";
            
            response["auth_url"] = url;
            
        } else if (type == "yandex") {
            std::string redirect_uri;
            std::string client_id;
            
            if (config.contains("yandex") && 
                config["yandex"].contains("client_id") && 
                config["yandex"].contains("redirect_uri")) {
                    redirect_uri = config["yandex"]["redirect_uri"].get<std::string>();
                    client_id = config["yandex"]["client_id"].get<std::string>();
            } else {
                client_id = "YOUR_YANDEX_CLIENT_ID";
                redirect_uri = "http://localhost:8080/callback/yandex";
            }
            
            std::string url = "https://oauth.yandex.ru/authorize?response_type=code" + std::string("&client_id=") + 
                client_id + "&redirect_uri=" + redirect_uri + "&state=" + state_token;
            
            response["auth_url"] = url;
            
        } else if (type == "code") {
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
    svr.Get("/check", [](const Request& req, Response& res) {
        set_cors_headers(res);
        
        std::string login_token = req.get_param_value("state");
        
        if (login_token.empty()) {
            res.status = 400;
            res.set_content("{\"error\":\"Missing parameter: state\"}", "application/json");
            return;
        }
        
        auto session_opt = session_storage.get_session_by_login(login_token);
        if (!session_opt) {
            json response = {
                {"status", "not_found"},
                {"message", "Session not found or expired"}
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
            {"state_token", session.state_token}
        };
        
        switch (session.status) {
            case AuthStatus::PENDING:
                response["status"] = "pending";
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
                break;
            case AuthStatus::DENIED:
                response["status"] = "denied";
                break;
            case AuthStatus::EXPIRED:
                response["status"] = "expired";
                break;
        }
        
        if (session.status != AuthStatus::PENDING && session.status != AuthStatus::GRANTED) {
            session_storage.remove_session_by_login(login_token);
        }
        
        res.set_content(response.dump(), "application/json");
    });
    
    // callback от github
    svr.Get("/callback/github", [](const Request& req, Response& res) {
        std::string code = req.get_param_value("code");
        std::string state = req.get_param_value("state");
        std::string error = req.get_param_value("error");
        std::string error_description = req.get_param_value("error_description");
        
        std::cout << "GET /callback/github - code: " << code 
                  << ", state: " << state 
                  << ", error: " << error 
                  << ", error_desc: " << error_description << std::endl;
        
        if (!error.empty()) {
            std::cout << "GitHub returned error: " << error_description << std::endl;

            auto session_opt = session_storage.get_session_by_state(state);
            if (session_opt) {
                session_opt->status = AuthStatus::DENIED;
                session_storage.update_session(*session_opt);
            }
            
            res.set_content("<h1>Авторизация отменена</h1><p>Вы отказались от авторизации через GitHub.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
            return;
        }
        
        if (code.empty() || state.empty()) {
            res.set_content("<h1>Ошибка</h1><p>Отсутствуют необходимые параметры.</p>", "text/html; charset=utf-8");
            return;
        }
        
        auto session_opt = session_storage.get_session_by_state(state);
        if (!session_opt) {
            res.set_content("<h1>Ошибка</h1><p>Сессия не найдена или истекла.</p>", "text/html; charset=utf-8");
            return;
        }
        
        AuthSession session = *session_opt;

        std::string client_id = config["github"]["client_id"].get<std::string>();
        std::string client_secret = config["github"]["client_secret"].get<std::string>();
        std::string redirect_uri = config["github"]["redirect_uri"].get<std::string>();
        
        std::string post_body = "client_id=" + client_id +
                               "&client_secret=" + client_secret +
                               "&code=" + code +
                               "&redirect_uri=" + redirect_uri;
        
        auto token_response = http_post("https://github.com", "/login/oauth/access_token", post_body);
        if (!token_response) {
            std::cerr << "Failed to exchange code for token" << std::endl;
            res.set_content("<h1>Ошибка сервера</h1><p>Не удалось получить токен от GitHub.</p>", "text/html; charset=utf-8");
            return;
        }

        std::string response_body = *token_response;
        std::string access_token;
        size_t token_start = response_body.find("access_token=");
        if (token_start != std::string::npos) {
            token_start += 13;
            size_t token_end = response_body.find('&', token_start);
            if (token_end == std::string::npos) {
                access_token = response_body.substr(token_start);
            } else {
                access_token = response_body.substr(token_start, token_end - token_start);
            }
        }
        
        if (access_token.empty()) {
            std::cerr << "No access token in response: " << response_body << std::endl;
            res.set_content("<h1>Ошибка</h1><p>Не удалось получить токен доступа от GitHub.</p>", "text/html; charset=utf-8");
            return;
        }

        auto user_response = http_get_with_auth("https://api.github.com", "/user", access_token);
        if (!user_response) {
            std::cerr << "Failed to get user data from GitHub" << std::endl;
            res.set_content("<h1>Ошибка</h1><p>Не удалось получить данные пользователя от GitHub.</p>", "text/html; charset=utf-8");
            return;
        }
        
        try {
            json user_data = json::parse(*user_response);
            std::string email;

            if (user_data.contains("email") && !user_data["email"].is_null()) {
                email = user_data["email"].get<std::string>();
            } else {
                auto emails_response = http_get_with_auth("https://api.github.com", "/user/emails", access_token);
                if (emails_response) {
                    json emails = json::parse(*emails_response);
                    if (emails.is_array() && !emails.empty()) {
                        for (const auto& e : emails) {
                            if (e.contains("primary") && e["primary"].get<bool>() && 
                                e.contains("verified") && e["verified"].get<bool>()) {
                                email = e["email"].get<std::string>();
                                break;
                            }
                        }
                        if (email.empty()) {
                            for (const auto& e : emails) {
                                if (e.contains("verified") && e["verified"].get<bool>()) {
                                    email = e["email"].get<std::string>();
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            if (email.empty()) {
                throw std::runtime_error("Не удалось получить email пользователя от GitHub");
            }
            
            std::cout << "GitHub user email: " << email << std::endl;
            
            // mongdb

            std::string user_id = "user_" + email.substr(0, email.find('@'));
            
            // jwt токены

            std::string jwt_access_token = "github_access_" + generate_state_token();
            std::string jwt_refresh_token = "github_refresh_" + generate_state_token();

            session.status = AuthStatus::GRANTED;
            session.access_token = jwt_access_token;
            session.refresh_token = jwt_refresh_token;
            session.user_id = user_id;
            session_storage.update_session(session);
            
            std::cout << "Authorization granted for user: " << user_id 
                      << ", login_token: " << session.login_token << std::endl;

            res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через GitHub.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
            
        } catch (const std::exception& e) {
            std::cerr << "Error processing GitHub response: " << e.what() << std::endl;
            res.set_content("<h1>Ошибка</h1><p>Ошибка обработки данных пользователя: " + std::string(e.what()) + "</p>", "text/html; charset=utf-8");
            return;
        }
    });
    
    // callback от yandex
    svr.Get("/callback/yandex", [](const Request& req, Response& res) {
        std::string code = req.get_param_value("code");
        std::string state = req.get_param_value("state");
        std::string error = req.get_param_value("error");
        
        std::cout << "GET /callback/yandex - code: " << code 
                  << ", state: " << state 
                  << ", error: " << error << std::endl;

        if (!error.empty()) {
            std::cout << "Yandex returned error: " << error << std::endl;
            
            auto session_opt = session_storage.get_session_by_state(state);
            if (session_opt) {
                session_opt->status = AuthStatus::DENIED;
                session_storage.update_session(*session_opt);
            }
            
            res.set_content("<h1>Авторизация отменена</h1><p>Вы отказались от авторизации через Яндекс.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
            return;
        }
        
        if (code.empty() || state.empty()) {
            res.set_content("<h1>Ошибка</h1><p>Отсутствуют необходимые параметры.</p>", "text/html; charset=utf-8");
            return;
        }

        auto session_opt = session_storage.get_session_by_state(state);
        if (!session_opt) {
            res.set_content("<h1>Ошибка</h1><p>Сессия не найдена или истекла.</p>", "text/html; charset=utf-8");
            return;
        }
        
        AuthSession session = *session_opt;

        std::string client_id = config["yandex"]["client_id"].get<std::string>();
        std::string client_secret = config["yandex"]["client_secret"].get<std::string>();

        std::string post_body = "grant_type=authorization_code" +
                               std::string("&code=") + code +
                               "&client_id=" + client_id +
                               "&client_secret=" + client_secret;
        
        auto token_response = http_post("https://oauth.yandex.ru", "/token", post_body);
        if (!token_response) {
            std::cerr << "Failed to exchange code for Yandex token" << std::endl;
            res.set_content("<h1>Ошибка сервера</h1><p>Не удалось получить токен от Яндекс.</p>", "text/html; charset=utf-8");
            return;
        }
        
        try {
            json token_data = json::parse(*token_response);

            if (!token_data.contains("access_token") || token_data["access_token"].is_null()) {
                throw std::runtime_error("Не удалось получить access_token от Яндекс");
            }
            
            std::string access_token = token_data["access_token"].get<std::string>();

            httplib::Client cli("https://login.yandex.ru");
            cli.set_connection_timeout(5);
            cli.set_read_timeout(5);

            httplib::Headers headers = {
                {"Authorization", "OAuth " + access_token}
            };
            
            auto user_res = cli.Get("/info?format=json", headers);
            if (!user_res || user_res->status != 200) {
                throw std::runtime_error("Не удалось получить данные пользователя от Яндекс");
            }
            
            json user_data = json::parse(user_res->body);

            if (!user_data.contains("default_email") || user_data["default_email"].is_null()) {
                throw std::runtime_error("Не удалось получить email пользователя от Яндекс");
            }
            
            std::string email = user_data["default_email"].get<std::string>();
            std::cout << "Yandex user email: " << email << std::endl;
            
            // mongodb

            std::string user_id = "user_" + email.substr(0, email.find('@'));
            
            // jwt токены

            std::string jwt_access_token = "yandex_access_" + generate_state_token();
            std::string jwt_refresh_token = "yandex_refresh_" + generate_state_token();
            
            session.status = AuthStatus::GRANTED;
            session.access_token = jwt_access_token;
            session.refresh_token = jwt_refresh_token;
            session.user_id = user_id;
            session_storage.update_session(session);
            
            std::cout << "Authorization granted for user: " << user_id 
                      << ", login_token: " << session.login_token << std::endl;
            
            res.set_content("<h1>Успешная авторизация!</h1><p>Вы успешно авторизовались через Яндекс.</p><p>Закройте это окно и вернитесь в приложение.</p>", "text/html; charset=utf-8");
            
        } catch (const std::exception& e) {
            std::cerr << "Error processing Yandex response: " << e.what() << std::endl;
            res.set_content("<h1>Ошибка</h1><p>Ошибка обработки данных пользователя: " + std::string(e.what()) + "</p>", "text/html; charset=utf-8");
            return;
        }
    });
    
    // обновление токенов
    svr.Post("/refresh", [](const Request& req, Response& res) {
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
    svr.Post("/logout", [](const Request& req, Response& res) {
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
    
    svr.listen(host.c_str(), port);
    return 0;
}