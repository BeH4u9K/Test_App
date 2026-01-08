#include <iostream>
#include "libs/httplib.h"

using namespace httplib;

int main() {
    Server svr;
    
    std::cout << "Authorization Server starting..." << std::endl;
    
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
    
    svr.listen("0.0.0.0", 8080);
    return 0;
}