#include <iostream>
#include "../libs/httplib.h"
#include "../include/session_storage.hpp"
#include "../include/config_loader.hpp"
#include "../include/handlers.hpp"
#include "../include/jwt_utils.hpp"
#include "../include/mongodb_utils.hpp"

using json = nlohmann::json;
using namespace httplib;

int main() {
    json config;
    if (!load_config(config)) {
        config = {{"server", {{"port", 8080}, {"host", "0.0.0.0"}}}};
    }

    std::string host = config["server"]["host"];
    int port = config["server"]["port"];

    try {
        jwt_utils::init_jwt(config);
        std::cout << "JWT initialized successfully" << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Failed to initialize JWT: " << e.what() << std::endl;
        return 1;
    }

    try {
        mongodb_utils::init_mongodb(config);
        std::cout << "MongoDB initialized successfully" << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Failed to initialize MongoDB: " << e.what() << std::endl;
        std::cerr << "Running without database support" << std::endl;
    }

    SessionStorage session_storage;
    Server server;

    register_handlers(server, session_storage, config);

    std::cout << "\nAuthorization Server listening on " << host << ":" << port << "\n";

    server.listen(host.c_str(), port);
    return 0;
}