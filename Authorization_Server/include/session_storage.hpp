#pragma once
#include "auth_session.hpp"
#include <map>
#include <mutex>
#include <optional>
#include <string>

class SessionStorage {
private:
    std::map<std::string, AuthSession> sessions_by_state_;
    std::map<std::string, std::string> state_by_login_;
    std::mutex mutex_;
    
public:
    void add_session(const AuthSession& session) {
        std::lock_guard<std::mutex> lock(mutex_);
        sessions_by_state_[session.state_token] = session;
        state_by_login_[session.login_token] = session.state_token;
    }
    
    std::optional<AuthSession> get_session_by_state(const std::string& state_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = sessions_by_state_.find(state_token);
        if (it != sessions_by_state_.end()) {
            return it->second;
        }
        return std::nullopt;
    }

    std::optional<AuthSession> get_session_by_login(const std::string& login_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = state_by_login_.find(login_token);
        if (it != state_by_login_.end()) {
            return get_session_by_state(it->second);
        }
        return std::nullopt;
    }
    
    void update_session(const AuthSession& session) {
        std::lock_guard<std::mutex> lock(mutex_);
        sessions_by_state_[session.state_token] = session;
    }
    
    void remove_session_by_state(const std::string& state_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = sessions_by_state_.find(state_token);
        if (it != sessions_by_state_.end()) {
            state_by_login_.erase(it->second.login_token);
            sessions_by_state_.erase(it);
        }
    }

    void remove_session_by_login(const std::string& login_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = state_by_login_.find(login_token);
        if (it != state_by_login_.end()) {
            sessions_by_state_.erase(it->second);
            state_by_login_.erase(it);
        }
    }

    void cleanup_expired() {
        std::lock_guard<std::mutex> lock(mutex_);
        auto now = std::chrono::system_clock::now();
        for (auto it = sessions_by_state_.begin(); it != sessions_by_state_.end(); ) {
            if (it->second.is_expired()) {
                state_by_login_.erase(it->second.login_token);
                it = sessions_by_state_.erase(it);
            }
            else {
                ++it;
            }
        }
    }
};