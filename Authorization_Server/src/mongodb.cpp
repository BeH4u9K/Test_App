#include "../include/mongodb.hpp"
#include <iostream>

using json = nlohmann::json;

MongoDB::MongoDB(const std::string& host, int port) 
    : client_(host, port) {}

std::optional<User> MongoDB::find_user(const std::string& email) {
    auto res = client_.Get(("/find_user?email=" + email).c_str());
    
    if (res && res->status == 200) {
        json j = json::parse(res->body);
        
        User user;
        user.email = j["email"].get<std::string>();
        user.username = j["username"].get<std::string>();

        user.roles = j.value("roles", std::vector<std::string>{"Студент"});

        user.access_tokens = j.value("access_tokens", std::vector<std::string>{});
        user.refresh_tokens = j.value("refresh_tokens", std::vector<std::string>{});

        std::cout << "MongoDB find user - email: " << email << ", access_tokens: " 
            << user.access_tokens.size() << ", refresh_tokens: " << user.refresh_tokens.size() << std::endl;
        
        return user;
    }
    
    return std::nullopt;
}

bool MongoDB::create_user(const std::string& email, const std::string& username) {
    json j = {{"email", email}, {"username", username}};
    std::cout << "MongoDB create user - email: " << email << ", username: " << username << std::endl;

    auto res = client_.Post("/create_user", j.dump(), "application/json");
    
    return res && res->status == 200;
}

bool MongoDB::add_tokens(const std::string& email, const std::string& access_token, const std::string& refresh_token) {
    json j = {
        {"email", email}, 
        {"access_token", access_token},
        {"refresh_token", refresh_token}
    };
    auto res = client_.Post("/add_tokens", j.dump(), "application/json");
    std::cout << "MongoDB add tokens - email: " << email << std::endl;
    
    return res && res->status == 200;
}

bool MongoDB::remove_refresh_token(const std::string& email, const std::string& refresh_token) {
    json j = {{"email", email}, {"refresh_token", refresh_token}};
    auto res = client_.Post("/remove_refresh_token", j.dump(), "application/json");
    std::cout << "MongoDB remove refresh token - email: " << email << std::endl;
    
    return res != nullptr;
}