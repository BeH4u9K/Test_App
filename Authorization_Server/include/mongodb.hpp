#pragma once
#include <string>
#include <vector>
#include <optional>
#include "../libs/httplib.h"
#include "../libs/json/json.hpp"

using json = nlohmann::json;

struct User {
    std::string email;
    std::string username;
    std::vector<std::string> roles;
    std::vector<std::string> access_tokens;
    std::vector<std::string> refresh_tokens;
};

class MongoDB {
private:
    httplib::Client client_;
    
public:
    MongoDB(const std::string& host, int port = 5000);
    
    std::optional<User> find_user(const std::string& email);
    
    bool create_user(const std::string& email, const std::string& username);
    
    bool add_tokens(const std::string& email, const std::string& access_token, const std::string& refresh_token);
    
    bool remove_refresh_token(const std::string& email, const std::string& refresh_token);
};