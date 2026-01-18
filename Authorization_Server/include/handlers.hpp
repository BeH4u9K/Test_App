#pragma once
#include "../libs/httplib.h"
#include "../libs/json/json.hpp"
#include "session_storage.hpp"
#include "jwt_token.hpp"
#include <memory>

struct MongoDB;

void register_handlers(
    httplib::Server& server,
    SessionStorage& session_storage,
    const nlohmann::json& config,
    std::shared_ptr<MongoDB> mongo_db,
    std::shared_ptr<JWTHandler> jwt_handler
);