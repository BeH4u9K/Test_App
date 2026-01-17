#include "../include/mongodb.hpp"
#include <iostream>
#include <random>

class MongoDB::Impl {
public:
    Impl(const std::string& connection_string, const std::string& db_name) {
        std::cout << "MongoDB connecting to: " << connection_string 
                  << ", database: " << db_name << std::endl;
    }
    
    ~Impl() {
        std::cout << "MongoDB disconnecting" << std::endl;
    }
    
    std::optional<User> find_user_by_email(const std::string& email) {
        std::cout << "MongoDB: Searching for user with email: " << email << std::endl;
        // заглушка
        return std::nullopt;
    }
    
    bool create_user(const std::string& email, const std::string& username, 
                    const std::vector<std::string>& roles) {
        std::cout << "MongoDB: Creating new user - Email: " << email 
                  << ", Username: " << username << ", Roles: ";
        for (const auto& role : roles) {
            std::cout << role << " ";
        }
        std::cout << std::endl;
        return true;
    }
    
    bool add_refresh_token(const std::string& email, const std::string& refresh_token) {
        std::cout << "MongoDB: Adding refresh token to user " << email 
                  << " (token: " << refresh_token.substr(0, 10) << "...)" << std::endl;
        return true;
    }
    
    bool remove_refresh_token(const std::string& email, const std::string& refresh_token) {
        std::cout << "MongoDB: Removing refresh token from user " << email << std::endl;
        return true;
    }
};

MongoDB::MongoDB(const std::string& connection_string, const std::string& db_name)
    : pimpl_(std::make_unique<Impl>(connection_string, db_name)) {}

MongoDB::~MongoDB() = default;

std::optional<User> MongoDB::find_user_by_email(const std::string& email) {
    return pimpl_->find_user_by_email(email);
}

bool MongoDB::create_user(const std::string& email, const std::string& username, 
                         const std::vector<std::string>& roles) {
    return pimpl_->create_user(email, username, roles);
}

bool MongoDB::add_refresh_token(const std::string& email, const std::string& refresh_token) {
    return pimpl_->add_refresh_token(email, refresh_token);
}

bool MongoDB::remove_refresh_token(const std::string& email, const std::string& refresh_token) {
    return pimpl_->remove_refresh_token(email, refresh_token);
}