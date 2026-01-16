#pragma once
#include <string>
#include <vector>
#include <chrono>
#include <nlohmann/json.hpp>

namespace jwt_utils {

void init_jwt(const nlohmann::json& config);

std::string generate_access_token(
    const std::string& email,
    const std::vector<std::string>& permissions,
    const std::chrono::seconds& expires_in = std::chrono::minutes(1)
);

std::string generate_refresh_token(
    const std::string& email,
    const std::chrono::seconds& expires_in = std::chrono::hours(7 * 24)
);

std::vector<std::string> generate_permissions_from_roles(const std::vector<std::string>& roles);

}