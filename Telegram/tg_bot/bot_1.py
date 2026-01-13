import uvicorn
import logging
import uuid
import aiohttp
from fastapi import FastAPI, Request
from config import config
from redis_client import redis_client

app = FastAPI()

async def call_auth_service(chat_id: int, login_token: str, auth_type: str):
    """Вызов C++ Auth сервиса"""
    try:
        async with aiohttp.ClientSession() as session:
            params = {
                "type": auth_type,
                "state": login_token,
                "chat_id": str(chat_id)
            }
            async with session.get(
                f"{config.AUTH_SERVICE_URL}/auth",
                params=params,
                timeout=10
            ) as resp:
                return await resp.json()
    except Exception as e:
        logging.error(f"Auth service error: {e}")
        return {"message": "Auth service недоступен"}

@app.post("/handle")
async def handle_message(request: Request):
    """Обработка сообщений согласно сценарию"""
    data = await request.json()
    chat_id = data.get("chat_id")
    text = data.get("text", "").strip()
    
    logging.info(f"Worker 8001: chat_id={chat_id}, text='{text}'")
    
    # Проверяем Redis
    user_data = redis_client.get_user_data(chat_id)
    
    if text.startswith("/login"):
        parts = text.split()
        
        if len(parts) == 1:
            # /login без параметров
            if not user_data:
                return {
                    "response": "Вы не авторизованы. Выберите:\n/login github\n/login yandex\n/login code"
                }
            else:
                return {"response": f"Вы авторизованы. Статус: {user_data.get('status')}"}
        
        else:
            # /login с параметром
            auth_type = parts[1]
            login_token = str(uuid.uuid4())
            
            # Сохраняем в Redis
            redis_client.set_login_data(chat_id, login_token)
            
            # Вызываем Auth сервис
            auth_result = await call_auth_service(chat_id, login_token, auth_type)
            
            return {"response": f"Авторизация {auth_type} начата\n{auth_result.get('message', '')}"}
    
    elif text.startswith("/"):
        return {"response": "Нет такой команды"}
    
    elif not user_data:
        return {"response": "Добро пожаловать! Используйте /login для авторизации"}
    
    else:
        return {"response": f"Получено: '{text}'\nСтатус: {user_data.get('status')}"}

@app.get("/health")
def health_check():
    return {"status": "ok", "port": 8001}

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    uvicorn.run(app, host="0.0.0.0", port=8001)