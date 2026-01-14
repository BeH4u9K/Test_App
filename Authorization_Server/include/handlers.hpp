#pragma once
#include "../libs/httplib.h"
#include "../libs/json/json.hpp"
#include "session_storage.hpp"

void register_handlers(
    httplib::Server& server,
    SessionStorage& session_storage,
    const nlohmann::json& config
);
