#include "../include/utils.hpp"
#include <random>
#include <sstream>
#include <iomanip>
#include <iostream>

using json = nlohmann::json;
using namespace httplib;

std::string generate_state_token() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    std::stringstream ss;
    for (int i = 0; i < 32; ++i)
        ss << std::hex << dis(gen);
    return ss.str();
}

void set_cors_headers(Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    res.set_header("Access-Control-Allow-Credentials", "true");
    res.set_header("Access-Control-Max-Age", "3600");
}

void send_user_to_main_module(const std::string& email) {
    httplib::Client cli("host.docker.internal", 8081);
    cli.set_connection_timeout(5);
    cli.set_read_timeout(5);
    
    json request_data = {{"email", email}};
    std::string json_body = request_data.dump();
    
    auto res = cli.Post("/api/v1/users", json_body, "application/json");
    
    if (res) {
        if (res->status == 200) {
            std::cout << "User successfully registered in main module" << std::endl;
        } else {
            std::cerr << "Main module error: " << res->status << std::endl;
        }
    } else {
        std::cerr << "Connection error: " << httplib::to_string(res.error()) << std::endl;
    }
}