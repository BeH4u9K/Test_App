import uvicorn
import logging
import uuid
import aiohttp
import asyncio
from fastapi import FastAPI, Request
from config import config
from redis_client import redis_client

app = FastAPI()

async def start_auth_service(login_token: str, auth_type: str):
    """Запуск новой авторизации через C++ сервер"""
    try:
        async with aiohttp.ClientSession() as session:
            # Вызываем /auth эндпоинт C++ сервера
            params = {
                "provider": auth_type,
                "login_token": login_token
            }
            
            async with session.get(
                f"{config.AUTH_SERVICE_URL}/auth",
                params=params,
                timeout=10
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    return result
                else:
                    logging.error(f"Auth service error: {resp.status}")
                    return None
    except Exception as e:
        logging.error(f"Auth service connection error: {e}")
        return None

async def check_auth_status(login_token: str):
    """Проверка статуса авторизации через C++ сервер"""
    try:
        async with aiohttp.ClientSession() as session:
            params = {
                "login_token": login_token
            }
            
            async with session.get(
                f"{config.AUTH_SERVICE_URL}/check",
                params=params,
                timeout=10
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                else:
                    logging.error(f"Check auth error: {resp.status}")
                    return None
    except Exception as e:
        logging.error(f"Check auth connection error: {e}")
        return None


# Обработка анонимного пользователя
async def handle_anonymous_user(chat_id: int, text: str, user_data: dict):
    """Обработка анонимного пользователя"""
    if text.startswith("/login"):
        parts = text.split()
        
        if len(parts) == 1:
            # /login без параметров - проверяем текущий статус
            login_token = user_data.get("login_token")
            if not login_token:
                redis_client.delete_user(chat_id)
                return {
                    "response": "Вы не авторизованы. Выберите:\n/login github\n/login yandex\n/login code"
                }
            
            # Проверяем текущий статус
            result = await check_auth_status(login_token)
            
            if not result:
                return {"response": "Ошибка подключения к серверу авторизации"}
            
            status = result.get("status")
            
            if status == "pending":
                # Авторизация в процессе
                expires_in = result.get("expires_in", 0)
                auth_url = result.get("auth_url", "")
                
                if auth_url:
                    return {
                        "response": f"Авторизация в процессе. Перейдите по ссылке:\n{auth_url}\n\nИли подождите, проверка через {expires_in} секунд."
                    }
                else:
                    return {
                        "response": f"Авторизация в процессе. Ожидайте... (осталось {expires_in} секунд)"
                    }
            
            elif status == "granted":
                # Авторизация успешна
                access_token = result.get("access_token", "")
                refresh_token = result.get("refresh_token", "")
                user_id = result.get("user_id", "")
                
                # Сохраняем авторизованного пользователя
                redis_client.set_authorized_user(chat_id, access_token, refresh_token)
                
                return {
                    "response": f"Добро пожаловать, {user_id}! Вы успешно авторизованы."
                }
            
            elif status in ["denied", "expired", "not_found"]:
                # Авторизация отклонена
                redis_client.delete_user(chat_id)
                return {
                    "response": "Авторизация отклонена или сессия истекла. Используйте /login для повторной авторизации."
                }
            
            else:
                # Неизвестный статус
                return {"response": f"Статус авторизации: {status}"}
        
        else:
            # /login с параметром - новая авторизация
            auth_type = parts[1]
            
            if auth_type not in ["github", "yandex", "code"]:
                return {"response": "Неподдерживаемый тип авторизации. Доступно: github, yandex, code"}
            
            # Генерируем новый login_token
            login_token = str(uuid.uuid4())
            
            # Сохраняем в Redis
            redis_client.update_login_token(chat_id, login_token)
            
            # Запускаем авторизацию
            auth_result = await start_auth_service(login_token, auth_type)
            
            if not auth_result:
                return {"response": f"Ошибка запуска авторизации {auth_type}. Попробуйте позже."}
            
            if "error" in auth_result:
                return {"response": f"Ошибка: {auth_result['error']}"}
            
            # Проверяем тип ответа
            if auth_result.get("auth_type") == "code":
                # Авторизация по коду
                code = auth_result.get("code", "")
                message = auth_result.get("message", "")
                return {
                    "response": f"Код для авторизации: {code}\n{message}"
                }
            else:
                # OAuth авторизация
                auth_url = auth_result.get("auth_url", "")
                oauth_state = auth_result.get("oauth_state", "")
                
                if auth_url:
                    return {
                        "response": f"Для авторизации через {auth_type} перейдите по ссылке:\n{auth_url}\n\nПосле авторизации используйте /login для проверки статуса."
                    }
                else:
                    return {
                        "response": f"Авторизация {auth_type} начата. Используйте /login для проверки статуса."
                    }
    
    elif text.startswith("/"):
        return {"response": "Нет такой команды"}
    
    else:
        # Любое другое сообщение от анонимного пользователя
        return {"response": "Вы не авторизованы. Используйте /login для авторизации"}

# Обработка авторизованного пользователя
async def handle_authorized_user(chat_id: int, text: str, user_data: dict):
    """Обработка авторизованного пользователя"""
    if text.startswith("/login"):
        parts = text.split()
        
        if len(parts) == 1:
            # /login без параметров - показываем статус
            return {"response": f"Вы уже авторизованы.\nСтатус: {user_data.get('status', 'authorized')}"}
        
        else:
            # /login с параметром - повторная авторизация
            auth_type = parts[1]
            login_token = str(uuid.uuid4())
            
            # Сохраняем как анонимного (переавторизация)
            redis_client.set_login_data(chat_id, login_token)
            
            # Запускаем новую авторизацию
            auth_result = await start_auth_service(login_token, auth_type)
            
            if not auth_result:
                return {"response": f"Ошибка запуска авторизации {auth_type}"}
            
            if "auth_url" in auth_result:
                return {"response": f"Переавторизация начата. Перейдите по ссылке:\n{auth_result['auth_url']}"}
            elif "code" in auth_result:
                return {"response": f"Код для авторизации: {auth_result['code']}"}
            else:
                return {"response": f"Переавторизация {auth_type} начата."}
    
    elif text.startswith("/logout"):
        # Выход из системы
        redis_client.delete_user(chat_id)
        return {"response": "Вы вышли из системы"}
    
    elif text.startswith("/status"):
        # Показать статус
        access_token = user_data.get("access_token", "неизвестно")
        status = user_data.get("status", "authorized")
        return {"response": f"Статус: {status}\nAccess token: {access_token[:20]}..."}
    
    elif text.startswith("/refresh"):
        # Обновление токена
        refresh_token = user_data.get("refresh_token", "")
        
        if not refresh_token:
            return {"response": "Refresh token не найден"}
        
        try:
            async with aiohttp.ClientSession() as session:
                data = {"refresh_token": refresh_token}
                
                async with session.post(
                    f"{config.AUTH_SERVICE_URL}/refresh",
                    json=data,
                    timeout=10
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        new_access = result.get("access_token", "")
                        new_refresh = result.get("refresh_token", "")
                        
                        # Обновляем токены
                        redis_client.set_authorized_user(chat_id, new_access, new_refresh)
                        
                        return {"response": "Токены успешно обновлены"}
                    else:
                        return {"response": "Ошибка обновления токенов"}
        except Exception as e:
            logging.error(f"Refresh error: {e}")
            return {"response": "Ошибка подключения"}
    
    elif text.startswith("/"):
        return {"response": "Нет такой команды"}
    
    else:
        # Любое другое сообщение от авторизованного пользователя
        return {"response": f"Получено сообщение: '{text}'\nВы авторизованы."}

@app.post("/handle")
async def handle_message(request: Request):
    """Обработка сообщений согласно сценарию"""
    data = await request.json()
    chat_id = data.get("chat_id")
    text = data.get("text", "").strip()
    
    logging.info(f"Worker 8003: chat_id={chat_id}, text='{text}'")
    
    # Проверяем Redis
    user_data = redis_client.get_user_data(chat_id)
    
    if not user_data:
        # Неизвестный пользователь
        if text.startswith("/login"):
            parts = text.split()
            
            if len(parts) == 1:
                return {
                    "response": "Добро пожаловать! Вы не авторизованы.\nВыберите тип авторизации:\n/login github\n/login yandex\n/login code"
                }
            else:
                auth_type = parts[1]
                
                if auth_type not in ["github", "yandex", "code"]:
                    return {"response": "Неподдерживаемый тип авторизации. Доступно: github, yandex, code"}
                
                # Генерируем login_token
                login_token = str(uuid.uuid4())
                
                # Сохраняем в Redis
                redis_client.set_login_data(chat_id, login_token)
                
                # Запускаем авторизацию
                auth_result = await start_auth_service(login_token, auth_type)
                
                if not auth_result:
                    return {"response": f"Ошибка запуска авторизации {auth_type}"}
                
                if "error" in auth_result:
                    return {"response": f"Ошибка: {auth_result['error']}"}
                
                # Формируем ответ
                if auth_result.get("auth_type") == "code":
                    code = auth_result.get("code", "")
                    message = auth_result.get("message", "")
                    return {
                        "response": f"Код для авторизации: {code}\n{message}"
                    }
                else:
                    auth_url = auth_result.get("auth_url", "")
                    if auth_url:
                        return {
                            "response": f"Для авторизации через {auth_type} перейдите по ссылке:\n{auth_url}\n\nПосле авторизации используйте /login для проверки статуса."
                        }
                    else:
                        return {
                            "response": f"Авторизация {auth_type} начата. Используйте /login для проверки статуса."
                        }
        
        elif text.startswith("/"):
            return {"response": "Нет такой команды"}
        
        else:
            return {"response": "Добро пожаловать! Для начала работы используйте /login"}
    
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
    return {"status": "ok", "port": 8003}

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    uvicorn.run(app, host="0.0.0.0", port=8003)