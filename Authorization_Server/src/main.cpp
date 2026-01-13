#include <iostream>
#include "../libs/httplib.h"
#include "../include/session_storage.hpp"
#include "../include/config_loader.hpp"
#include "../include/handlers.hpp"

using json = nlohmann::json;
using namespace httplib;

int main() {
    json config;
    if (!load_config(config)) {
        config = {{"server", {{"port", 8080}, {"host", "0.0.0.0"}}}};
    }

    std::string host = config["server"]["host"];
    int port = config["server"]["port"];

    SessionStorage session_storage;
    Server server;

    register_handlers(server, session_storage, config);

    std::cout << "Authorization Server listening on " << host << ":" << port << "\n";

    server.listen(host.c_str(), port);
    return 0;
}
