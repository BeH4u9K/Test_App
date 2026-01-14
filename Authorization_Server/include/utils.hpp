#pragma once
#include <string>
#include <optional>
#include "../libs/httplib.h"

std::string generate_state_token();
void set_cors_headers(httplib::Response& res);

std::optional<std::string> http_post(
    const std::string& host,
    const std::string& path,
    const std::string& body,
    const std::string& content_type = "application/x-www-form-urlencoded"
);

std::optional<std::string> http_get_with_auth(
    const std::string& host,
    const std::string& path,
    const std::string& token
);
