#pragma once
#include <string>
#include <vector>
#include <chrono>
#include <optional>
#include <iostream>
#include <sstream>
#include <iomanip>
#include <openssl/hmac.h>
#include "../libs/json/json.hpp"

class JWTHandler {
private:
    std::string secret_key_;

    static std::string base64_url_encode(const std::string& input) {
        const std::string base64_chars = 
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
        
        std::string url_safe;
        for(char c : ret) {
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

        const std::string base64_chars = 
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

    std::string hmac_sha256(const std::string& data) const {
        unsigned char* digest = HMAC(EVP_sha256(), secret_key_.c_str(), secret_key_.length(),
            (unsigned char*)data.c_str(), data.length(), NULL, NULL);
        
        std::stringstream ss;
        for(int i = 0; i < 32; i++) {
            ss << std::hex << std::setw(2) << std::setfill('0') << (int)digest[i];
        }
        return ss.str();
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
        return signature == base64_url_encode(hmac_sha256(data));
    }
    
public:
    JWTHandler(const std::string& secret_key) : secret_key_(secret_key) {}
    
    std::string generate_access_token(const std::vector<std::string>& permissions) {
        nlohmann::json header = {{"alg", "HS256"}, {"typ", "JWT"}};
        std::string header_encoded = base64_url_encode(header.dump());

        auto now = std::chrono::system_clock::now();
        auto exp = now + std::chrono::minutes(1);
        
        nlohmann::json payload = {
            {"permissions", permissions},
            {"token_type", "access"},
            {"iat", std::chrono::system_clock::to_time_t(now)},
            {"exp", std::chrono::system_clock::to_time_t(exp)}
        };
        
        std::string payload_encoded = base64_url_encode(payload.dump());
        std::string signature_encoded = base64_url_encode(hmac_sha256(header_encoded + "." + payload_encoded));
        
        return header_encoded + "." + payload_encoded + "." + signature_encoded;
    }
    
    std::string generate_refresh_token(const std::string& email) {
        nlohmann::json header = {{"alg", "HS256"}, {"typ", "JWT"}};
        std::string header_encoded = base64_url_encode(header.dump());

        auto now = std::chrono::system_clock::now();
        auto exp = now + std::chrono::hours(24 * 7);
        
        nlohmann::json payload = {
            {"email", email},
            {"token_type", "refresh"},
            {"iat", std::chrono::system_clock::to_time_t(now)},
            {"exp", std::chrono::system_clock::to_time_t(exp)}
        };
        
        std::string payload_encoded = base64_url_encode(payload.dump());
        std::string signature_encoded = base64_url_encode(hmac_sha256(header_encoded + "." + payload_encoded));
        
        return header_encoded + "." + payload_encoded + "." + signature_encoded;
    }

    bool validate_token(const std::string& token) {
        auto parts = split_token(token);
        if (parts.size() != 3) {
            return false;
        }
        
        if (!verify_signature(parts[0], parts[1], parts[2])) {
            return false;
        }
        
        std::string payload_decoded = base64_url_decode(parts[1]);
        auto payload_json = nlohmann::json::parse(payload_decoded);
        
        auto exp_time = payload_json["exp"].get<time_t>();
        auto now = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
        
        return now < exp_time;
    }

    bool is_refresh_token(const std::string& token) {
        auto email = get_email(token);
        return email.has_value();
    }

    std::optional<std::string> get_email(const std::string& token) {
        auto parts = split_token(token);
        if (parts.size() != 3) {
            return std::nullopt;
        }
        
        std::string payload_decoded = base64_url_decode(parts[1]);
        auto payload_json = nlohmann::json::parse(payload_decoded);
        
        if (payload_json.contains("email") && payload_json["email"].is_string()) {
            return payload_json["email"].get<std::string>();
        }
        
        return std::nullopt;
    }

    std::optional<std::vector<std::string>> get_permissions(const std::string& token) {
        auto parts = split_token(token);
        if (parts.size() != 3) {
            return std::nullopt;
        }
        
        std::string payload_decoded = base64_url_decode(parts[1]);
        auto payload_json = nlohmann::json::parse(payload_decoded);
        
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