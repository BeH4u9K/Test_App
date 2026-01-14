#include "../include/config_loader.hpp"
#include <fstream>
#include <iostream>
#include <filesystem>

bool load_config(nlohmann::json& config) {
    try {
        std::vector<std::string> possible_paths = {
            "config/config.json",
            "../config/config.json",
            "../../config/config.json",
            "Authorization_Server/config/config.json"
        };
        
        std::ifstream config_file;
        
        for (const auto& path : possible_paths) {
            config_file.open(path);
        }
        
        if (!config_file.is_open()) {
            std::cerr << "ERROR: Config file not found. Tried:\n";
            for (const auto& path : possible_paths) {
                std::cerr << "  - " << path << "\n";
            }
            return false;
        }
        
        config_file >> config;
        config_file.close();

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