#pragma once
#include "../libs/httplib.h"
#include "../libs/json/json.hpp"
#include "session_storage.hpp"

void handle_github_callback(
    const httplib::Request& req,
    httplib::Response& res,
    SessionStorage& storage,
    const nlohmann::json& config
);
