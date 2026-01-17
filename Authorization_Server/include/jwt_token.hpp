#pragma once
#include <string>
#include <vector>
#include <chrono>
#include <optional>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <map>
#include <openssl/sha.h>
#include <openssl/hmac.h>

class JWTHandler {
private:
    std::string secret_key_;

    static std::string base64_encode(const std::string& input) {
        static const std::string base64_chars = 
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyz"
            "0123456789+/";
        
        std::string ret;
        int i = 0;
        int j = 0;
        unsigned char char_array_3[3];
        unsigned char char_array_4[4];
        size_t in_len = input.size();
        const unsigned char* bytes_to_encode = (const unsigned char*)input.c_str();
        
        while (in_len--) {
            char_array_3[i++] = *(bytes_to_encode++);
            if (i == 3) {
                char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
                char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
                char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
                char_array_4[3] = char_array_3[2] & 0x3f;
                
                for(i = 0; i < 4; i++)
                    ret += base64_chars[char_array_4[i]];
                i = 0;
            }
        }
        
        if (i) {
            for(j = i; j < 3; j++)
                char_array_3[j] = '\0';
            
            char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
            char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
            char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
            char_array_4[3] = char_array_3[2] & 0x3f;
            
            for (j = 0; j < i + 1; j++)
                ret += base64_chars[char_array_4[j]];
            
            while(i++ < 3)
                ret += '=';
        }
        
        return ret;
    }

    std::string hmac_sha256(const std::string& data) const {
        unsigned char* digest;
        digest = HMAC(EVP_sha256(), 
                     secret_key_.c_str(), secret_key_.length(),
                     (unsigned char*)data.c_str(), data.length(),
                     NULL, NULL);
        
        std::stringstream ss;
        for(int i = 0; i < 32; i++) {
            ss << std::hex << std::setw(2) << std::setfill('0') << (int)digest[i];
        }
        return ss.str();
    }

    static std::string base64_url_encode(const std::string& input) {
        std::string base64 = base64_encode(input);
        std::string url_safe;
        for(char c : base64) {
            if(c == '+') url_safe += '-';
            else if(c == '/') url_safe += '_';
            else if(c == '=') continue;
            else url_safe += c;
        }
        return url_safe;
    }

    static std::string base64_url_decode(const std::string& input) {
        std::string base64 = input;
        for(char& c : base64) {
            if(c == '-') c = '+';
            else if(c == '_') c = '/';
        }

        int padding = 4 - (base64.length() % 4);
        if (padding < 4) {
            base64.append(padding, '=');
        }

        static const std::string base64_chars = 
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyz"
            "0123456789+/";
        
        std::string ret;
        int i = 0;
        int j = 0;
        unsigned char char_array_4[4];
        unsigned char char_array_3[3];
        size_t in_len = base64.size();
        
        while (in_len-- && base64[i] != '=') {
            char_array_4[j++] = base64_chars.find(base64[i]);
            i++;
            if (j == 4) {
                char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
                char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
                char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];
                
                for (j = 0; j < 3; j++)
                    ret += char_array_3[j];
                j = 0;
            }
        }
        
        if (j) {
            for (int k = j; k < 4; k++)
                char_array_4[k] = 0;
            
            char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
            char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
            char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];
            
            for (int k = 0; k < j - 1; k++)
                ret += char_array_3[k];
        }
        
        return ret;
    }

    std::vector<std::string> split_token(const std::string& token) const {
        std::vector<std::string> parts;
        std::stringstream ss(token);
        std::string part;
        
        while (std::getline(ss, part, '.')) {
            parts.push_back(part);
        }
        
        return parts;
    }

    bool verify_signature(const std::string& header, const std::string& payload, const std::string& signature) const {
        std::string data = header + "." + payload;
        std::string expected_signature = hmac_sha256(data);
        std::string expected_signature_encoded = base64_url_encode(expected_signature);
        
        return signature == expected_signature_encoded;
    }

    static nlohmann::json parse_json(const std::string& json_str) {
        try {
            return nlohmann::json::parse(json_str);
        } catch (const std::exception& e) {
            std::cerr << "Failed to parse JSON: " << e.what() << std::endl;
            return nlohmann::json();
        }
    }
    
public:
    JWTHandler(const std::string& secret_key) : secret_key_(secret_key) {
        std::cout << "JWT handler initialized with secret key length: " << secret_key.length() << std::endl;
    }

    static std::vector<std::string> get_permissions_for_roles(const std::vector<std::string>& roles) {
        std::map<std::string, std::vector<std::string>> role_permissions = {
            {"Student", {
                "user:fullName:read",
                "user:data:read",
                "course:testList:read",
                "course:test:read",
                "quest:read",
                "test:answer:read",
                "answer:read",
                "answer:update",
                "answer:del"
            }},
            {"Teacher", {
                "user:fullName:read",
                "user:data:read",
                "user:roles:read",
                "course:info:write",
                "course:testList:read",
                "course:test:read",
                "course:test:write",
                "course:test:add",
                "course:test:del",
                "course:userList:read",
                "course:user:add",
                "course:user:del",
                "course:del",
                "quest:list:read",
                "quest:read",
                "quest:update",
                "quest:create",
                "quest:del",
                "test:quest:del",
                "test:quest:add",
                "test:quest:update",
                "test:answer:read",
                "answer:read"
            }},
            {"Admin", {
                "user:list:read",
                "user:fullName:read",
                "user:fullName:write",
                "user:data:read",
                "user:roles:read",
                "user:roles:write",
                "user:block:read",
                "user:block:write",
                "course:info:write",
                "course:testList:read",
                "course:test:read",
                "course:test:write",
                "course:test:add",
                "course:test:del",
                "course:userList:read",
                "course:user:add",
                "course:user:del",
                "course:add",
                "course:del",
                "quest:list:read",
                "quest:read",
                "quest:update",
                "quest:create",
                "quest:del",
                "test:quest:del",
                "test:quest:add",
                "test:quest:update",
                "test:answer:read",
                "answer:read"
            }}
        };
        
        std::vector<std::string> permissions;
        for (const auto& role : roles) {
            auto it = role_permissions.find(role);
            if (it != role_permissions.end()) {
                permissions.insert(permissions.end(), it->second.begin(), it->second.end());
            }
        }

        std::sort(permissions.begin(), permissions.end());
        permissions.erase(std::unique(permissions.begin(), permissions.end()), permissions.end());
        
        return permissions;
    }
    
    // генерация access token 1 минута
    std::string generate_access_token(
        const std::string& user_id,
        const std::string& email,
        const std::vector<std::string>& roles,
        const std::vector<std::string>& permissions
    ) {
        nlohmann::json header = {
            {"alg", "HS256"},
            {"typ", "JWT"}
        };
        std::string header_str = header.dump();
        std::string header_encoded = base64_url_encode(header_str);

        auto now = std::chrono::system_clock::now();
        auto exp = now + std::chrono::minutes(1);
        auto iat_time = std::chrono::system_clock::to_time_t(now);
        auto exp_time = std::chrono::system_clock::to_time_t(exp);
        
        nlohmann::json payload = {
            {"sub", user_id},
            {"email", email},
            {"roles", roles},
            {"permissions", permissions},
            {"token_type", "access"},
            {"iat", iat_time},
            {"exp", exp_time}
        };
        
        std::string payload_str = payload.dump();
        std::string payload_encoded = base64_url_encode(payload_str);

        std::string data = header_encoded + "." + payload_encoded;
        std::string signature = hmac_sha256(data);
        std::string signature_encoded = base64_url_encode(signature);
        
        std::string token = header_encoded + "." + payload_encoded + "." + signature_encoded;
        
        std::cout << "Generated access token for user: " << user_id 
                  << ", expires: " << std::ctime(&exp_time);
        return token;
    }
    
    // генерация refresh token 7 дней
    std::string generate_refresh_token(
        const std::string& user_id,
        const std::string& email
    ) {
        nlohmann::json header = {
            {"alg", "HS256"},
            {"typ", "JWT"}
        };
        std::string header_str = header.dump();
        std::string header_encoded = base64_url_encode(header_str);

        auto now = std::chrono::system_clock::now();
        auto exp = now + std::chrono::hours(24 * 7);
        auto iat_time = std::chrono::system_clock::to_time_t(now);
        auto exp_time = std::chrono::system_clock::to_time_t(exp);
        
        nlohmann::json payload = {
            {"sub", user_id},
            {"email", email},
            {"token_type", "refresh"},
            {"iat", iat_time},
            {"exp", exp_time}
        };
        
        std::string payload_str = payload.dump();
        std::string payload_encoded = base64_url_encode(payload_str);

        std::string data = header_encoded + "." + payload_encoded;
        std::string signature = hmac_sha256(data);
        std::string signature_encoded = base64_url_encode(signature);
        
        std::string token = header_encoded + "." + payload_encoded + "." + signature_encoded;
        
        std::cout << "Generated refresh token for user: " << user_id 
                  << ", expires: " << std::ctime(&exp_time);
        return token;
    }

    bool validate_token(const std::string& token) {
        auto parts = split_token(token);
        if (parts.size() != 3) {
            std::cerr << "Invalid token format: expected 3 parts" << std::endl;
            return false;
        }
        
        std::string header_decoded = base64_url_decode(parts[0]);
        std::string payload_decoded = base64_url_decode(parts[1]);
        
        if (!verify_signature(parts[0], parts[1], parts[2])) {
            std::cerr << "Invalid token signature" << std::endl;
            return false;
        }
        
        auto payload_json = parse_json(payload_decoded);
        if (payload_json.empty() || !payload_json.contains("exp")) {
            std::cerr << "Invalid token payload" << std::endl;
            return false;
        }
        
        auto exp_time = payload_json["exp"].get<time_t>();
        auto now = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
        
        if (now >= exp_time) {
            std::cerr << "Token expired" << std::endl;
            return false;
        }
        
        return true;
    }

    bool is_refresh_token(const std::string& token) {
        auto parts = split_token(token);
        if (parts.size() != 3) {
            return false;
        }
        
        std::string payload_decoded = base64_url_decode(parts[1]);
        auto payload_json = parse_json(payload_decoded);
        
        if (payload_json.contains("token_type")) {
            return payload_json["token_type"].get<std::string>() == "refresh";
        }
        
        return false;
    }

    std::optional<std::string> get_email(const std::string& token) {
        auto parts = split_token(token);
        if (parts.size() != 3) {
            return std::nullopt;
        }
        
        std::string payload_decoded = base64_url_decode(parts[1]);
        auto payload_json = parse_json(payload_decoded);
        
        if (payload_json.contains("email")) {
            return payload_json["email"].get<std::string>();
        }
        
        return std::nullopt;
    }

    std::optional<std::string> get_user_id(const std::string& token) {
        auto parts = split_token(token);
        if (parts.size() != 3) {
            return std::nullopt;
        }
        
        std::string payload_decoded = base64_url_decode(parts[1]);
        auto payload_json = parse_json(payload_decoded);
        
        if (payload_json.contains("sub")) {
            return payload_json["sub"].get<std::string>();
        }
        
        return std::nullopt;
    }

    std::optional<std::vector<std::string>> get_roles(const std::string& token) {
        auto parts = split_token(token);
        if (parts.size() != 3) {
            return std::nullopt;
        }
        
        std::string payload_decoded = base64_url_decode(parts[1]);
        auto payload_json = parse_json(payload_decoded);
        
        if (payload_json.contains("roles") && payload_json["roles"].is_array()) {
            std::vector<std::string> roles;
            for (const auto& role : payload_json["roles"]) {
                roles.push_back(role.get<std::string>());
            }
            return roles;
        }
        
        return std::nullopt;
    }

    std::optional<std::vector<std::string>> get_permissions(const std::string& token) {
        auto parts = split_token(token);
        if (parts.size() != 3) {
            return std::nullopt;
        }
        
        std::string payload_decoded = base64_url_decode(parts[1]);
        auto payload_json = parse_json(payload_decoded);
        
        if (payload_json.contains("permissions") && payload_json["permissions"].is_array()) {
            std::vector<std::string> permissions;
            for (const auto& perm : payload_json["permissions"]) {
                permissions.push_back(perm.get<std::string>());
            }
            return permissions;
        }
        
        return std::nullopt;
    }
};