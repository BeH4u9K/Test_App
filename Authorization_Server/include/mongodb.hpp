#pragma once
#include <string>
#include <vector>
#include <optional>
#include <memory>

struct User {
    std::string email;
    std::string username;
    std::vector<std::string> roles;
    std::vector<std::string> refresh_tokens;
};

class MongoDB {
public:
    MongoDB(const std::string& connection_string, const std::string& db_name);
    ~MongoDB();
    
    std::optional<User> find_user_by_email(const std::string& email);
    
    bool create_user(const std::string& email, const std::string& username, 
                     const std::vector<std::string>& roles);
    
    bool add_refresh_token(const std::string& email, const std::string& refresh_token);
    
    bool remove_refresh_token(const std::string& email, const std::string& refresh_token);
    
private:
    class Impl;
    std::unique_ptr<Impl> pimpl_;
};