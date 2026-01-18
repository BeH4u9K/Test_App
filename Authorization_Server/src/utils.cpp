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

void send_user_to_main_module(const std::string& user_id, const std::string& email) {
    httplib::Client cli("localhost", 8081);
    
    json request_data = {
        {"id", user_id},
        {"email", email}
    };
    
    cli.Post("/users", request_data.dump(), "application/json");
}