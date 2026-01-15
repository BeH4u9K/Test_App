#pragma once
#include <string>
#include <vector>
#include <optional>
#include "../libs/json/json.hpp"

namespace mongodb_utils {

void init_mongodb(const nlohmann::json& config);

struct User {
    std::string id;
    std::string email;
    std::string username;
    std::vector<std::string> roles;
    std::string provider;
};

User find_or_create_user(
    const std::string& email,
    const std::string& provider,
    const std::string& username_prefix = "Аноним"
);

void save_refresh_token(const std::string& user_id, const std::string& refresh_token);

}