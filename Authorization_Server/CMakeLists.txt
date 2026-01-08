cmake_minimum_required(VERSION 3.15)
project(AuthorizationServer VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(nlohmann_json 3.2.0 REQUIRED)

add_executable(authorization_server src/main.cpp)

target_include_directories(authorization_server PRIVATE libs)
target_link_libraries(authorization_server PRIVATE nlohmann_json::nlohmann_json)

if(WIN32)
    target_link_libraries(authorization_server ws2_32 wsock32)
endif()