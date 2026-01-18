#include "../include/config_loader.hpp"
#include <fstream>
#include <iostream>

bool load_config(nlohmann::json& config) {
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
        return false;
    }
    
    config_file >> config;
    return true;
}