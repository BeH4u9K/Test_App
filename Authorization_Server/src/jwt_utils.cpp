#include "../include/jwt_utils.hpp"
#include <jwt-cpp/jwt.h>
#include <iostream>
#include <mutex>
#include <random>

namespace jwt_utils {

static std::string JWT_SECRET;
static int ACCESS_TOKEN_EXPIRY = 60;
static int REFRESH_TOKEN_EXPIRY = 604800;

void init_jwt(const nlohmann::json& config) {
    if (config.contains("jwt")) {
        const auto& jwt_config = config["jwt"];
        
        if (jwt_config.contains("secret")) {
            JWT_SECRET = jwt_config["secret"].get<std::string>();
        }
        
        if (jwt_config.contains("access_token_expiry")) {
            ACCESS_TOKEN_EXPIRY = jwt_config["access_token_expiry"].get<int>();
        }
        
        if (jwt_config.contains("refresh_token_expiry")) {
            REFRESH_TOKEN_EXPIRY = jwt_config["refresh_token_expiry"].get<int>();
        }
    }
    
    if (JWT_SECRET.empty()) {
        JWT_SECRET = "development_secret_key_change_in_production";
        std::cerr << "WARNING: Using default JWT secret. Change it in config!" << std::endl;
    }
    
    std::cout << "JWT configured - Access expiry: " << ACCESS_TOKEN_EXPIRY 
              << "s, Refresh expiry: " << REFRESH_TOKEN_EXPIRY << "s" << std::endl;
}

std::string generate_access_token(
    const std::string& email,
    const std::vector<std::string>& permissions,
    const std::chrono::seconds& expires_in
) {
    try {
        auto now = std::chrono::system_clock::now();
        auto expires_at = now + expires_in;
        
        // Конвертируем permissions в JSON
        nlohmann::json perms_array = nlohmann::json::array();
        for (const auto& perm : permissions) {
            perms_array.push_back(perm);
        }
        
        auto token = jwt::create()
            .set_issuer("auth-server")
            .set_type("JWT")
            .set_subject(email)
            .set_issued_at(now)
            .set_expires_at(expires_at)
            .set_payload_claim("permissions", jwt::claim(perms_array.dump()))
            .set_payload_claim("token_type", jwt::claim(std::string("access")))
            .sign(jwt::algorithm::hs256{JWT_SECRET});
        
        std::cout << "Generated ACCESS token for: " << email 
                  << ", expires in: " << expires_in.count() << " seconds" << std::endl;
        
        return token;
        
    } catch (const std::exception& e) {
        std::cerr << "Error generating access token: " << e.what() << std::endl;
        return "access_" + email + "_" + std::to_string(std::time(nullptr));
    }
}

std::string generate_refresh_token(
    const std::string& email,
    const std::chrono::seconds& expires_in
) {
    try {
        auto now = std::chrono::system_clock::now();
        auto expires_at = now + expires_in;
        
        auto token = jwt::create()
            .set_issuer("auth-server")
            .set_type("JWT")
            .set_subject(email)
            .set_issued_at(now)
            .set_expires_at(expires_at)
            .set_payload_claim("token_type", jwt::claim(std::string("refresh")))
            .sign(jwt::algorithm::hs256{JWT_SECRET});
        
        std::cout << "Generated REFRESH token for: " << email 
                  << ", expires in: " << expires_in.count() << " seconds" << std::endl;
        
        return token;
        
    } catch (const std::exception& e) {
        std::cerr << "Error generating refresh token: " << e.what() << std::endl;
        return "refresh_" + email + "_" + std::to_string(std::time(nullptr));
    }
}

std::vector<std::string> generate_permissions_from_roles(const std::vector<std::string>& roles) {
    std::vector<std::string> permissions;
    
    for (const auto& role : roles) {
        if (role == "Admin") {
            permissions.push_back("read:all");
            permissions.push_back("write:all");
            permissions.push_back("delete:all");
            permissions.push_back("manage:users");
        } else if (role == "Teacher") {
            permissions.push_back("read:students");
            permissions.push_back("write:grades");
            permissions.push_back("read:materials");
            permissions.push_back("create:materials");
        } else if (role == "Student") {
            permissions.push_back("read:profile");
            permissions.push_back("write:profile");
            permissions.push_back("read:materials");
            permissions.push_back("submit:assignments");
        }
    }

    permissions.push_back("auth:basic");
    
    return permissions;
}

}