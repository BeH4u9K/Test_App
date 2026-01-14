import redis
import json
from config import config

class RedisClient:
    def __init__(self):
        self.client = redis.Redis(
            host=config.REDIS_HOST,
            port=config.REDIS_PORT,
            db=config.REDIS_DB,
            decode_responses=True
        )
    
    def get_user_data(self, chat_id: int) -> dict:
        key = f"user:{chat_id}"
        data = self.client.get(key)
        return json.loads(data) if data else None
    
    def set_login_data(self, chat_id: int, login_token: str):
        data = {
            "status": "anonim",
            "login_token": login_token
        }
        key = f"user:{chat_id}"
        self.client.setex(key, 3600, json.dumps(data))
    
    def update_login_token(self, chat_id: int, new_login_token: str):
        key = f"user:{chat_id}"
        data = self.client.get(key)
        if data:
            user_data = json.loads(data)
            if user_data.get("status") == "anonim":
                user_data["login_token"] = new_login_token
                self.client.setex(key, 3600, json.dumps(user_data))
                return True
        return False

    def set_authorized_user(self, chat_id: int, access_token: str, refresh_token: str):
        data = {
            "status": "authorized",
            "access_token": access_token,
            "refresh_token": refresh_token
        }
        key = f"user:{chat_id}"
        self.client.setex(key, 86400, json.dumps(data))
    
    def delete_user(self, chat_id: int):
        key = f"user:{chat_id}"
        self.client.delete(key)

    def ping(self) -> bool:
        try:
            return self.client.ping()
        except:
            return False

redis_client = RedisClient()