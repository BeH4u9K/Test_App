#pragma once
#include <string>
#include <chrono>
#include <optional>

enum class AuthStatus {
    PENDING, // не получен
    GRANTED, // доступ предоставлен 
    DENIED, // в доступе отказано
    EXPIRED // время действия токена закончилось
};

struct AuthSession {
    std::string login_token;
    std::string oauth_state;
    std::string provider; // github, yandex, code
    
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point expires_at;
    AuthStatus status;

    std::optional<std::string> access_token;
    std::optional<std::string> refresh_token;
    std::optional<std::string> user_id;
    
    bool is_expired() const {
        return std::chrono::system_clock::now() > expires_at;
    }
};