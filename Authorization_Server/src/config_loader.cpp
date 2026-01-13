#include "../include/config_loader.hpp"
#include <fstream>
#include <iostream>

bool load_config(nlohmann::json& config) {
    try {
        std::ifstream config_file("config/config.json");
        if (!config_file.is_open()) {
            std::cerr << "ERROR: Config file not found at config/config.json\n";
            std::cerr << "Create it from config.example.json with real values:\n";
            std::cerr << "1. Register OAuth app on GitHub: https://github.com/settings/developers\n";
            std::cerr << "2. Register OAuth app on Yandex: https://oauth.yandex.ru/\n";
            return false;
        }
        config_file >> config;

        bool config_ok = true;
        
        if (!config.contains("github") || !config["github"].contains("client_id") ||
            config["github"]["client_id"].get<std::string>() == "YOUR_GITHUB_CLIENT_ID") {
            std::cerr << "WARNING: GitHub client_id is not configured properly\n";
            config_ok = false;
        }
        
        if (!config.contains("yandex") || !config["yandex"].contains("client_id") ||
            config["yandex"]["client_id"].get<std::string>() == "YOUR_YANDEX_CLIENT_ID") {
            std::cerr << "WARNING: Yandex client_id is not configured properly\n";
            config_ok = false;
        }
        
        if (!config_ok) {
            std::cerr << "Please update config/config.json with real OAuth credentials\n";
        }
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error loading config: " << e.what() << "\n";
        return false;
    }
}