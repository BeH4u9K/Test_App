#pragma once
#include "auth_session.hpp"
#include <map>
#include <mutex>
#include <optional>
#include <string>

class SessionStorage {
private:
    std::map<std::string, AuthSession> sessions_;
    std::mutex mutex_;
    
public:
    void create_session(const std::string& login_token, const std::string& provider) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        AuthSession session{
            login_token,
            provider,
            std::chrono::system_clock::now() + std::chrono::minutes(5),
            AuthStatus::PENDING,
            std::nullopt,
            std::nullopt
        };
        
        sessions_[login_token] = session;
    }
    
    std::optional<AuthSession> get_session(const std::string& login_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = sessions_.find(login_token);
        if (it != sessions_.end()) {
            return it->second;
        }
        return std::nullopt;
    }
    
    void update_session(const AuthSession& session) {
        std::lock_guard<std::mutex> lock(mutex_);
        sessions_[session.login_token] = session;
    }
    
    bool update_session_status(const std::string& login_token, AuthStatus new_status,
                               const std::string& access_token = "",
                               const std::string& refresh_token = "") {
        std::lock_guard<std::mutex> lock(mutex_);
        
        auto it = sessions_.find(login_token);
        if (it != sessions_.end()) {
            it->second.status = new_status;
            if (!access_token.empty()) {
                it->second.access_token = access_token;
            }
            if (!refresh_token.empty()) {
                it->second.refresh_token = refresh_token;
            }
            return true;
        }
        return false;
    }
    
    void remove_session(const std::string& login_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        sessions_.erase(login_token);
    }
};