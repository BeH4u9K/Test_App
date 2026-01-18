#pragma once
#include <string>
#include <chrono>
#include <optional>

enum class AuthStatus {
    PENDING,
    GRANTED,
    DENIED,
    EXPIRED
};

struct AuthSession {
    std::string login_token;
    std::string oauth_state;
    std::string provider;
    
    std::chrono::system_clock::time_point expires_at;
    AuthStatus status;

    std::optional<std::string> access_token;
    std::optional<std::string> refresh_token;
    std::optional<std::string> user_id;
    
    bool is_expired() const {
        return std::chrono::system_clock::now() > expires_at;
    }
};