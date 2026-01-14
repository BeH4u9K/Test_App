#define CPPHTTPLIB_OPENSSL_SUPPORT
#include "../include/utils.hpp"
#include <random>
#include <sstream>

using namespace httplib;

std::string generate_state_token() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    std::stringstream ss;
    for (int i = 0; i < 32; ++i)
        ss << std::hex << dis(gen);
    return ss.str();
}

void set_cors_headers(Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    res.set_header("Access-Control-Allow-Credentials", "true");
    res.set_header("Access-Control-Max-Age", "3600");
}

std::optional<std::string> http_post(
    const std::string& host,
    const std::string& path,
    const std::string& body,
    const std::string& content_type
) {
    SSLClient cli(host.c_str());
    cli.set_connection_timeout(5);
    cli.set_read_timeout(5);
    cli.enable_server_certificate_verification(false);

    auto res = cli.Post(path.c_str(), body, content_type.c_str());
    if (res && res->status == 200)
        return res->body;

    return std::nullopt;
}

std::optional<std::string> http_get_with_auth(
    const std::string& host,
    const std::string& path,
    const std::string& token
) {
    SSLClient cli(host.c_str());
    cli.set_connection_timeout(5);
    cli.set_read_timeout(5);
    cli.enable_server_certificate_verification(false);
    cli.set_bearer_token_auth(token.c_str());

    auto res = cli.Get(path.c_str());
    if (res && res->status == 200)
        return res->body;

    return std::nullopt;
}
