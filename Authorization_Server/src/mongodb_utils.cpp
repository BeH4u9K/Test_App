#include "../include/mongodb_utils.hpp"
#include <iostream>
#include <random>
#include <chrono>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>
#include <mongocxx/database.hpp>
#include <mongocxx/collection.hpp>
#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/json.hpp>

namespace mongodb_utils {

static mongocxx::instance instance{};
static mongocxx::client* client = nullptr;
static mongocxx::database* db = nullptr;
static mongocxx::collection* users_collection = nullptr;

void init_mongodb(const nlohmann::json& config) {
    try {
        std::string uri = "mongodb://localhost:27017";
        std::string database_name = "auth_database";
        
        if (config.contains("mongodb")) {
            const auto& mongo_config = config["mongodb"];
            if (mongo_config.contains("uri")) {
                uri = mongo_config["uri"].get<std::string>();
            }
            if (mongo_config.contains("database")) {
                database_name = mongo_config["database"].get<std::string>();
            }
        }
        
        std::cout << "Connecting to MongoDB: " << uri << std::endl;
        
        mongocxx::uri mongodb_uri(uri);
        client = new mongocxx::client(mongodb_uri);
        db = new mongocxx::database((*client)[database_name]);
        users_collection = new mongocxx::collection((*db)["users"]);
        
        auto ping_cmd = bsoncxx::builder::stream::document{} 
            << "ping" << 1 
            << bsoncxx::builder::stream::finalize;
        
        auto result = db->run_command(ping_cmd.view());
        std::cout << "MongoDB connection OK" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "MongoDB connection error: " << e.what() << std::endl;
        throw;
    }
}

std::string generate_random_username(const std::string& prefix) {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(1000, 9999);
    return prefix + std::to_string(dis(gen));
}

User find_or_create_user(
    const std::string& email,
    const std::string& provider,
    const std::string& username_prefix
) {
    User user;
    
    try {
        if (!users_collection) {
            throw std::runtime_error("MongoDB not initialized");
        }
        
        auto filter = bsoncxx::builder::stream::document{}
            << "email" << email
            << bsoncxx::builder::stream::finalize;
        
        auto result = users_collection->find_one(filter.view());
        
        if (result) {
            auto doc = *result;
            user.id = doc["_id"].get_oid().value.to_string();
            user.email = email;
            user.provider = provider;
            
            if (doc["username"]) {
                user.username = doc["username"].get_string().value.to_string();
            }
            
            if (doc["roles"]) {
                auto roles_array = doc["roles"].get_array().value;
                for (auto&& role : roles_array) {
                    user.roles.push_back(role.get_string().value.to_string());
                }
            }
            
            std::cout << "User found: " << user.username << " (" << email << ")" << std::endl;
            
        } else {
            user.email = email;
            user.provider = provider;
            user.username = generate_random_username(username_prefix);
            user.roles = {"Student"};
            
            auto insert_doc = bsoncxx::builder::stream::document{}
                << "email" << email
                << "username" << user.username
                << "roles" << [&user](bsoncxx::builder::stream::array_context<> arr) {
                    for (const auto& role : user.roles) {
                        arr << role;
                    }
                }
                << "access_tokens" << bsoncxx::builder::stream::open_array
                << bsoncxx::builder::stream::close_array
                << "provider" << provider
                << "created_at" << bsoncxx::types::b_date(std::chrono::system_clock::now())
                << bsoncxx::builder::stream::finalize;
            
            auto insert_result = users_collection->insert_one(insert_doc.view());
            
            if (insert_result) {
                user.id = insert_result->inserted_id().get_oid().value.to_string();
                std::cout << "New user created: " << user.username 
                          << " (" << email << ")" << std::endl;
            } else {
                throw std::runtime_error("Failed to create user");
            }
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Error in find_or_create_user: " << e.what() << std::endl;
        user.id = provider + "_user_" + email.substr(0, email.find('@'));
        user.email = email;
        user.username = generate_random_username(username_prefix);
        user.roles = {"Student"};
        user.provider = provider;
    }
    
    return user;
}

void save_refresh_token(const std::string& user_id, const std::string& refresh_token) {
    try {
        if (!users_collection) {
            throw std::runtime_error("MongoDB not initialized");
        }
        
        auto filter = bsoncxx::builder::stream::document{}
            << "_id" << bsoncxx::oid(user_id)
            << bsoncxx::builder::stream::finalize;
        
        auto update = bsoncxx::builder::stream::document{}
            << "$push" << bsoncxx::builder::stream::open_document
                << "access_tokens" << refresh_token
            << bsoncxx::builder::stream::close_document
            << bsoncxx::builder::stream::finalize;
        
        auto result = users_collection->update_one(filter.view(), update.view());
        
        if (result && result->modified_count() > 0) {
            std::cout << "Refresh token saved for user: " << user_id << std::endl;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Error saving refresh token: " << e.what() << std::endl;
    }
}

}