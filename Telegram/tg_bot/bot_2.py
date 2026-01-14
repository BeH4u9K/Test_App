import uvicorn
import logging
import uuid
import aiohttp
from fastapi import FastAPI, Request
from config import config
from redis_client import redis_client

app = FastAPI()

async def call_auth_service(chat_id: int, login_token: str, auth_type: str = None):  # ИЗМЕНЕНО: добавлен параметр по умолчанию
    """Вызов C++ Auth сервиса"""
    try:
        async with aiohttp.ClientSession() as session:
            params = {}
            
            if auth_type:
                # новая авторизация
                params = {
                    "type": auth_type,
                    "state": login_token,
                    "chat_id": str(chat_id)
                }
            else:
                # проверка существующего токена
                params = {
                    "action": "verify",  # НОВОЕ параметр action
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
        return None  # ИЗМЕНЕНО возвращаем None вместо dict

# обработка анонимного пользователя
async def handle_anonymous_user(chat_id: int, text: str, user_data: dict):
    """Обработка анонимного пользователя"""
    if text.startswith("/login"):
        parts = text.split()
        
        if len(parts) == 1:
            # /login без параметров - проверяем текущий токен
            login_token = user_data.get("login_token")
            if not login_token:
                redis_client.delete_user(chat_id)
                return {
                    "response": "Вы не авторизованы. Выберите:\n/login github\n/login yandex\n/login code"
                }
            
            # Проверяем токен в модуле авторизации
            auth_result = await call_auth_service(chat_id, login_token)
            
            if not auth_result:
                # Ошибка связи с auth service
                return {"response": "Ошибка сервера авторизации"}
            
            auth_status = auth_result.get("status")
            auth_message = auth_result.get("message", "")
            
            if auth_status == "token_not_found" or auth_status == "token_expired":
                # Токен не найден или просрочен
                redis_client.delete_user(chat_id)
                return {
                    "response": "Сессия истекла. Вы не авторизованы.\nВыберите:\n/login github\n/login yandex\n/login code"
                }
            
            elif auth_status == "access_denied":
                # Пользователь отказал в доступе
                redis_client.delete_user(chat_id)
                return {"response": "Авторизация отменена"}
            
            elif auth_status == "access_granted":
                # Доступ предоставлен - получаем JWT токены
                access_token = auth_result.get("access_token")
                refresh_token = auth_result.get("refresh_token")
                
                if not access_token or not refresh_token:
                    redis_client.delete_user(chat_id)
                    return {"response": "Ошибка авторизации: отсутствуют токены"}
                
                # Сохраняем авторизованного пользователя
                redis_client.set_authorized_user(chat_id, access_token, refresh_token)
                
                # Продолжаем как авторизованный пользователь
                user_name = auth_result.get("user_name", "Пользователь")
                return {"response": f"Добро пожаловать, {user_name}! Вы успешно авторизованы."}
            
            else:
                # Неизвестный статус
                return {"response": f"Статус авторизации: {auth_status}\n{auth_message}"}
        
        else:
            # /login с параметром type - новая авторизация
            auth_type = parts[1]
            login_token = str(uuid.uuid4())
            
            # Обновляем токен входа
            success = redis_client.update_login_token(chat_id, login_token)
            if not success:
                # Если не удалось обновить, создаем новую запись
                redis_client.set_login_data(chat_id, login_token)
            
            # Вызываем Auth сервис
            auth_result = await call_auth_service(chat_id, login_token, auth_type)
            
            if auth_result:
                return {"response": f"Авторизация {auth_type} начата\n{auth_result.get('message', '')}"}
            else:
                return {"response": f"Авторизация {auth_type} начата\n(Сервер авторизации не отвечает)"}
    
    elif text.startswith("/"):
        return {"response": "Нет такой команды"}
    
    else:
        # Любое другое сообщение от анонимного пользователя
        return {"response": "Вы не авторизованы. Используйте /login для авторизации"}

# НОВАЯ ФУНКЦИЯ: обработка авторизованного пользователя
async def handle_authorized_user(chat_id: int, text: str, user_data: dict):
    """Обработка авторизованного пользователя"""
    if text.startswith("/login"):
        parts = text.split()
        
        if len(parts) == 1:
            # /login без параметров - показываем статус
            return {"response": f"Вы уже авторизованы\n статус: {user_data.get('status')}"}
        
        else:
            # /login с параметром - повторная авторизация
            auth_type = parts[1]
            login_token = str(uuid.uuid4())
            
            # Сохраняем как анонимного (переавторизация)
            redis_client.set_login_data(chat_id, login_token)
            
            # Вызываем Auth сервис
            auth_result = await call_auth_service(chat_id, login_token, auth_type)
            
            if auth_result:
                return {"response": f"Переавторизация {auth_type} начата\n{auth_result.get('message', '')}"}
            else:
                return {"response": f"Переавторизация {auth_type} начата\n(Сервер авторизации не отвечает)"}
    
    elif text.startswith("/logout"):  # НОВАЯ КОМАНДА
        # Выход из системы
        redis_client.delete_user(chat_id)
        return {"response": "Вы вышли из системы"}
    
    elif text.startswith("/status"):  # НОВАЯ КОМАНДА
        # Показать статус
        authorized_at = user_data.get("authorized_at", "неизвестно")
        return {"response": f"Статус: авторизован\nДата авторизации: {authorized_at}"}
    
    elif text.startswith("/"):
        return {"response": "Нет такой команды"}
    
    else:
        # Любое другое сообщение от авторизованного пользователя
        return {"response": f"Получено: '{text}'\nВы авторизованы"}

@app.post("/handle")
async def handle_message(request: Request):
    """Обработка сообщений согласно сценарию"""
    data = await request.json()
    chat_id = data.get("chat_id")
    text = data.get("text", "").strip()
    
    logging.info(f"Worker 8001: chat_id={chat_id}, text='{text}'")
    
    # Проверяем Redis
    user_data = redis_client.get_user_data(chat_id)
    
    if not user_data:
        # Неизвестный пользователь (старый код с небольшими изменениями)
        if text.startswith("/login"):
            parts = text.split()
            
            if len(parts) == 1:
                return {
                    "response": "Вы не авторизованы. Выберите:\n/login github\n/login yandex\n/login code"
                }
            else:
                auth_type = parts[1]
                login_token = str(uuid.uuid4())
                
                # Сохраняем в Redis
                redis_client.set_login_data(chat_id, login_token)
                
                # Вызываем Auth сервис
                auth_result = await call_auth_service(chat_id, login_token, auth_type)
                
                if auth_result:
                    return {"response": f"Авторизация {auth_type} начата\n{auth_result.get('message', '')}"}
                else:
                    return {"response": f"Авторизация {auth_type} начата\n(Сервер авторизации не отвечает)"}
        
        elif text.startswith("/"):
            return {"response": "Нет такой команды"}
        
        else:
            return {"response": "Добро пожаловать! Используйте /login для авторизации"}
    
    else:
        # Пользователь существует
        status = user_data.get("status")
        
        if status == "anonim":
            # Анонимный пользователь
            return await handle_anonymous_user(chat_id, text, user_data)
        
        elif status == "authorized":
            # Авторизованный пользователь
            return await handle_authorized_user(chat_id, text, user_data)
        
        else:
            # Неизвестный статус
            return {"response": f"Неизвестный статус: {status}"}

@app.get("/health")
def health_check():
    return {"status": "ok", "port": 8002}

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    uvicorn.run(app, host="0.0.0.0", port=8002)