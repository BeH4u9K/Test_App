#include "../include/mongodb.hpp"
#include <iostream>
#include <random>
#include <fstream>
#include <filesystem>

MongoDB::MongoDB(const std::string& connection_string, const std::string& db_name) {
    std::cout << "MongoDB: Using file storage" << std::endl;
    db_path_ = "data/";
}

MongoDB::~MongoDB() {}

std::optional<User> MongoDB::find_user_by_email(const std::string& email) {
    std::string filename = db_path_ + "user_" + email + ".json";
    
    if (!std::filesystem::exists(filename)) {
        std::cout << "MongoDB: User not found - " << email << std::endl;
        return std::nullopt;
    }
    
    std::string json_str = load_from_file(filename);

    if (json_str.empty() || json_str.find("email") == std::string::npos) {
        return std::nullopt;
    }

    User user;
    user.email = email;

    size_t username_pos = json_str.find("\"username\":\"");
    if (username_pos != std::string::npos) {
        size_t start = username_pos + 11;
        size_t end = json_str.find("\"", start);
        if (end != std::string::npos) {
            user.username = json_str.substr(start, end - start);
        }
    }

    user.roles = {"Student"};

    size_t roles_pos = json_str.find("\"roles\":[");
    if (roles_pos != std::string::npos) {
        size_t start = roles_pos + 9;
        size_t end = json_str.find("]", start);
        if (end != std::string::npos) {
            std::string roles_str = json_str.substr(start, end - start);

            user.roles.clear();
            if (roles_str.find("Student") != std::string::npos) user.roles.push_back("Student");
            if (roles_str.find("Teacher") != std::string::npos) user.roles.push_back("Teacher");
            if (roles_str.find("Admin") != std::string::npos) user.roles.push_back("Admin");
        }
    }
    
    std::cout << "MongoDB: Found user - " << email << std::endl;
    return user;
}

bool MongoDB::create_user(const std::string& email, const std::string& username, 
                         const std::vector<std::string>& roles) {
    std::string filename = db_path_ + "user_" + email + ".json";
    
    if (std::filesystem::exists(filename)) {
        std::cout << "MongoDB: User already exists - " << email << std::endl;
        return false;
    }

    std::string json = "{";
    json += "\"email\":\"" + email + "\",";
    json += "\"username\":\"" + username + "\",";
    json += "\"roles\":[";
    for (size_t i = 0; i < roles.size(); ++i) {
        json += "\"" + roles[i] + "\"";
        if (i < roles.size() - 1) json += ",";
    }
    json += "],";
    json += "\"refresh_tokens\":[]";
    json += "}";
    
    save_to_file(filename, json);
    
    std::cout << "MongoDB: Created user - " << email << std::endl;
    return true;
}

bool MongoDB::add_refresh_token(const std::string& email, const std::string& refresh_token) {
    std::string filename = db_path_ + "user_" + email + ".json";
    
    if (!std::filesystem::exists(filename)) {
        return false;
    }
    
    std::string json_str = load_from_file(filename);

    size_t tokens_pos = json_str.find("\"refresh_tokens\":[");
    if (tokens_pos != std::string::npos) {
        size_t end_array = json_str.find("]", tokens_pos);
        if (end_array != std::string::npos) {

            std::string before = json_str.substr(0, end_array);
            std::string after = json_str.substr(end_array);
            
            std::string new_json = before;
            if (json_str.substr(tokens_pos + 18, end_array - (tokens_pos + 18)).find('[') == std::string::npos) {
                new_json += "\"" + refresh_token + "\"";
            } else {
                new_json += ",\"" + refresh_token + "\"";
            }
            new_json += after;
            
            save_to_file(filename, new_json);
            
            std::cout << "MongoDB: Added refresh token for - " << email << std::endl;
            return true;
        }
    }
    
    return false;
}

bool MongoDB::remove_refresh_token(const std::string& email, const std::string& refresh_token) {
    std::string filename = db_path_ + "user_" + email + ".json";
    
    if (!std::filesystem::exists(filename)) {
        return false;
    }
    
    std::string json_str = load_from_file(filename);

    size_t token_pos = json_str.find(refresh_token);
    if (token_pos != std::string::npos) {

        std::string before = json_str.substr(0, token_pos - 1); // -1 для кавычки
        std::string after = json_str.substr(token_pos + refresh_token.length() + 1); // +1 для кавычки

        if (before.length() > 0 && before.back() == ',') {
            before.pop_back();
        } else if (after.length() > 0 && after.front() == ',') {
            after = after.substr(1);
        }
        
        std::string new_json = before + after;
        save_to_file(filename, new_json);
        
        std::cout << "MongoDB: Removed refresh token for - " << email << std::endl;
        return true;
    }
    
    return false;
}

void MongoDB::save_to_file(const std::string& filename, const std::string& content) {
    std::ofstream file(filename);
    if (file.is_open()) {
        file << content;
        file.close();
    }
}

std::string MongoDB::load_from_file(const std::string& filename) {
    std::ifstream file(filename);
    if (file.is_open()) {
        std::string content((std::istreambuf_iterator<char>(file)), 
                           std::istreambuf_iterator<char>());
        file.close();
        return content;
    }
    return "";
}