#include "../include/utils.hpp"
#include <random>
#include <sstream>
#include <iomanip>
#include <iostream>

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

std::optional<std::string> http_post(
    const std::string& host,
    const std::string& path,
    const std::string& body,
    const std::string& content_type
) {
    Client cli(host);
    cli.set_connection_timeout(10);
    cli.set_read_timeout(10);
    
    std::cout << "HTTP POST to: " << host << path << std::endl;
    
    auto res = cli.Post(path.c_str(), body, content_type.c_str());
    
    if (res) {
        std::cout << "Response status: " << res->status << std::endl;
        if (res->status == 200) {
            return res->body;
        } else {
            std::cerr << "Error response body: " << res->body << std::endl;
        }
    } else {
        std::cerr << "ERROR: No response from server " << host << std::endl;
    }
    
    return std::nullopt;
}

std::optional<std::string> http_post_with_headers(
    const std::string& host, 
    const std::string& path, 
    const std::string& body,
    const httplib::Headers& headers
) {
    try {
        httplib::Client cli(host.c_str());
        cli.set_connection_timeout(5);
        cli.set_read_timeout(5);
        
        httplib::Headers final_headers = headers;
        final_headers.emplace("Content-Type", "application/x-www-form-urlencoded");
        
        auto res = cli.Post(path.c_str(), final_headers, body, "application/x-www-form-urlencoded");
        
        if (!res) {
            std::cerr << "HTTP POST failed: No response from " << host << path << std::endl;
            return std::nullopt;
        }
        
        if (res->status != 200) {
            std::cerr << "HTTP POST failed: Status " << res->status 
                      << " from " << host << path << std::endl;
            std::cerr << "Response body: " << res->body << std::endl;
            return std::nullopt;
        }
        
        return res->body;
        
    } catch (const std::exception& e) {
        std::cerr << "HTTP POST exception: " << e.what() << std::endl;
        return std::nullopt;
    }
}