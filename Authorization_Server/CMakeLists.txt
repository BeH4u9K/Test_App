cmake_minimum_required(VERSION 3.15)
project(AuthorizationServer VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(authorization_server
    src/main.cpp
    src/handlers.cpp
    src/utils.cpp
    src/config_loader.cpp
    src/oauth_github.cpp
    src/oauth_yandex.cpp
)

target_include_directories(authorization_server PRIVATE libs)
target_include_directories(authorization_server PRIVATE libs/json)

if(WIN32)
    target_link_libraries(authorization_server ws2_32 wsock32)
endif()