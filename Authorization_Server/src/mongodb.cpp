#include "../include/mongodb.hpp"
#include <iostream>

using json = nlohmann::json;

MongoDB::MongoDB(const std::string& host, int port) 
    : client_(host, port) {}

std::optional<User> MongoDB::find_user_by_email(const std::string& email) {
    auto res = client_.Get(("/find_user?email=" + email).c_str());
    
    if (res && res->status == 200) {
        json j = json::parse(res->body);
        
        User user;
        user.email = j["email"].get<std::string>();
        user.username = j["username"].get<std::string>();
        user.roles = {"Student"};
        user.refresh_tokens = {};
        
        return user;
    }
    
    return std::nullopt;
}

bool MongoDB::create_user(const std::string& email, const std::string& username) {
    json j = {{"email", email}, {"username", username}};
    auto res = client_.Post("/create_user", j.dump(), "application/json");
    
    return res && res->status == 200;
}

bool MongoDB::add_refresh_token(const std::string& email, const std::string& refresh_token) {
    json j = {{"email", email}, {"refresh_token", refresh_token}};
    auto res = client_.Post("/add_refresh_token", j.dump(), "application/json");
    
    return res && res->status == 200;
}

bool MongoDB::remove_refresh_token(const std::string& email, const std::string& refresh_token) {
    json j = {{"email", email}, {"refresh_token", refresh_token}};
    auto res = client_.Post("/remove_refresh_token", j.dump(), "application/json");
    
    return res != nullptr;
}