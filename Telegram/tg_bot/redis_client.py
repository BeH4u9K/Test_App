import redis
import json
import time
from typing import Optional, Dict, Any
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
            "login_token": login_token,
            "created_at": time.time()
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
                user_data["created_at"] = time.time()
                self.client.setex(key, 3600, json.dumps(user_data))
                return True
        return False

    def set_authorized_user(self, chat_id: int, access_token: str, refresh_token: str, user_id: str = None):
        data = {
            "status": "authorized",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "authorized_at": time.time()
        }
        
        if user_id:
            data["user_id"] = user_id
            
        key = f"user:{chat_id}"
        self.client.setex(key, 86400, json.dumps(data))
    
    def delete_user(self, chat_id: int):
        key = f"user:{chat_id}"
        self.client.delete(key)

    def get_all_anonim_users(self):
        """Получить всех анонимных пользователей (исправленное название)"""
        users = {}
        try:
            for key in self.client.scan_iter(match="user:*"):
                data = self.client.get(key)
                if data:
                    user_data = json.loads(data)
                    if user_data.get("status") == "anonim":
                        chat_id = int(key.split(":")[1])
                        users[chat_id] = user_data
        except Exception as e:
            print(f"Error getting anonymous users: {e}")
        return users
    
    def get_all_authorized_users(self):
        """Получить всех авторизованных пользователей"""
        users = {}
        try:
            for key in self.client.scan_iter(match="user:*"):
                data = self.client.get(key)
                if data:
                    user_data = json.loads(data)
                    if user_data.get("status") == "authorized":
                        chat_id = int(key.split(":")[1])
                        users[chat_id] = user_data
        except Exception as e:
            print(f"Error getting authorized users: {e}")
        return users

    def ping(self) -> bool:
        try:
            return self.client.ping()
        except:
            return False

    def set_active_attempt(self, chat_id: int, attempt_id: int, test_id: int, user_id: str, 
                          questions: list, current_question: int, answers: dict):
        """Сохранить активную попытку теста"""
        key = f"active_attempt:{chat_id}"
        data = {
            "attempt_id": attempt_id,
            "test_id": test_id,
            "user_id": user_id,
            "questions": questions,
            "current_question": current_question,
            "answers": answers
        }
        self.client.setex(key, 3600, json.dumps(data))  # Храним 1 час

    def get_active_attempt(self, chat_id: int) -> Optional[dict]:
        """Получить активную попытку теста"""
        key = f"active_attempt:{chat_id}"
        data = self.client.get(key)
        if data:
            return json.loads(data)
        return None

    def update_attempt_question(self, chat_id: int, current_question: int, answers: dict):
        """Обновить текущий вопрос и ответы в активной попытке"""
        key = f"active_attempt:{chat_id}"
        data = self.client.get(key)
        if data:
            attempt_data = json.loads(data)
            attempt_data["current_question"] = current_question
            attempt_data["answers"] = answers
            self.client.setex(key, 3600, json.dumps(attempt_data))

    def delete_active_attempt(self, chat_id: int):
        """Удалить активную попытку теста"""
        key = f"active_attempt:{chat_id}"
        self.client.delete(key)

redis_client = RedisClient()