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
    std::cout << "=== Sending data to main module ===" << std::endl;
    std::cout << "Email: " << email << std::endl;
    std::cout << "Port: 8081" << std::endl;
    
    httplib::Client cli("localhost", 8081);
    cli.set_connection_timeout(5);
    cli.set_read_timeout(5);
    cli.set_keep_alive(true);
    
    json request_data = {{"email", email}};
    std::string json_body = request_data.dump();
    
    std::cout << "Sending JSON: " << json_body << std::endl;
    std::cout << "Content-Type: application/json" << std::endl;
    
    auto res = cli.Post("/users", json_body, "application/json");
    
    if (res) {
        std::cout << "Response status: " << res->status << std::endl;
        std::cout << "Response body: " << res->body << std::endl;
        std::cout << "Response headers:" << std::endl;
        for (const auto& header : res->headers) {
            std::cout << "  " << header.first << ": " << header.second << std::endl;
        }
        
        if (res->status == 200) {
            std::cout << "✓ Successfully sent to main module" << std::endl;
        } else {
            std::cerr << "✗ Main module error: " << res->status << std::endl;
        }
    } else {
        auto err = res.error();
        std::cerr << "✗ Connection error: " << httplib::to_string(err) << std::endl;
        std::cerr << "  Error details: " << httplib::to_string(err) << std::endl;
        
        // Try alternative addresses
        std::cerr << "\nTrying alternative addresses..." << std::endl;
        
        // Try 127.0.0.1 instead of localhost
        httplib::Client cli2("127.0.0.1", 8081);
        cli2.set_connection_timeout(3);
        auto res2 = cli2.Post("/users", json_body, "application/json");
        if (res2) {
            std::cerr << "  ✓ 127.0.0.1 is working! Status: " << res2->status << std::endl;
        } else {
            std::cerr << "  ✗ 127.0.0.1 is also not working" << std::endl;
        }
    }
    std::cout << "==================================" << std::endl;
}