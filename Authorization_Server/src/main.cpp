#include <iostream>
#include <memory>
#include "../libs/httplib.h"
#include "../include/session_storage.hpp"
#include "../include/config_loader.hpp"
#include "../include/handlers.hpp"
#include "../include/mongodb.hpp"
#include "../include/jwt_token.hpp"

using json = nlohmann::json;
using namespace httplib;

int main() {
    json config;
    if (!load_config(config)) {
        config = {
            {"server", {{"port", 8080}, {"host", "0.0.0.0"}}},
            {"jwt", {{"secret", "e2A0B1C2D3E4F5a6b7c8d9e0f1g2h"}}}
        };
    }

    int port = config["server"]["port"];
    std::string host = config["server"]["host"];
    
    std::string jwt_secret = "e2A0B1C2D3E4F5a6b7c8d9e0f1g2h";
    if (config.contains("jwt") && config["jwt"].contains("secret")) {
        jwt_secret = config["jwt"]["secret"].get<std::string>();
    }
    
    SessionStorage session_storage;

    auto mongo_db = std::make_shared<MongoDB>("mongodb_service", 5000);
    auto jwt_handler = std::make_shared<JWTHandler>(jwt_secret);
    
    Server server;
    register_handlers(server, session_storage, config, mongo_db, jwt_handler);
    
    std::cout << "Authorization Server started on " << host << ":" << port << std::endl;
    std::cout << "MongoDB service: mongodb_service:5000" << std::endl;
    server.listen(host.c_str(), port);
    return 0;
}