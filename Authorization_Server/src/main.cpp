#include <iostream>
#include <fstream>
#include "libs/httplib.h"
#include "libs/json/json.hpp"
#include "include/session_storage.hpp"

SessionStorage session_storage;

using json = nlohmann::json;
using namespace httplib;

json config;

bool load_config() {
    try {
        std::ifstream config_file("config/config.json");
        config_file >> config;
        return true;
    } catch (...) {
        return false;
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
    
    // начало авторизации
    svr.Get("/auth", [](const Request& req, Response& res) {
        std::string type = req.get_param_value("type");
        std::string state = req.get_param_value("state"); // login_token
        
        std::cout << "GET /auth - type: " << type << ", state: " << state << std::endl;
        
        res.set_content("{\"message\":\"Auth endpoint\"}", "application/json");
    });
    
    // проверка статуса
    svr.Get("/check", [](const Request& req, Response& res) {
        std::string state = req.get_param_value("state");
        std::cout << "GET /check - state: " << state << std::endl;
        res.set_content("{\"message\":\"Check endpoint\"}", "application/json");
    });
    
    // callback от GitHub
    svr.Get("/callback/github", [](const Request& req, Response& res) {
        std::string code = req.get_param_value("code");
        std::string state = req.get_param_value("state");
        std::string error = req.get_param_value("error");
        
        std::cout << "GET /callback/github - code: " << code 
                  << ", state: " << state << ", error: " << error << std::endl;
        
        res.set_content("{\"message\":\"GitHub callback\"}", "application/json");
    });
    
    // callback от Yandex
    svr.Get("/callback/yandex", [](const Request& req, Response& res) {
        std::string code = req.get_param_value("code");
        std::string state = req.get_param_value("state");
        
        std::cout << "GET /callback/yandex - code: " << code 
                  << ", state: " << state << std::endl;
        
        res.set_content("{\"message\":\"Yandex callback\"}", "application/json");
    });
    
    // обновление токенов
    svr.Post("/refresh", [](const Request& req, Response& res) {
        std::cout << "POST /refresh - body: " << req.body << std::endl;
        res.set_content("{\"message\":\"Refresh endpoint\"}", "application/json");
    });
    
    // выход из системы
    svr.Post("/logout", [](const Request& req, Response& res) {
        std::cout << "POST /logout - body: " << req.body << std::endl;
        res.set_content("{\"message\":\"Logout endpoint\"}", "application/json");
    });
    
    svr.listen(host.c_str(), port);
    return 0;
}