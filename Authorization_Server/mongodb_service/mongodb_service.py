from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson import ObjectId, json_util
import json

app = Flask(__name__)

client = MongoClient("mongodb://admin:password123@mongodb:27017/")
db = client.auth_db
users_collection = db.users

@app.route('/find_user', methods=['GET'])
def find_user():
    email = request.args.get('email')
    user = users_collection.find_one({"email": email})
    
    if user:
        return json.loads(json_util.dumps(user))
    else:
        return jsonify({"error": "User not found"}), 404

@app.route('/create_user', methods=['POST'])
def create_user():
    data = request.json

    if users_collection.find_one({"email": data['email']}):
        return jsonify({"error": "User already exists"}), 409
    
    user_data = {
        "email": data['email'],
        "username": data['username'],
        "roles": ["Student"],
        "refresh_tokens": []
    }
    
    result = users_collection.insert_one(user_data)
    
    if result.inserted_id:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to create user"}), 500

@app.route('/add_refresh_token', methods=['POST'])
def add_refresh_token():
    data = request.json
    
    result = users_collection.update_one(
        {"email": data['email']},
        {"$push": {"refresh_tokens": data['refresh_token']}}
    )
    
    if result.modified_count > 0:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "User not found"}), 404

@app.route('/remove_refresh_token', methods=['POST'])
def remove_refresh_token():
    data = request.json
    
    result = users_collection.update_one(
        {"email": data['email']},
        {"$pull": {"refresh_tokens": data['refresh_token']}}
    )
    
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)