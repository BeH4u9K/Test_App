#pragma once
#include "auth_session.hpp"
#include <map>
#include <mutex>
#include <optional>
#include <string>
#include <functional>

class SessionStorage {
private:
    std::map<std::string, AuthSession> sessions_by_login_;
    std::map<std::string, std::string> login_by_oauth_state_;
    std::mutex mutex_;
    
public:
    void add_session(const AuthSession& session) {
        std::lock_guard<std::mutex> lock(mutex_);
        sessions_by_login_[session.login_token] = session;
        login_by_oauth_state_[session.oauth_state] = session.login_token;
    }
    
    std::optional<AuthSession> get_session_by_login(const std::string& login_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = sessions_by_login_.find(login_token);
        if (it != sessions_by_login_.end()) {
            return it->second;
        }
        return std::nullopt;
    }
    
    std::optional<AuthSession> get_session_by_oauth_state(const std::string& oauth_state) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = login_by_oauth_state_.find(oauth_state);
        if (it != login_by_oauth_state_.end()) {
            auto session_it = sessions_by_login_.find(it->second);
            if (session_it != sessions_by_login_.end()) {
                return session_it->second;
            }
        }
        return std::nullopt;
    }
    
    void update_session(const AuthSession& session) {
        std::lock_guard<std::mutex> lock(mutex_);
        sessions_by_login_[session.login_token] = session;
    }
    
    std::optional<AuthSession> get_and_update_session_by_oauth_state(
        const std::string& oauth_state,
        std::function<void(AuthSession&)> update_func
    ) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        auto it = login_by_oauth_state_.find(oauth_state);
        if (it == login_by_oauth_state_.end()) {
            return std::nullopt;
        }
        
        auto session_it = sessions_by_login_.find(it->second);
        if (session_it == sessions_by_login_.end()) {
            return std::nullopt;
        }
        
        try {
            update_func(session_it->second);
            return session_it->second;
        } catch (const std::exception& e) {
            std::cerr << "Error updating session: " << e.what() << std::endl;
            return std::nullopt;
        }
    }
    
    bool update_session_status_by_oauth_state(
        const std::string& oauth_state,
        AuthStatus new_status
    ) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        auto it = login_by_oauth_state_.find(oauth_state);
        if (it != login_by_oauth_state_.end()) {
            auto session_it = sessions_by_login_.find(it->second);
            if (session_it != sessions_by_login_.end()) {
                session_it->second.status = new_status;
                return true;
            }
        }
        return false;
    }
    
    void remove_session_by_login(const std::string& login_token) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = sessions_by_login_.find(login_token);
        if (it != sessions_by_login_.end()) {
            login_by_oauth_state_.erase(it->second.oauth_state);
            sessions_by_login_.erase(it);
        }
    }
    
    void remove_session_by_oauth_state(const std::string& oauth_state) {
        std::lock_guard<std::mutex> lock(mutex_);
        auto it = login_by_oauth_state_.find(oauth_state);
        if (it != login_by_oauth_state_.end()) {
            sessions_by_login_.erase(it->second);
            login_by_oauth_state_.erase(it);
        }
    }
    
    void cleanup_expired() {
        std::lock_guard<std::mutex> lock(mutex_);
        auto now = std::chrono::system_clock::now();
        for (auto it = sessions_by_login_.begin(); it != sessions_by_login_.end(); ) {
            if (it->second.is_expired()) {
                login_by_oauth_state_.erase(it->second.oauth_state);
                it = sessions_by_login_.erase(it);
            } else {
                ++it;
            }
        }
    }
};