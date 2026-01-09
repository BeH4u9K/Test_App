#pragma once
#include <string>
#include <chrono>

enum class AuthStatus {
    PENDING, // не получен
    GRANTED, // доступ предоставлен 
    DENIED, // в доступе отказано
    EXPIRED // время действия токена закончилось
};

struct AuthSession {
    std::string state_token;
    std::chrono::system_clock::time_point created_at;
    std::chrono::system_clock::time_point expires_at;
    AuthStatus status;
    std::string provider; // github, yandex, code
    
    bool is_expired() const {
        return std::chrono::system_clock::now() > expires_at;
    }
};