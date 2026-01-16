cmake_minimum_required(VERSION 3.10)
project(Authorization_Server)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_definitions(-DCPPHTTPLIB_OPENSSL_SUPPORT)

find_package(OpenSSL REQUIRED)
if(OpenSSL_FOUND)
    message(STATUS "OpenSSL found: ${OPENSSL_VERSION}")
    include_directories(${OPENSSL_INCLUDE_DIR})
endif()

find_package(libmongocxx REQUIRED)
find_package(libbsoncxx REQUIRED)

if(libmongocxx_FOUND AND libbsoncxx_FOUND)
    message(STATUS "MongoDB C++ driver found")
    include_directories(${LIBMONGOCXX_INCLUDE_DIRS} ${LIBBSONCXX_INCLUDE_DIRS})
else()
    message(WARNING "MongoDB C++ driver not found, building without MongoDB support")
    add_definitions(-DNO_MONGODB)
endif()

find_package(jwt-cpp REQUIRED)

set(SOURCES
    src/main.cpp
    src/handlers.cpp
    src/config_loader.cpp
    src/oauth_github.cpp
    src/oauth_yandex.cpp
    src/utils.cpp
    src/mongodb_utils.cpp
    src/jwt_utils.cpp
)

add_executable(authorization_server ${SOURCES})

target_include_directories(authorization_server PRIVATE 
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/libs
)

target_link_libraries(authorization_server PRIVATE 
    OpenSSL::SSL 
    OpenSSL::Crypto
    jwt-cpp::jwt-cpp
)

if(libmongocxx_FOUND AND libbsoncxx_FOUND)
    target_link_libraries(authorization_server PRIVATE 
        libmongocxx::libmongocxx_shared
        libbsoncxx::libbsoncxx_shared
    )
endif()

if(UNIX AND NOT APPLE)
    target_link_libraries(authorization_server PRIVATE pthread)
endif()