#pragma once
#include "../libs/httplib.h"
#include "../libs/json/json.hpp"
#include "session_storage.hpp"
#include "jwt_token.hpp"
#include "code_auth.hpp"
#include <memory>

struct MongoDB;

void handle_code_callback(
    const httplib::Request& req,
    httplib::Response& res,
    SessionStorage& storage,
    const nlohmann::json& config,
    std::shared_ptr<MongoDB> mongo_db,
    std::shared_ptr<JWTHandler> jwt_handler,
    std::shared_ptr<CodeAuthentication> code_auth
);