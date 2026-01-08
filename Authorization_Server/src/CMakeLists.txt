# исполняемый файл сервера авторизации
add_executable(authorization_server main.cpp)

# настройки компиляции
target_compile_features(authorization_server PRIVATE cxx_std_17)
target_include_directories(authorization_server PRIVATE ../include)