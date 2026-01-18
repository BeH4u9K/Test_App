#pragma once
#include <string>
#include <optional>
#include "../libs/httplib.h"

std::string generate_state_token();
void set_cors_headers(httplib::Response& res);