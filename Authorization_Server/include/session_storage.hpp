#pragma once
#include "auth_session.hpp"
#include <map>
#include <mutex>
#include <optional>

class SessionStorage {
private:
    std::map<std::string, AuthSession> sessions_;
    std::mutex mutex_;
    
public:
    void add_session(const AuthSession& session) {
        std::lock_guard<std::mutex> lock(mutex_);
        sessions_[session.state_token] = session;
    }
    
    std::optional<AuthSession> get_session(const std::string& state_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = sessions_.find(state_token);
        if (it != sessions_.end()) {
            return it->second;
        }
        return std::nullopt;
    }
    
    void update_session(const AuthSession& session) {
        std::lock_guard<std::mutex> lock(mutex_);
        sessions_[session.state_token] = session;
    }
    
    void remove_session(const std::string& state_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        sessions_.erase(state_token);
    }

    void cleanup_expired() {
        std::lock_guard<std::mutex> lock(mutex_);
        auto now = std::chrono::system_clock::now();
        for (auto it = sessions_.begin(); it != sessions_.end(); ) {
            if (it->second.is_expired()) {
                it = sessions_.erase(it);
            }
            else {
                ++it;
            }
        }
    }
};