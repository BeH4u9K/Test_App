cmake_minimum_required(VERSION 3.15)
project(AuthorizationServer VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# политика для относительных путей
cmake_policy(SET CMP0015 NEW)

# подкаталоги
add_subdirectory(src)