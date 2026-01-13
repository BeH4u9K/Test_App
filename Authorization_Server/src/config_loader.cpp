#include "../include/config_loader.hpp"
#include <fstream>
#include <iostream>

bool load_config(nlohmann::json& config) {
    try {
        std::ifstream config_file("config/config.json");
        if (!config_file.is_open()) {
            std::cerr << "Config file not found. Create config/config.json from config.example.json\n";
            return false;
        }
        config_file >> config;
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error loading config: " << e.what() << "\n";
        return false;
    }
}
