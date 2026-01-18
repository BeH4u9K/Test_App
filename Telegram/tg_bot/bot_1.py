import uvicorn
import logging
import uuid
import aiohttp
from fastapi import FastAPI, Request
from config import config
from redis_client import redis_client

app = FastAPI()

async def start_auth_service(login_token: str, auth_type: str):
    """Запуск новой авторизации через C++ сервер"""
    try:
        async with aiohttp.ClientSession() as session:
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
                    return await resp.json()
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
    if text.startswith("/login"):
        parts = text.split()
        
        if len(parts) == 1:
            login_token = user_data.get("login_token")
            if not login_token:
                redis_client.delete_user(chat_id)
                return {"response": "Вы не авторизованы. Выберите:\n/login github\n/login yandex\n/login code"}
            
            result = await check_auth_status(login_token)
            
            if not result:
                return {"response": "Ошибка подключения к серверу авторизации"}
            
            status = result.get("status")
            
            if status == "pending":
                expires_in = result.get("expires_in", 0)
                auth_url = result.get("auth_url", "")
                
                if auth_url:
                    return {"response": f"Авторизация в процессе. Перейдите по ссылке:\n{auth_url}"}
                else:
                    return {"response": f"Авторизация в процессе. Ожидайте... (осталось {expires_in} секунд)"}
            
            elif status == "granted":
                access_token = result.get("access_token", "")
                refresh_token = result.get("refresh_token", "")
                user_id = result.get("user_id", "")
                
                redis_client.set_authorized_user(chat_id, access_token, refresh_token, user_id)
                return {"response": f"Добро пожаловать, {user_id}! Вы успешно авторизованы."}
            
            elif status in ["denied", "expired", "not_found"]:
                redis_client.delete_user(chat_id)
                return {"response": "Авторизация отклонена или сессия истекла. Используйте /login для повторной авторизации."}
            
            else:
                return {"response": f"Статус авторизации: {status}"}
        
        else:
            auth_type = parts[1]
            
            if auth_type not in ["github", "yandex", "code"]:
                return {"response": "Неподдерживаемый тип авторизации. Доступно: github, yandex, code"}
            
            login_token = str(uuid.uuid4())
            redis_client.update_login_token(chat_id, login_token)
            
            auth_result = await start_auth_service(login_token, auth_type)
            
            if not auth_result:
                return {"response": f"Ошибка запуска авторизации {auth_type}. Попробуйте позже."}
            
            if "error" in auth_result:
                return {"response": f"Ошибка: {auth_result['error']}"}
            
            if auth_result.get("auth_type") == "code":
                code = auth_result.get("code", "")
                message = auth_result.get("message", "")
                return {"response": f"Код для авторизации: {code}\n{message}"}
            else:
                auth_url = auth_result.get("auth_url", "")
                if auth_url:
                    return {"response": f"Для авторизации через {auth_type} перейдите по ссылке:\n{auth_url}"}
                else:
                    return {"response": f"Авторизация {auth_type} начата. Используйте /login для проверки статуса."}
    
    elif text.startswith("/"):
        return {"response": "Нет такой команды"}
    
    else:
        return {"response": "Вы не авторизованы. Используйте /login для авторизации"}

# Обработка авторизованного пользователя
async def handle_authorized_user(chat_id: int, text: str, user_data: dict):
    if text.startswith("/login"):
        parts = text.split()
        
        if len(parts) == 1:
            user_id = user_data.get("user_id", "пользователь")
            return {"response": f"Вы уже авторизованы как {user_id}."}
        
        else:
            auth_type = parts[1]
            login_token = str(uuid.uuid4())
            
            redis_client.set_login_data(chat_id, login_token)
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
        parts = text.split()
        
        if len(parts) > 1 and parts[1] == "all=true":
            refresh_token = user_data.get("refresh_token", "")
            
            if refresh_token:
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.post(
                            f"{config.AUTH_SERVICE_URL}/logout",
                            json={"refresh_token": refresh_token},
                            timeout=10
                        ) as resp:
                            pass
                except Exception as e:
                    logging.error(f"Logout all error: {e}")
            
            redis_client.delete_user(chat_id)
            return {"response": "Сеанс завершён на всех устройствах"}
        else:
            redis_client.delete_user(chat_id)
            return {"response": "Вы вышли из системы"}
    
    elif text.startswith("/status"):
        access_token = user_data.get("access_token", "неизвестно")
        refresh_token = user_data.get("refresh_token", "неизвестно")
        user_id = user_data.get("user_id", "неизвестно")
        return {"response": f"User ID: {user_id}\nAccess token: {access_token[:20]}...\nRefresh token: {refresh_token[:20]}..."}
    
    elif text.startswith("/refresh"):
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
                        
                        redis_client.set_authorized_user(
                            chat_id, 
                            new_access, 
                            new_refresh,
                            user_data.get("user_id", "")
                        )
                        return {"response": "Токены успешно обновлены"}
                    else:
                        return {"response": "Ошибка обновления токенов"}
        except Exception as e:
            logging.error(f"Refresh error: {e}")
            return {"response": "Ошибка подключения"}
    
    elif text.startswith("/"):
        return {"response": "Нет такой команды"}
    
    else:
        return {"response": f"Получено сообщение: '{text}'"}

@app.post("/handle")
async def handle_message(request: Request):
    data = await request.json()
    chat_id = data.get("chat_id")
    text = data.get("text", "").strip()
    
    logging.info(f"Worker 8001: chat_id={chat_id}, text='{text}'")
    
    user_data = redis_client.get_user_data(chat_id)
    
    if not user_data:
        if text.startswith("/login"):
            parts = text.split()
            
            if len(parts) == 1:
                return {"response": "Добро пожаловать! Вы не авторизованы.\nВыберите тип авторизации:\n/login github\n/login yandex\n/login code"}
            else:
                auth_type = parts[1]
                
                if auth_type not in ["github", "yandex", "code"]:
                    return {"response": "Неподдерживаемый тип авторизации. Доступно: github, yandex, code"}
                
                login_token = str(uuid.uuid4())
                redis_client.set_login_data(chat_id, login_token)
                
                auth_result = await start_auth_service(login_token, auth_type)
                
                if not auth_result:
                    return {"response": f"Ошибка запуска авторизации {auth_type}"}
                
                if "error" in auth_result:
                    return {"response": f"Ошибка: {auth_result['error']}"}
                
                if auth_result.get("auth_type") == "code":
                    code = auth_result.get("code", "")
                    message = auth_result.get("message", "")
                    return {"response": f"Код для авторизации: {code}\n{message}"}
                else:
                    auth_url = auth_result.get("auth_url", "")
                    if auth_url:
                        return {"response": f"Для авторизации через {auth_type} перейдите по ссылке:\n{auth_url}"}
                    else:
                        return {"response": f"Авторизация {auth_type} начата."}
        
        elif text.startswith("/"):
            return {"response": "Нет такой команды"}
        
        else:
            return {"response": "Добро пожаловать! Для начала работы используйте /login"}
    
    else:
        status = user_data.get("status")
        
        if status == "anonim":
            return await handle_anonymous_user(chat_id, text, user_data)
        
        elif status == "authorized":
            return await handle_authorized_user(chat_id, text, user_data)
        
        else:
            return {"response": f"Неизвестный статус: {status}"}

# ЦИКЛИЧЕСКИЕ ЗАПРОСЫ

async def check_user_auth_status(chat_id: int, user_data: dict):
    """Проверка статуса одного анонимного пользователя"""
    login_token = user_data.get("login_token", "")
    
    if not login_token:
        return {"chat_id": chat_id, "status": "error", "message": "Токен входа не найден"}
    
    result = await check_auth_status(login_token)
    
    if not result:
        return {"chat_id": chat_id, "status": "error", "message": "Ошибка подключения"}
    
    status = result.get("status")
    
    if status in ["not_found", "expired"]:
        redis_client.delete_user(chat_id)
        return {"chat_id": chat_id, "status": "failed", "message": "Сессия истекла или токен не найден"}
    
    elif status == "denied":
        redis_client.delete_user(chat_id)
        return {"chat_id": chat_id, "status": "failed", "message": "Авторизация отклонена"}
    
    elif status == "granted":
        access_token = result.get("access_token", "")
        refresh_token = result.get("refresh_token", "")
        user_id = result.get("user_id", "")
        
        if access_token and refresh_token:
            redis_client.set_authorized_user(chat_id, access_token, refresh_token, user_id)
            return {"chat_id": chat_id, "status": "success", "message": f"Добро пожаловать, {user_id}! Вы успешно авторизованы."}
        else:
            return {"chat_id": chat_id, "status": "error", "message": "Токены не получены"}
    
    elif status == "pending":
        expires_in = result.get("expires_in", 0)
        return {"chat_id": chat_id, "status": "pending", "message": f"Авторизация в процессе (осталось {expires_in} секунд)"}
    
    else:
        return {"chat_id": chat_id, "status": "unknown", "message": f"Статус авторизации: {status}"}

@app.get("/check_auth_status_all")
async def handle_check_auth_status_all():
    """Проверка статуса всех анонимных пользователей"""
    logging.info("Проверка статуса всех анонимных пользователей")
    
    anonymous_users = redis_client.get_all_anonymous_users()
    results = []
    
    for user in anonymous_users:
        chat_id = user["chat_id"]
        user_data = user["data"]
        
        result = await check_user_auth_status(chat_id, user_data)
        results.append(result)
    
    logging.info(f"Проверено {len(results)} анонимных пользователей")
    return {"status": "ok", "results": results}

async def check_user_notifications(chat_id: int, user_data: dict):
    """Проверка уведомлений одного авторизованного пользователя"""
    access_token = user_data.get("access_token", "")
    
    if not access_token:
        return {"chat_id": chat_id, "notifications": [], "message": "Токен доступа не найден"}
    
    try:
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Получаем уведомления
            async with session.get(
                f"{config.MAIN_MODULE_URL}/notification",
                headers=headers,
                timeout=10
            ) as resp:
                
                if resp.status == 200:
                    notifications_data = await resp.json()
                    notifications = notifications_data.get("notifications", [])
                    
                    # Удаляем уведомления после получения
                    if notifications:
                        async with session.delete(
                            f"{config.MAIN_MODULE_URL}/notification",
                            headers=headers,
                            timeout=10
                        ) as delete_resp:
                            if delete_resp.status != 200:
                                logging.warning(f"Не удалось удалить уведомлений для chat_id {chat_id}")
                    
                    if notifications:
                        return {
                            "chat_id": chat_id,
                            "notifications": notifications,
                            "message": f"У вас {len(notifications)} новых уведомлений"
                        }
                    else:
                        return {"chat_id": chat_id, "notifications": [], "message": "Нет новых уведомлений"}
                
                elif resp.status == 401:
                    return {"chat_id": chat_id, "notifications": [], "message": "Токен устарел"}
                elif resp.status == 403:
                    return {"chat_id": chat_id, "notifications": [], "message": "Нет доступа"}
                else:
                    return {"chat_id": chat_id, "notifications": [], "message": f"Ошибка сервера: {resp.status}"}
    
    except Exception as e:
        logging.error(f"Ошибка проверки уведомлений для chat_id {chat_id}: {e}")
        return {"chat_id": chat_id, "notifications": [], "message": "Ошибка подключения"}

@app.get("/check_notifications_all")
async def handle_check_notifications_all():
    """Проверка уведомлений всех авторизованных пользователей"""
    logging.info("Проверка уведомлений всех авторизованных пользователей")
    
    authorized_users = redis_client.get_all_authorized_users()
    results = []
    
    for user in authorized_users:
        chat_id = user["chat_id"]
        user_data = user["data"]
        
        result = await check_user_notifications(chat_id, user_data)
        if result["notifications"]:
            results.append(result)
    
    logging.info(f"Проверено {len(authorized_users)} авторизованных пользователей, найдено уведомлений у {len(results)}")
    return {"status": "ok", "results": results}

@app.get("/health")
def health_check():
    return {"status": "ok", "port": 8001}

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    uvicorn.run(app, host="0.0.0.0", port=8001)