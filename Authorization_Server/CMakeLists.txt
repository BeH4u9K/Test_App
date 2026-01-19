cmake_minimum_required(VERSION 3.10)
project(Authorization_Server)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_definitions(-DCPPHTTPLIB_OPENSSL_SUPPORT)

include_directories(/usr/local/include)

set(SOURCES
    src/main.cpp
    src/handlers.cpp
    src/config_loader.cpp
    src/oauth_github.cpp
    src/oauth_yandex.cpp
    src/utils.cpp
    src/mongodb.cpp
)

add_executable(auth_server ${SOURCES})

target_include_directories(auth_server PRIVATE 
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/libs
    /usr/local/include
)

find_package(OpenSSL REQUIRED)
target_link_libraries(auth_server PRIVATE OpenSSL::SSL OpenSSL::Crypto)