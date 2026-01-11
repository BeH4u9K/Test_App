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
        """Получить данные пользователя"""
        key = f"user:{chat_id}"
        data = self.client.get(key)
        return json.loads(data) if data else None
    
    def set_login_data(self, chat_id: int, login_token: str):
        """Сохранить токен входа и статус анонимный"""
        data = {
            "status": "anonim",
            "login_token": login_token
        }
        key = f"user:{chat_id}"
        self.client.set(key, json.dumps(data))


redis_client = RedisClient()