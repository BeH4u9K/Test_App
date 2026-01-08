cmake_minimum_required(VERSION 3.15)
project(AuthorizationServer VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(MINGW)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -static-libgcc -static-libstdc++")
endif()

add_executable(authorization_server src/main.cpp)
target_include_directories(authorization_server PRIVATE libs)

if(WIN32)
    target_link_libraries(authorization_server ws2_32 wsock32)
endif()