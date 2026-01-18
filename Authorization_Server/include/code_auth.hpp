#pragma once
#include <string>
#include <chrono>
#include <map>
#include <mutex>
#include <optional>
#include <random>

struct CodeEntry {
    std::string login_token;
    std::chrono::system_clock::time_point expires_at;
};

class CodeAuthentication {
private:
    std::map<std::string, CodeEntry> codes_;
    std::mutex mutex_;
    
public:
    std::string generate_code(const std::string& login_token) {
        std::lock_guard<std::mutex> lock(mutex_);

        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(10000, 999999);
        
        std::string code;
        do {
            code = std::to_string(dis(gen));
        } while (codes_.find(code) != codes_.end());
        
        CodeEntry entry{
            login_token,
            std::chrono::system_clock::now() + std::chrono::minutes(1)
        };
        
        codes_[code] = entry;
        return code;
    }

    std::optional<CodeEntry> find_code(const std::string& code) {
        std::lock_guard<std::mutex> lock(mutex_);
        
        auto it = codes_.find(code);
        if (it != codes_.end()) {
            if (std::chrono::system_clock::now() > it->second.expires_at) {
                codes_.erase(it);
                return std::nullopt;
            }
            return it->second;
        }
        
        return std::nullopt;
    }

    void remove_code(const std::string& code) {
        std::lock_guard<std::mutex> lock(mutex_);
        codes_.erase(code);
    }
};