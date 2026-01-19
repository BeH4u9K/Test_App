# bot_1.py
import uvicorn
import logging
import uuid
import aiohttp
import json
import re
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from fastapi import FastAPI, Request
from config import config
from redis_client import redis_client

app = FastAPI()

# ============= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =============

async def refresh_token(chat_id: int, refresh_token: str, user_id: str = None) -> tuple:
    """Обновление токенов"""
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
                    
                    if new_access and new_refresh:
                        redis_client.set_authorized_user(
                            chat_id, 
                            new_access, 
                            new_refresh,
                            user_id
                        )
                        return True, new_access, new_refresh
                return False, None, None
    except Exception as e:
        logging.error(f"Error refreshing token for chat {chat_id}: {e}")
        return False, None, None

async def call_api_with_retry(chat_id: int, access_token: str, refresh_token: str, 
                              user_id: str, endpoint: str, method: str = "GET", 
                              data: dict = None) -> dict:
    """Вызов API с автоматическим обновлением токенов"""
    headers = {"Authorization": f"Bearer {access_token}"}
    url = f"{config.MAIN_MODULE_URL}{endpoint}"
    
    async def make_request():
        try:
            async with aiohttp.ClientSession() as session:
                http_method = getattr(session, method.lower())
                kwargs = {"headers": headers, "timeout": 10}
                
                if data and method.upper() in ["POST", "PUT", "PATCH"]:
                    kwargs["json"] = data
                
                async with http_method(url, **kwargs) as resp:
                    if resp.status == 200:
                        return await resp.json(), None
                    elif resp.status == 201:
                        return await resp.json(), None
                    elif resp.status == 401:
                        return None, "unauthorized"
                    elif resp.status == 403:
                        return None, "forbidden"
                    elif resp.status == 404:
                        return None, "not_found"
                    else:
                        return None, f"http_error_{resp.status}"
        except Exception as e:
            logging.error(f"API call error: {e}")
            return None, "connection_error"
    
    # Первый вызов
    result, error = await make_request()
    
    if error == "unauthorized":
        success, new_access, new_refresh = await refresh_token(
            chat_id, refresh_token, user_id
        )
        if success:
            headers["Authorization"] = f"Bearer {new_access}"
            result, error = await make_request()
            if not error:
                return result
        else:
            redis_client.delete_user(chat_id)
            return {"error": "session_expired"}
    
    if error:
        return {"error": error}
    
    return result

async def start_auth_service(login_token: str, auth_type: str) -> Optional[Dict]:
    """Запуск авторизации"""
    try:
        async with aiohttp.ClientSession() as session:
            params = {"provider": auth_type, "login_token": login_token}
            
            async with session.get(
                f"{config.AUTH_SERVICE_URL}/auth",
                params=params,
                timeout=10
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                logging.error(f"Auth start failed: {resp.status}")
                return None
    except Exception as e:
        logging.error(f"Auth service error: {e}")
        return None

async def check_auth_status(login_token: str) -> Optional[Dict]:
    """Проверка статуса авторизации"""
    try:
        async with aiohttp.ClientSession() as session:
            params = {"login_token": login_token}
            
            async with session.get(
                f"{config.AUTH_SERVICE_URL}/check",
                params=params,
                timeout=10
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                logging.error(f"Auth check failed: {resp.status}")
                return None
    except Exception as e:
        logging.error(f"Auth check error: {e}")
        return None

# ============= ФУНКЦИИ ДЛЯ ПАРСИНГА КОМАНД =============

def parse_command(text: str) -> Tuple[str, List[Any]]:
    """Парсинг команды и аргументов"""
    text = text.strip()
    
    # Основные команды без аргументов
    if text in ["/help", "/start"]:
        return "help", []
    
    # === ОСНОВНЫЕ ===
    if text == "/disciplines":
        return "list_disciplines", []
    
    # === ДИСЦИПЛИНЫ ===
    match = re.match(r'^/discipline (\d+)$', text)
    if match:
        return "get_discipline", [int(match.group(1))]
    
    # === ТЕСТЫ ===
    match = re.match(r'^/tests (\d+)$', text)
    if match:
        return "list_tests", [int(match.group(1))]
    
    match = re.match(r'^/test (\d+) (\d+)$', text)
    if match:
        return "get_test", [int(match.group(1)), int(match.group(2))]
    
    match = re.match(r'^/activate_test (\d+) (\d+)$', text)
    if match:
        return "activate_test", [int(match.group(1)), int(match.group(2))]
    
    match = re.match(r'^/deactivate_test (\d+) (\d+)$', text)
    if match:
        return "deactivate_test", [int(match.group(1)), int(match.group(2))]
    
    # === ПОЛЬЗОВАТЕЛИ ===
    if text == "/users":
        return "list_users", []
    
    match = re.match(r'^/user (\d+)$', text)
    if match:
        return "get_user", [int(match.group(1))]
    
    match = re.match(r'^/register_user (.+)$', text)
    if match:
        return "register_user", [match.group(1)]  # email
    
    match = re.match(r'^/update_user_name (\d+) (.+)$', text)
    if match:
        return "update_user_name", [int(match.group(1)), match.group(2)]
    
    # === СТУДЕНТЫ ===
    match = re.match(r'^/students (\d+)$', text)
    if match:
        return "list_students", [int(match.group(1))]
    
    match = re.match(r'^/add_student (\d+) (\d+)$', text)
    if match:
        return "add_student", [int(match.group(1)), int(match.group(2))]
    
    match = re.match(r'^/remove_student (\d+) (\d+)$', text)
    if match:
        return "remove_student", [int(match.group(1)), int(match.group(2))]
    
    # === ВОПРОСЫ ===
    match = re.match(r'^/questions (\d+) (\d+)$', text)
    if match:
        return "list_questions", [int(match.group(1)), int(match.group(2))]
    
    # === ПОПЫТКИ ===
    if text == "/attempts":
        return "list_attempts", []
    
    match = re.match(r'^/start_attempt (\d+)$', text)
    if match:
        return "start_attempt", [int(match.group(1))]
    
    match = re.match(r'^/complete_attempt (\d+) (\d+) (.+)$', text)
    if match:
        return "complete_attempt", [
            int(match.group(1)),  # user_id
            int(match.group(2)),  # attempt_id
            match.group(3)        # answers JSON
        ]
    
    # === МОИ КОМАНДЫ ===
    if text == "/my_profile":
        return "my_profile", []
    
    if text == "/my_disciplines":
        return "my_disciplines", []
    
    if text == "/my_attempts":
        return "my_attempts", []
    
    # === РЕЗУЛЬТАТЫ ===
    match = re.match(r'^/results (\d+) (\d+)$', text)
    if match:
        return "get_results", [int(match.group(1)), int(match.group(2))]
    
    # === АВТОРИЗАЦИЯ ===
    if text.startswith("/login"):
        parts = text.split()
        if len(parts) == 1:
            return "login_status", []
        elif len(parts) == 2:
            return "login", [parts[1]]
    
    if text.startswith("/logout"):
        parts = text.split()
        if len(parts) == 1:
            return "logout", []
        elif len(parts) == 2 and parts[1] == "all=true":
            return "logout_all", []
    
    # Обработка JSON ответов для команд, требующих дополнительных данных
    if (text.startswith("[") and text.endswith("]")) or (text.startswith("{") and text.endswith("}")):
        return "json_input", [text]
    
    return "unknown", []

# ============= ОБРАБОТЧИКИ КОМАНД =============

async def handle_authorized_user(chat_id: int, text: str, user_data: dict):
    """Обработка команд для авторизованного пользователя"""
    
    # Авторизационные команды
    if text.startswith("/login"):
        parts = text.split()
        if len(parts) == 1:
            return {"response": "Вы уже авторизованы."}
        else:
            return {"response": "Вы уже авторизованы. Используйте /logout для выхода."}
    
    if text.startswith("/logout"):
        parts = text.split()
        if len(parts) > 1 and parts[1] == "all=true":
            refresh_token = user_data.get("refresh_token", "")
            if refresh_token:
                try:
                    async with aiohttp.ClientSession() as session:
                        await session.post(
                            f"{config.AUTH_SERVICE_URL}/logout",
                            json={"refresh_token": refresh_token},
                            timeout=10
                        )
                except Exception as e:
                    logging.error(f"Logout all error: {e}")
            
            redis_client.delete_user(chat_id)
            return {"response": "Сеанс завершён на всех устройствах"}
        else:
            redis_client.delete_user(chat_id)
            return {"response": "Вы вышли из системы"}
    
    # Парсим команду
    command, args = parse_command(text)
    
    access_token = user_data.get("access_token", "")
    refresh_token = user_data.get("refresh_token", "")
    user_id_str = user_data.get("user_id", "")
    
    try:
        user_id_int = int(user_id_str)
    except (ValueError, TypeError):
        user_id_int = 0
    
    # === ОБРАБОТКА КОМАНД ===
    
    if command == "help":
        return await handle_help()
    
    elif command == "list_disciplines":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            "/api/v1/disciplines", "GET"
        )
        return await format_response(result, "Список дисциплин")
    
    elif command == "get_discipline":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}", "GET"
        )
        return await format_response(result, f"Дисциплина ID:{args[0]}")
    
    elif command == "list_tests":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/tests", "GET"
        )
        return await format_response(result, f"Тесты дисциплины ID:{args[0]}")
    
    elif command == "get_test":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/tests/{args[1]}", "GET"
        )
        return await format_response(result, f"Тест ID:{args[1]}")
    
    elif command == "activate_test":
        data = {"is_active": True}
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/tests/{args[1]}/state", "PUT", data
        )
        return await format_response(result, f"Тест ID:{args[1]} активирован")
    
    elif command == "deactivate_test":
        data = {"is_active": False}
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/tests/{args[1]}/state", "PUT", data
        )
        return await format_response(result, f"Тест ID:{args[1]} деактивирован")
    
    elif command == "list_users":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            "/api/v1/users", "GET"
        )
        return await format_response(result, "Список пользователей")
    
    elif command == "get_user":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/users/{args[0]}", "GET"
        )
        return await format_response(result, f"Пользователь ID:{args[0]}")
    
    elif command == "register_user":
        data = {"email": args[0]}
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            "/api/v1/users", "POST", data
        )
        return await format_response(result, "Регистрация пользователя")
    
    elif command == "update_user_name":
        data = {"name": args[1]}
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/users/{args[0]}/name", "PUT", data
        )
        return await format_response(result, f"Обновление имени пользователя ID:{args[0]}")
    
    elif command == "list_students":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/students", "GET"
        )
        return await format_response(result, f"Студенты дисциплины ID:{args[0]}")
    
    elif command == "add_student":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/students/{args[1]}", "POST"
        )
        return await format_response(result, f"Студент ID:{args[1]} добавлен")
    
    elif command == "remove_student":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/students/{args[1]}", "DELETE"
        )
        return await format_response(result, f"Студент ID:{args[1]} удален")
    
    elif command == "list_questions":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/tests/{args[1]}/questions", "GET"
        )
        return await format_response(result, f"Вопросы теста ID:{args[1]}")
    
    elif command == "list_attempts":
        # Проверка существования маршрута
        return {"response": "Команда не реализована. Используйте /my_attempts для ваших попыток"}
    
    elif command == "start_attempt":
        data = {"test_id": args[0]}
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/users/{user_id_int}/attempts", "POST", data
        )
        return await format_response(result, f"Начата попытка теста ID:{args[0]}")
    
    elif command == "complete_attempt":
        try:
            answers = json.loads(args[2])
            data = {"answers": answers}
            result = await call_api_with_retry(
                chat_id, access_token, refresh_token, user_id_str,
                f"/api/v1/users/{args[0]}/attempts/{args[1]}", "PUT", data
            )
            return await format_response(result, f"Завершение попытки ID:{args[1]}")
        except json.JSONDecodeError as e:
            return {"response": f"Ошибка в формате JSON ответов: {e}"}
    
    elif command == "my_profile":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/users/{user_id_int}", "GET"
        )
        return await format_response(result, "Ваш профиль")
    
    elif command == "my_disciplines":
        # В ваших Go хэндлерах нет такого маршрута
        # Используем общий список дисциплин
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            "/api/v1/disciplines", "GET"
        )
        return await format_response(result, "Доступные дисциплины")
    
    elif command == "my_attempts":
        # Проверка существования маршрута
        return {"response": "Команда не реализована. Используйте /start_attempt для начала теста"}
    
    elif command == "get_results":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/tests/{args[1]}/passers/marks", "GET"
        )
        return await format_response(result, f"Результаты теста {args[1]}")
    
    elif command == "json_input":
        # Обработка JSON ввода для предыдущих команд
        return await handle_json_input(chat_id, text, user_data)
    
    elif command == "unknown":
        return {"response": "Неизвестная команда. Используйте /help для списка команд."}
    
    else:
        return {"response": "Команда не реализована. Используйте /help для списка доступных команд"}

# ============= ОБРАБОТЧИКИ КОНКРЕТНЫХ КОМАНД =============

async def handle_help():
    """Справка по командам"""
    help_text = """Доступные команды:

ОСНОВНЫЕ:
/help - Эта справка

ДИСЦИПЛИНЫ:
/disciplines - Список всех дисциплин
/discipline [id] - Информация о дисциплине

ТЕСТЫ:
/tests [discipline_id] - Тесты дисциплины
/test [discipline_id] [test_id] - Информация о тесте
/activate_test [discipline_id] [test_id] - Активировать тест
/deactivate_test [discipline_id] [test_id] - Деактивировать тест

ПОЛЬЗОВАТЕЛИ:
/users - Все пользователи
/user [id] - Информация о пользователе
/register_user email - Зарегистрировать пользователя
/update_user_name [id] новое_имя - Обновить имя пользователя

СТУДЕНТЫ:
/students [discipline_id] - Студенты дисциплины
/add_student [discipline_id] [user_id] - Добавить студента
/remove_student [discipline_id] [user_id] - Удалить студента

ВОПРОСЫ:
/questions [discipline_id] [test_id] - Вопросы теста

ПОПЫТКИ:
/attempts - Все попытки
/start_attempt [test_id] - Начать попытку теста
/complete_attempt [user_id] [attempt_id] [answers_json] - Завершить попытку

МОИ КОМАНДЫ:
/my_profile - Мой профиль
/my_disciplines - Мои дисциплины
/my_attempts - Мои попытки

РЕЗУЛЬТАТЫ:
/results [discipline_id] [test_id] - Результаты теста

АВТОРИЗАЦИЯ:
/login - Проверить статус авторизации
/login [type] - Авторизация (github/yandex/code)
/logout - Выйти
/logout all=true - Выйти со всех устройств

Примеры:
/disciplines
/discipline 1
/tests 1
/user 5
/register_user test@example.com
/update_user_name 5 Иван Иванов
"""
    return {"response": help_text}

async def handle_json_input(chat_id: int, text: str, user_data: dict):
    """Обработка JSON ввода"""
    try:
        data = json.loads(text)
        return {"response": f"JSON принят: {data}"}
    except json.JSONDecodeError as e:
        return {"response": f"Ошибка парсинга JSON: {e}"}

async def format_response(result: dict, title: str = "") -> dict:
    """Форматирование ответа от API"""
    if not result:
        return {"response": "Пустой ответ от сервера"}
    
    if isinstance(result, dict) and "error" in result:
        error_msg = result.get("error", "")
        
        if error_msg == "session_expired":
            return {"response": "Сессия истекла. Используйте /login для повторной авторизации."}
        elif error_msg == "forbidden":
            return {"response": "Недостаточно прав для выполнения действия."}
        elif error_msg == "not_found":
            return {"response": "Ресурс не найден."}
        elif error_msg == "connection_error":
            return {"response": "Ошибка подключения к серверу."}
        elif error_msg.startswith("http_error_"):
            status_code = error_msg.replace("http_error_", "")
            return {"response": f"HTTP ошибка {status_code}"}
        else:
            return {"response": f"Ошибка: {error_msg}"}
    
    if title:
        response_text = f"**{title}**\n\n"
    else:
        response_text = ""
    
    if isinstance(result, dict):
        # Специальная обработка для ответа с id (регистрация пользователя)
        if "id" in result and len(result) == 1:
            response_text += f"Успешно! ID пользователя: {result['id']}"
        else:
            response_text += format_dict(result)
    elif isinstance(result, list):
        if not result:
            response_text += "Нет данных"
        else:
            for i, item in enumerate(result[:20], 1):
                response_text += f"{i}. {format_item(item)}\n"
            if len(result) > 20:
                response_text += f"\n... и еще {len(result) - 20} элементов"
    else:
        response_text += str(result)
    
    if len(response_text) > 4000:
        response_text = response_text[:4000] + "\n\n... (сообщение обрезано)"
    
    return {"response": response_text}

def format_item(item) -> str:
    """Форматирование элемента списка"""
    if isinstance(item, dict):
        if "name" in item and "id" in item:
            return f"{item['name']} (ID: {item['id']})"
        elif "title" in item and "id" in item:
            return f"{item['title']} (ID: {item['id']})"
        elif "email" in item and "id" in item:
            name = item.get('name', '')
            name_part = f" - {name}" if name else ''
            return f"{item['email']} (ID: {item['id']}){name_part}"
        elif "full_name" in item:
            return f"{item['full_name']}"
        elif "id" in item:
            for key, value in item.items():
                if isinstance(value, str) and key != "id":
                    return f"{value} (ID: {item['id']})"
            return f"ID: {item['id']}"
        else:
            return str(item)[:100]
    else:
        return str(item)[:100]

def format_dict(data: dict) -> str:
    """Форматирование словаря"""
    result = []
    for key, value in data.items():
        if key in ["password", "access_token", "refresh_token", "token"]:
            continue
        
        if isinstance(value, (str, int, float, bool)):
            result.append(f"• {key}: {value}")
        elif isinstance(value, list):
            if not value:
                result.append(f"• {key}: []")
            elif len(value) <= 3:
                items = ", ".join([format_item(v) for v in value])
                result.append(f"• {key}: [{items}]")
            else:
                result.append(f"• {key}: список из {len(value)} элементов")
        elif isinstance(value, dict):
            result.append(f"• {key}:")
            nested = format_dict(value)
            for line in nested.split("\n"):
                result.append(f"  {line}")
        else:
            result.append(f"• {key}: {type(value).__name__}")
    return "\n".join(result)

# ============= ОСНОВНОЙ ОБРАБОТЧИК =============

@app.post("/handle")
async def handle_message(request: Request):
    """Основной обработчик сообщений"""
    try:
        data = await request.json()
        chat_id = data.get("chat_id")
        text = data.get("text", "").strip()
        
        if not chat_id:
            return {"response": "Ошибка: не указан chat_id"}
        
        logging.info(f"Worker: chat_id={chat_id}, text='{text}'")
        
        user_data = redis_client.get_user_data(chat_id)
        
        if not user_data:
            return await handle_anonymous_user(chat_id, text)
        else:
            status = user_data.get("status")
            
            if status == "anonim":
                return await handle_anonymous_user_auth(chat_id, text, user_data)
            elif status == "authorized":
                return await handle_authorized_user(chat_id, text, user_data)
            else:
                return {"response": f"Неизвестный статус: {status}"}
    except Exception as e:
        logging.error(f"Error in handle_message: {e}")
        return {"response": f"Внутренняя ошибка сервера: {e}"}

async def handle_anonymous_user(chat_id: int, text: str):
    """Обработка неавторизованного пользователя"""
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
                    return {"response": f"Авторизация {auth_type} начата. Используйте /login для проверки статуса."}
    
    elif text in ["/help", "/start"]:
        return await handle_help()
    
    elif text.startswith("/"):
        return {"response": "Вы не авторизованы. Сначала авторизуйтесь с помощью /login"}
    
    else:
        return {"response": "Добро пожаловать! Для начала работы используйте /login"}

async def handle_anonymous_user_auth(chat_id: int, text: str, user_data: dict):
    """Обработка анонимного пользователя в процессе авторизации"""
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
                return {"response": f"Вы успешно авторизованы! ID пользователя: {user_id}\nИспользуйте /help для списка команд."}
            
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
    
    elif text in ["/help", "/start"]:
        return await handle_help()
    
    elif text.startswith("/"):
        return {"response": "Вы в процессе авторизации. Используйте /login для проверки статуса"}
    
    else:
        return {"response": "Вы в процессе авторизации. Используйте /login для проверки статуса"}

# ============= ЦИКЛИЧЕСКИЕ ЗАПРОСЫ =============

@app.get("/health")
def health_check():
    return {"status": "ok", "port": 8001, "service": "bot_1"}

if __name__ == "__main__":import uvicorn
import logging
import uuid
import aiohttp
import json
import re
from typing import Dict, List, Optional, Any, Tuple
from fastapi import FastAPI, Request
from config import config
from redis_client import redis_client

app = FastAPI()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =============

async def refresh_token(chat_id: int, refresh_token: str, user_id: str = None) -> tuple:
    """Обновление токенов"""
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
                    
                    if new_access and new_refresh:
                        redis_client.set_authorized_user(
                            chat_id, 
                            new_access, 
                            new_refresh,
                            user_id
                        )
                        logger.info(f"Token refreshed for chat {chat_id}")
                        return True, new_access, new_refresh
                logger.error(f"Refresh token failed: {resp.status}")
                return False, None, None
    except Exception as e:
        logger.error(f"Error refreshing token for chat {chat_id}: {e}")
        return False, None, None

async def call_api_with_retry(chat_id: int, access_token: str, refresh_token: str, 
                              user_id: str, endpoint: str, method: str = "GET", 
                              data: dict = None) -> dict:
    """Вызов API с автоматическим обновлением токенов"""
    headers = {"Authorization": f"Bearer {access_token}"}
    url = f"{config.MAIN_MODULE_URL}{endpoint}"
    
    logger.info(f"API call: {method} {url}, user_id: {user_id}, data: {data}")
    
    async def make_request():
        try:
            async with aiohttp.ClientSession() as session:
                http_method = getattr(session, method.lower())
                kwargs = {"headers": headers, "timeout": 10}
                
                if data and method.upper() in ["POST", "PUT", "PATCH"]:
                    kwargs["json"] = data
                
                async with http_method(url, **kwargs) as resp:
                    logger.info(f"API response status: {resp.status} for {url}")
                    if resp.status == 200:
                        result = await resp.json()
                        logger.info(f"API success response: {result}")
                        return result, None
                    elif resp.status == 201:
                        result = await resp.json()
                        logger.info(f"API created response: {result}")
                        return result, None
                    elif resp.status == 401:
                        logger.warning(f"API unauthorized: {url}")
                        return None, "unauthorized"
                    elif resp.status == 403:
                        logger.warning(f"API forbidden: {url}")
                        return None, "forbidden"
                    elif resp.status == 404:
                        logger.warning(f"API not found: {url}")
                        return None, "not_found"
                    else:
                        logger.error(f"API HTTP error {resp.status}: {url}")
                        return None, f"http_error_{resp.status}"
        except Exception as e:
            logger.error(f"API call error: {e} for {url}")
            return None, "connection_error"
    
    # Первый вызов
    result, error = await make_request()
    
    if error == "unauthorized":
        logger.info(f"Token expired, refreshing for chat {chat_id}")
        success, new_access, new_refresh = await refresh_token(
            chat_id, refresh_token, user_id
        )
        if success:
            headers["Authorization"] = f"Bearer {new_access}"
            result, error = await make_request()
            if not error:
                return result
        else:
            redis_client.delete_user(chat_id)
            return {"error": "session_expired"}
    
    if error:
        return {"error": error}
    
    return result

async def start_auth_service(login_token: str, auth_type: str) -> Optional[Dict]:
    """Запуск авторизации"""
    logger.info(f"Starting auth service: type={auth_type}, token={login_token}")
    try:
        async with aiohttp.ClientSession() as session:
            params = {"provider": auth_type, "login_token": login_token}
            
            async with session.get(
                f"{config.AUTH_SERVICE_URL}/auth",
                params=params,
                timeout=10
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    logger.info(f"Auth service response: {result}")
                    return result
                logger.error(f"Auth start failed: {resp.status}")
                return None
    except Exception as e:
        logger.error(f"Auth service error: {e}")
        return None

async def check_auth_status(login_token: str) -> Optional[Dict]:
    """Проверка статуса авторизации"""
    logger.info(f"Checking auth status for token: {login_token}")
    try:
        async with aiohttp.ClientSession() as session:
            params = {"login_token": login_token}
            
            async with session.get(
                f"{config.AUTH_SERVICE_URL}/check",
                params=params,
                timeout=10
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    logger.info(f"Auth check response: {result}")
                    return result
                logger.error(f"Auth check failed: {resp.status}")
                return None
    except Exception as e:
        logger.error(f"Auth check error: {e}")
        return None

async def get_max_user_id(chat_id: int, access_token: str, refresh_token: str) -> Optional[int]:
    """Получение максимального ID пользователя через API"""
    logger.info(f"Getting max user ID for chat {chat_id}")
    try:
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, "",
            "/api/v1/users/id", "GET"
        )
        
        logger.info(f"Max user ID API response: {result}")
        
        if isinstance(result, dict) and "id" in result:
            max_id = result["id"]
            logger.info(f"Got max user ID: {max_id}")
            return max_id
        elif isinstance(result, dict) and "error" in result:
            logger.error(f"Error getting max user ID: {result['error']}")
            return None
        else:
            logger.error(f"Unexpected response format for max user ID: {result}")
            return None
    except Exception as e:
        logger.error(f"Exception in get_max_user_id: {e}")
    
    return None

# ============= ФУНКЦИИ ДЛЯ ПРОХОЖДЕНИЯ ТЕСТОВ =============

async def start_test_attempt(chat_id: int, user_data: dict, test_id: int):
    """Начать новую попытку теста"""
    logger.info(f"Starting test attempt for chat {chat_id}, test_id: {test_id}")
    try:
        access_token = user_data.get("access_token", "")
        refresh_token = user_data.get("refresh_token", "")
        user_id_str = user_data.get("user_id", "")
        
        logger.info(f"User data: access_token={'yes' if access_token else 'no'}, "
                   f"user_id='{user_id_str}'")
        
        if not user_id_str or not access_token:
            logger.error(f"Missing auth data for chat {chat_id}")
            return False, None, "Ошибка авторизации"
        
        # Проверяем, есть ли уже активная попытка
        if redis_client.get_active_attempt(chat_id):
            logger.warning(f"Chat {chat_id} already has active attempt")
            return False, None, "У вас уже есть активный тест. Завершите его сначала."
        
        # Создаем попытку через API
        data = {"test_id": test_id}
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/users/{user_id_str}/attempts", "POST", data
        )
        
        if isinstance(result, dict) and "error" in result:
            logger.error(f"API error starting test: {result['error']}")
            return False, None, f"Ошибка API: {result['error']}"
        
        if isinstance(result, dict) and "attempt_id" in result:
            attempt_id = result["attempt_id"]
            questions = result.get("questions", [])
            
            logger.info(f"Test attempt created: id={attempt_id}, questions={len(questions)}")
            
            if questions:
                # Сохраняем активную попытку в Redis
                redis_client.set_active_attempt(
                    chat_id, 
                    attempt_id=attempt_id,
                    test_id=test_id,
                    user_id=user_id_str,
                    questions=questions,
                    current_question=0,
                    answers={}
                )
                return True, attempt_id, questions
            else:
                logger.warning(f"No questions in test {test_id}")
                return False, None, "Тест не содержит вопросов"
        else:
            logger.error(f"Failed to create attempt, response: {result}")
            return False, None, "Не удалось создать попытку"
    except Exception as e:
        logger.error(f"Error starting test attempt: {e}")
        return False, None, f"Ошибка: {str(e)}"

async def handle_test_answer(chat_id: int, answer_num: int, user_data: dict):
    """Обработка ответа на вопрос теста"""
    logger.info(f"Handling test answer for chat {chat_id}: {answer_num}")
    try:
        # Получаем активную попытку
        attempt_data = redis_client.get_active_attempt(chat_id)
        if not attempt_data:
            logger.warning(f"No active attempt for chat {chat_id}")
            return {"response": "У вас нет активного теста. Начните тест с помощью /start_test [test_id]"}
        
        questions = attempt_data.get("questions", [])
        current_index = attempt_data.get("current_question", 0)
        answers = attempt_data.get("answers", {})
        
        logger.info(f"Current question: {current_index}/{len(questions)}")
        
        if current_index >= len(questions):
            # Все вопросы пройдены
            redis_client.delete_active_attempt(chat_id)
            logger.info(f"All questions answered for chat {chat_id}")
            return {"response": "Все вопросы пройдены! Используйте /finish_test для завершения теста."}
        
        current_question = questions[current_index]
        
        # Проверяем, что введенный номер ответа валиден
        options = current_question.get("options", [])
        
        if 1 <= answer_num <= len(options):
            selected_option = options[answer_num - 1]
            option_id = selected_option.get("id")
            question_id = current_question.get("id")
            
            logger.info(f"Answer saved: question_id={question_id}, option_id={option_id}")
            
            # Сохраняем ответ
            answers[str(question_id)] = option_id
            
            # Переходим к следующему вопросу
            current_index += 1
            redis_client.update_attempt_question(chat_id, current_index, answers)
            
            if current_index < len(questions):
                # Показываем следующий вопрос
                next_question = questions[current_index]
                return await format_question(next_question, current_index, len(questions))
            else:
                # Все вопросы пройдены
                redis_client.delete_active_attempt(chat_id)
                return {"response": "Все вопросы пройдены! Используйте /finish_test для завершения теста и получения результата."}
        else:
            logger.warning(f"Invalid answer number {answer_num}, options: {len(options)}")
            return {"response": f"Пожалуйста, выберите вариант от 1 до {len(options)}"}
            
    except Exception as e:
        logger.error(f"Error handling question answer: {e}")
        return {"response": f"Ошибка обработки ответа: {str(e)}"}

async def format_question(question: dict, question_num: int, total_questions: int):
    """Форматирование вопроса для вывода"""
    title = question.get("title", "")
    text = question.get("text", "")
    options = question.get("options", [])
    
    response = f"Вопрос {question_num+1}/{total_questions}\n"
    if title:
        response += f"{title}\n"
    
    if text:
        response += f"{text}\n\n"
    
    for i, option in enumerate(options, 1):
        option_text = option.get("text", "")
        response += f"{i}. {option_text}\n"
    
    response += f"\nВведите номер ответа (1-{len(options)}) или /cancel_test для отмены:"
    
    return {"response": response}

async def finish_test_attempt(chat_id: int, user_data: dict):
    """Завершение попытки теста и отправка ответов"""
    logger.info(f"Finishing test attempt for chat {chat_id}")
    try:
        access_token = user_data.get("access_token", "")
        refresh_token = user_data.get("refresh_token", "")
        user_id_str = user_data.get("user_id", "")
        
        logger.info(f"Finishing with user_id: {user_id_str}")
        
        # Получаем активную попытку
        attempt_data = redis_client.get_active_attempt(chat_id)
        if not attempt_data:
            logger.warning(f"No active attempt to finish for chat {chat_id}")
            return {"response": "У вас нет активного теста для завершения"}
        
        attempt_id = attempt_data.get("attempt_id")
        answers = attempt_data.get("answers", {})
        
        logger.info(f"Finishing attempt {attempt_id} with {len(answers)} answers")
        
        # Формируем ответы в нужном формате
        formatted_answers = []
        for question_id_str, option_id in answers.items():
            formatted_answers.append({
                "question_id": int(question_id_str),
                "answer_option_id": option_id
            })
        
        # Создаем структуру запроса для завершения попытки
        data = {"answers": formatted_answers}
        
        # Отправляем ответы на сервер для завершения попытки
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/users/{user_id_str}/attempts/{attempt_id}", "PUT", data
        )
        
        logger.info(f"Finish attempt API response: {result}")
        
        # Удаляем активную попытку
        redis_client.delete_active_attempt(chat_id)
        
        if isinstance(result, dict) and "score" in result:
            score = result.get("score", 0)
            return {
                "response": f"Тест завершен!\n\n"
                          f"Ваш результат: {score} баллов\n"
                          f"ID попытки: {attempt_id}"
            }
        else:
            error_msg = result.get("error", "Не удалось получить результат")
            logger.error(f"Failed to finish attempt: {error_msg}")
            return {"response": f"Тест завершен, но: {error_msg}"}
            
    except Exception as e:
        logger.error(f"Error finishing test attempt: {e}")
        return {"response": f"Ошибка при завершении теста: {str(e)}"}

# ============= ФУНКЦИИ ДЛЯ ПАРСИНГА КОМАНД =============

def parse_command(text: str) -> Tuple[str, List[Any]]:
    """Парсинг команды и аргументов"""
    text = text.strip()
    
    # Основные команды без аргументов
    if text in ["/help", "/start"]:
        return "help", []
    
    # === ОСНОВНЫЕ ===
    if text == "/disciplines":
        return "list_disciplines", []
    
    # === ДИСЦИПЛИНЫ ===
    match = re.match(r'^/discipline (\d+)$', text)
    if match:
        return "get_discipline", [int(match.group(1))]
    
    # === ТЕСТЫ ===
    match = re.match(r'^/tests (\d+)$', text)
    if match:
        return "list_tests", [int(match.group(1))]
    
    match = re.match(r'^/test (\d+) (\d+)$', text)
    if match:
        return "get_test", [int(match.group(1)), int(match.group(2))]
    
    # === ПРОЙТИ ТЕСТ ===
    match = re.match(r'^/start_test (\d+)$', text)
    if match:
        return "start_test", [int(match.group(1))]  # test_id
    
    # Команда для отмены теста
    if text == "/cancel_test":
        return "cancel_test", []
    
    # Команда для завершения теста
    if text == "/finish_test":
        return "finish_test", []
    
    # === ПОЛЬЗОВАТЕЛИ ===
    if text == "/users":
        return "list_users", []
    
    match = re.match(r'^/user (\d+)$', text)
    if match:
        return "get_user", [int(match.group(1))]
    
    # === СТУДЕНТЫ ===
    match = re.match(r'^/students (\d+)$', text)
    if match:
        return "list_students", [int(match.group(1))]
    
    # === ВОПРОСЫ ===
    match = re.match(r'^/questions (\d+) (\d+)$', text)
    if match:
        return "list_questions", [int(match.group(1)), int(match.group(2))]
    
    # === МОИ КОМАНДЫ ===
    if text == "/my_profile":
        return "my_profile", []
    
    if text == "/my_attempts":
        return "my_attempts", []
    
    # === АВТОРИЗАЦИЯ ===
    if text.startswith("/login"):
        parts = text.split()
        if len(parts) == 1:
            return "login_status", []
        elif len(parts) == 2:
            return "login", [parts[1]]
    
    if text.startswith("/logout"):
        return "logout", []
    
    # Обработка ответов на вопросы теста (число от 1 до 9)
    match = re.match(r'^\d+$', text)
    if match and not text.startswith("/"):
        return "test_answer", [int(text)]
    
    return "unknown", []

# ============= ОБРАБОТЧИКИ КОМАНД =============

async def handle_authorized_user(chat_id: int, text: str, user_data: dict):
    """Обработка команд для авторизованного пользователя"""
    logger.info(f"Handling authorized user command: chat_id={chat_id}, text='{text}'")
    
    # Проверяем, есть ли активная попытка и текст - это число (ответ на вопрос)
    if redis_client.get_active_attempt(chat_id) and re.match(r'^\d+$', text) and not text.startswith("/"):
        logger.info(f"Processing test answer for chat {chat_id}")
        return await handle_test_answer(chat_id, int(text), user_data)
    
    # Авторизационные команды
    if text.startswith("/login"):
        parts = text.split()
        if len(parts) == 1:
            return {"response": "Вы уже авторизованы."}
        else:
            return {"response": "Вы уже авторизованы. Используйте /logout для выхода."}
    
    if text.startswith("/logout"):
        logger.info(f"Logout for chat {chat_id}")
        # Удаляем активную попытку если есть
        if redis_client.get_active_attempt(chat_id):
            redis_client.delete_active_attempt(chat_id)
        redis_client.delete_user(chat_id)
        return {"response": "Вы вышли из системы"}
    
    # Парсим команду
    command, args = parse_command(text)
    logger.info(f"Parsed command: {command}, args: {args}")
    
    access_token = user_data.get("access_token", "")
    refresh_token = user_data.get("refresh_token", "")
    user_id_str = user_data.get("user_id", "")
    
    logger.info(f"User data from Redis - access_token: {'yes' if access_token else 'no'}, "
               f"user_id: '{user_id_str}'")
    
    # Если user_id пустой, пробуем получить максимальный ID
    if (not user_id_str or user_id_str == "") and access_token:
        logger.info(f"User ID is empty, getting max ID for chat {chat_id}")
        max_id = await get_max_user_id(chat_id, access_token, refresh_token)
        if max_id is not None:
            user_id_str = str(max_id)
            user_data["user_id"] = user_id_str
            # Обновляем в Redis
            redis_client.set_authorized_user(
                chat_id, access_token, refresh_token, user_id_str
            )
            logger.info(f"Updated user_id to {user_id_str} in Redis")
        else:
            logger.error(f"Failed to get max user ID for chat {chat_id}")
            return {"response": "Не удалось получить ID пользователя. Попробуйте выйти и войти заново."}
    
    if not user_id_str or not access_token:
        logger.error(f"Missing auth data for chat {chat_id}: user_id='{user_id_str}', access_token={'yes' if access_token else 'no'}")
        return {"response": "Ошибка авторизации. Пожалуйста, войдите заново."}
    
    user_id_int = None
    try:
        user_id_int = int(user_id_str)
        logger.info(f"User ID as int: {user_id_int}")
    except (ValueError, TypeError):
        logger.error(f"Invalid user_id format: '{user_id_str}'")
        return {"response": "Ошибка: неверный ID пользователя. Авторизуйтесь заново."}
    
    # === ОБРАБОТКА КОМАНД ===
    
    if command == "help":
        return await handle_help()
    
    elif command == "list_disciplines":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            "/api/v1/disciplines", "GET"
        )
        return await format_response(result, "Список дисциплин")
    
    elif command == "get_discipline":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}", "GET"
        )
        return await format_response(result, f"Дисциплина ID:{args[0]}")
    
    elif command == "list_tests":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/tests", "GET"
        )
        return await format_response(result, f"Тесты дисциплины ID:{args[0]}")
    
    elif command == "get_test":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/tests/{args[1]}", "GET"
        )
        return await format_response(result, f"Тест ID:{args[1]}")
    
    elif command == "list_users":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            "/api/v1/users", "GET"
        )
        return await format_response(result, "Список пользователей")
    
    elif command == "get_user":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/users/{args[0]}", "GET"
        )
        return await format_response(result, f"Пользователь ID:{args[0]}")
    
    elif command == "list_students":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/students", "GET"
        )
        return await format_response(result, f"Студенты дисциплины ID:{args[0]}")
    
    elif command == "list_questions":
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/disciplines/{args[0]}/tests/{args[1]}/questions", "GET"
        )
        return await format_response(result, f"Вопросы теста ID:{args[1]}")
    
    elif command == "my_profile":
        try:
            result = await call_api_with_retry(
                chat_id, access_token, refresh_token, user_id_str,
                f"/api/v1/users/{user_id_int}", "GET"
            )
            return await format_response(result, "Ваш профиль")
        except Exception as e:
            logger.error(f"Error in my_profile command: {e}")
            return {"response": f"Ошибка при получении профиля: {str(e)}"}
    
    elif command == "my_attempts":
        try:
            result = await call_api_with_retry(
                chat_id, access_token, refresh_token, user_id_str,
                f"/api/v1/users/{user_id_int}/attempts", "GET"
            )
            return await format_response(result, "Ваши попытки")
        except Exception as e:
            logger.error(f"Error in my_attempts command: {e}")
            return {"response": "Нет информации о ваших попытках"}
    
    elif command == "start_test":
        test_id = args[0]
        logger.info(f"Starting test {test_id} for chat {chat_id}")
        
        # Начинаем попытку теста
        success, attempt_id, result = await start_test_attempt(
            chat_id, user_data, test_id
        )
        
        if success:
            # Показываем первый вопрос
            questions = result
            if questions and len(questions) > 0:
                return await format_question(questions[0], 0, len(questions))
            else:
                return {"response": "Тест не содержит вопросов"}
        else:
            return {"response": f"Не удалось начать тест: {result}"}
    
    elif command == "cancel_test":
        logger.info(f"Cancelling test for chat {chat_id}")
        # Отменяем активную попытку
        redis_client.delete_active_attempt(chat_id)
        return {"response": "Тест отменен. Вы можете начать новый тест с помощью /start_test [test_id]"}
    
    elif command == "finish_test":
        logger.info(f"Finishing test for chat {chat_id}")
        # Завершаем активную попытку
        return await finish_test_attempt(chat_id, user_data)
    
    elif command == "test_answer":
        logger.info(f"Test answer for chat {chat_id}: {args[0]}")
        # Обработка ответа на вопрос теста (1-9)
        if not redis_client.get_active_attempt(chat_id):
            return {"response": "У вас нет активного теста. Начните тест с помощью /start_test [test_id]"}
        
        return await handle_test_answer(chat_id, args[0], user_data)
    
    elif command == "unknown":
        return {"response": "Неизвестная команда. Используйте /help для списка команд."}
    
    else:
        return {"response": "Команда не реализована. Используйте /help для списка доступных команд"}

# ============= ОБРАБОТЧИКИ КОНКРЕТНЫХ КОМАНД =============

async def handle_help():
    """Справка по командам"""
    logger.info("Handling /help command")
    help_text = """Доступные команды:

ОСНОВНЫЕ:
/help - Эта справка

ДИСЦИПЛИНЫ:
/disciplines - Список всех дисциплин
/discipline [id] - Информация о дисциплине

ТЕСТЫ:
/tests [discipline_id] - Тесты дисциплины
/test [discipline_id] [test_id] - Информация о тесте
/start_test [test_id] - Начать прохождение теста
/cancel_test - Отменить текущий тест
/finish_test - Завершить тест и отправить ответы

ПОЛЬЗОВАТЕЛИ:
/users - Все пользователи
/user [id] - Информация о пользователе

СТУДЕНТЫ:
/students [discipline_id] - Студенты дисциплины

ВОПРОСЫ:
/questions [discipline_id] [test_id] - Вопросы теста

МОИ КОМАНДЫ:
/my_profile - Мой профиль
/my_attempts - Мои попытки

АВТОРИЗАЦИЯ:
/login - Проверить статус авторизации
/login [type] - Авторизация (github/yandex/code)
/logout - Выйти

ПРИМЕР РАБОТЫ С ТЕСТАМИ:
1. /disciplines - посмотреть все дисциплины
2. /tests 1 - посмотреть тесты дисциплины с ID 1
3. /start_test 5 - начать тест с ID 5
4. 1 - ответить "вариант 1" на первый вопрос
5. /finish_test - завершить тест и получить результат"""
    return {"response": help_text}

async def format_response(result: dict, title: str = "") -> dict:
    """Форматирование ответа от API"""
    if not result:
        logger.warning(f"Empty response for {title}")
        return {"response": "Пустой ответ от сервера"}
    
    if isinstance(result, dict) and "error" in result:
        error_msg = result.get("error", "")
        logger.error(f"API error for {title}: {error_msg}")
        
        if error_msg == "session_expired":
            return {"response": "Сессия истекла. Используйте /login для повторной авторизации."}
        elif error_msg == "forbidden":
            return {"response": "Недостаточно прав для выполнения действия."}
        elif error_msg == "not_found":
            return {"response": "Ресурс не найден."}
        elif error_msg == "connection_error":
            return {"response": "Ошибка подключения к серверу."}
        elif error_msg.startswith("http_error_"):
            status_code = error_msg.replace("http_error_", "")
            return {"response": f"HTTP ошибка {status_code}"}
        else:
            return {"response": f"Ошибка: {error_msg}"}
    
    logger.info(f"Formatting response for {title}, type: {type(result)}")
    
    if title:
        response_text = f"{title}\n\n"
    else:
        response_text = ""
    
    if isinstance(result, dict):
        response_text += format_dict(result)
    elif isinstance(result, list):
        if not result:
            response_text += "Нет данных"
        else:
            for i, item in enumerate(result[:20], 1):
                response_text += f"{i}. {format_item(item)}\n"
            if len(result) > 20:
                response_text += f"\n... и еще {len(result) - 20} элементов"
    else:
        response_text += str(result)
    
    if len(response_text) > 4000:
        response_text = response_text[:4000] + "\n\n... (сообщение обрезано)"
    
    return {"response": response_text}

def format_item(item) -> str:
    """Форматирование элемента списка"""
    if isinstance(item, dict):
        if "name" in item and "id" in item:
            return f"{item['name']} (ID: {item['id']})"
        elif "title" in item and "id" in item:
            return f"{item['title']} (ID: {item['id']})"
        elif "email" in item and "id" in item:
            name = item.get('name', '')
            name_part = f" - {name}" if name else ''
            return f"{item['email']} (ID: {item['id']}){name_part}"
        elif "full_name" in item:
            return f"{item['full_name']}"
        elif "id" in item:
            for key, value in item.items():
                if isinstance(value, str) and key != "id":
                    return f"{value} (ID: {item['id']})"
            return f"ID: {item['id']}"
        else:
            return str(item)[:100]
    else:
        return str(item)[:100]

def format_dict(data: dict) -> str:
    """Форматирование словаря"""
    result = []
    for key, value in data.items():
        if key in ["password", "access_token", "refresh_token", "token"]:
            continue
        
        if isinstance(value, (str, int, float, bool)):
            result.append(f"• {key}: {value}")
        elif isinstance(value, list):
            if not value:
                result.append(f"• {key}: []")
            elif len(value) <= 3:
                items = ", ".join([format_item(v) for v in value])
                result.append(f"• {key}: [{items}]")
            else:
                result.append(f"• {key}: список из {len(value)} элементов")
        elif isinstance(value, dict):
            result.append(f"• {key}:")
            nested = format_dict(value)
            for line in nested.split("\n"):
                result.append(f"  {line}")
        else:
            result.append(f"• {key}: {type(value).__name__}")
    return "\n".join(result)

# ============= ОСНОВНОЙ ОБРАБОТЧИК =============

@app.post("/handle")
async def handle_message(request: Request):
    """Основной обработчик сообщений"""
    try:
        data = await request.json()
        chat_id = data.get("chat_id")
        text = data.get("text", "").strip()
        
        if not chat_id:
            logger.error("No chat_id in request")
            return {"response": "Ошибка: не указан chat_id"}
        
        logger.info(f"=== NEW MESSAGE === chat_id={chat_id}, text='{text}'")
        
        user_data = redis_client.get_user_data(chat_id)
        logger.info(f"User data from Redis: {user_data}")
        
        if not user_data:
            logger.info(f"No user data for chat {chat_id}, handling as anonymous")
            return await handle_anonymous_user(chat_id, text)
        else:
            status = user_data.get("status")
            logger.info(f"User status: {status}")
            
            if status == "anonim":
                return await handle_anonymous_user_auth(chat_id, text, user_data)
            elif status == "authorized":
                return await handle_authorized_user(chat_id, text, user_data)
            else:
                logger.error(f"Unknown status: {status}")
                return {"response": f"Неизвестный статус: {status}"}
    except Exception as e:
        logger.error(f"Error in handle_message: {e}", exc_info=True)
        return {"response": f"Внутренняя ошибка сервера: {e}"}

async def handle_anonymous_user(chat_id: int, text: str):
    """Обработка неавторизованного пользователя"""
    logger.info(f"Handling anonymous user: chat_id={chat_id}, text='{text}'")
    
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
            logger.info(f"Set login token for chat {chat_id}: {login_token}")
            
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
                    return {"response": f"Авторизация {auth_type} начата. Используйте /login для проверки статуса."}
    
    elif text in ["/help", "/start"]:
        return await handle_help()
    
    elif text.startswith("/"):
        return {"response": "Вы не авторизованы. Сначала авторизуйтесь с помощью /login"}
    
    else:
        return {"response": "Добро пожаловать! Для начала работы используйте /login"}

async def handle_anonymous_user_auth(chat_id: int, text: str, user_data: dict):
    """Обработка анонимного пользователя в процессе авторизации"""
    logger.info(f"Handling anonymous user auth: chat_id={chat_id}, text='{text}'")
    
    if text.startswith("/login"):
        parts = text.split()
        
        if len(parts) == 1:
            login_token = user_data.get("login_token")
            logger.info(f"Checking auth status with token: {login_token}")
            
            if not login_token:
                redis_client.delete_user(chat_id)
                return {"response": "Вы не авторизованы. Выберите:\n/login github\n/login yandex\n/login code"}
            
            result = await check_auth_status(login_token)
            
            if not result:
                return {"response": "Ошибка подключения к серверу авторизации"}
            
            status = result.get("status")
            logger.info(f"Auth status: {status}")
            
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
                
                logger.info(f"Auth granted - access_token: {'yes' if access_token else 'no'}, "
                           f"refresh_token: {'yes' if refresh_token else 'no'}, "
                           f"user_id: '{user_id}'")
                
                # Сохраняем авторизацию (даже если user_id пустой)
                redis_client.set_authorized_user(chat_id, access_token, refresh_token, user_id)
                
                if user_id:
                    return {"response": f"Вы успешно авторизованы! ID пользователя: {user_id}\nИспользуйте /help для списка команд."}
                else:
                    return {"response": "Вы успешно авторизованы! Используйте /help для списка команд."}
            
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
    
    elif text in ["/help", "/start"]:
        return await handle_help()
    
    elif text.startswith("/"):
        return {"response": "Вы в процессе авторизации. Используйте /login для проверки статуса"}
    
    else:
        return {"response": "Вы в процессе авторизации. Используйте /login для проверки статуса"}

# ============= ЦИКЛИЧЕСКИЕ ЗАПРОСЫ =============

@app.get("/health")
def health_check():
    return {"status": "ok", "port": 8001, "service": "bot_1"}

if __name__ == "__main__":
    logger.info("Starting bot_1 on port 8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    logger.info("Starting bot_1 on port 8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)