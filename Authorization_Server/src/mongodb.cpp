#include "../include/mongodb.hpp"
#include <iostream>

MongoDB::MongoDB(const std::string& host, int port) 
    : client_(host, port) {
    
    std::cout << "MongoDB HTTP client connected to: " << host << ":" << port << std::endl;
}

std::optional<User> MongoDB::find_user_by_email(const std::string& email) {
    auto res = client_.Get(("/find_user?email=" + email).c_str());
    
    if (res && res->status == 200) {
        try {
            json j = json::parse(res->body);
            
            User user;
            user.email = j["email"].get<std::string>();
            user.username = j["username"].get<std::string>();
            
            // Роли
            for (const auto& role : j["roles"]) {
                user.roles.push_back(role.get<std::string>());
            }
            
            // Refresh токены
            if (j.contains("refresh_tokens")) {
                for (const auto& token : j["refresh_tokens"]) {
                    user.refresh_tokens.push_back(token.get<std::string>());
                }
            }
            
            std::cout << "MongoDB: Found user - " << email << std::endl;
            return user;
        } catch (...) {
            std::cerr << "MongoDB: Failed to parse response" << std::endl;
        }
    }
    
    std::cout << "MongoDB: User not found - " << email << std::endl;
    return std::nullopt;
}

bool MongoDB::create_user(const std::string& email, const std::string& username, 
                         const std::vector<std::string>& roles) {
    
    json j;
    j["email"] = email;
    j["username"] = username;
    j["roles"] = roles;
    
    auto res = client_.Post("/create_user", j.dump(), "application/json");
    
    if (res && res->status == 200) {
        std::cout << "MongoDB: Created user - " << email << std::endl;
        return true;
    }
    
    std::cout << "MongoDB: Failed to create user - " << email << std::endl;
    return false;
}

bool MongoDB::add_refresh_token(const std::string& email, const std::string& refresh_token) {
    json j;
    j["email"] = email;
    j["refresh_token"] = refresh_token;
    
    auto res = client_.Post("/add_refresh_token", j.dump(), "application/json");
    
    if (res && res->status == 200) {
        std::cout << "MongoDB: Added refresh token for - " << email << std::endl;
        return true;
    }
    
    return false;
}

bool MongoDB::remove_refresh_token(const std::string& email, const std::string& refresh_token) {
    json j;
    j["email"] = email;
    j["refresh_token"] = refresh_token;
    
    auto res = client_.Post("/remove_refresh_token", j.dump(), "application/json");
    
    if (res) {
        std::cout << "MongoDB: Removed refresh token for - " << email << std::endl;
        return true;
    }
    
    return false;
}