#pragma once
#include <string>
#include <optional>
#include "../libs/httplib.h"
#include "../libs/json/json.hpp"

std::string generate_state_token();
void set_cors_headers(httplib::Response& res);
void send_user_to_main_module(const std::string& email);