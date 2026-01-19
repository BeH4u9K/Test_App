import uvicorn
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

async def get_max_user_id(chat_id: int, access_token: str, refresh_token: str) -> Optional[int]:
    """Получение максимального ID пользователя через API"""
    try:
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, "",
            "/api/v1/users/id", "GET"
        )
        
        if isinstance(result, dict) and "id" in result:
            return result["id"]
        elif isinstance(result, dict) and "error" in result:
            logging.error(f"Error getting max user ID: {result['error']}")
            return None
    except Exception as e:
        logging.error(f"Exception in get_max_user_id: {e}")
    
    return None

# ============= ФУНКЦИИ ДЛЯ ПРОХОЖДЕНИЯ ТЕСТОВ =============

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

async def handle_test_answer(chat_id: int, answer_num: int, user_data: dict):
    """Обработка ответа на вопрос теста"""
    try:
        # Получаем активную попытку
        attempt_data = redis_client.get_active_attempt(chat_id)
        if not attempt_data:
            return {"response": "У вас нет активного теста. Начните тест с помощью /start_test [test_id]"}
        
        questions = attempt_data.get("questions", [])
        current_index = attempt_data.get("current_question", 0)
        answers = attempt_data.get("answers", {})
        
        if current_index >= len(questions):
            return {"response": "Вы уже ответили на все вопросы. Используйте /finish_test для завершения теста."}
        
        current_question = questions[current_index]
        question_id = current_question.get("id")
        options = current_question.get("options", [])
        
        # Проверяем, что введенный номер ответа валиден
        if 1 <= answer_num <= len(options):
            selected_option = options[answer_num - 1]
            option_id = selected_option.get("id")
            
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
                return {"response": "Вы ответили на все вопросы! Используйте /finish_test для завершения теста и получения результата."}
        else:
            return {"response": f"Пожалуйста, выберите вариант от 1 до {len(options)}"}
            
    except Exception as e:
        logging.error(f"Error handling question answer: {e}")
        return {"response": f"Ошибка обработки ответа: {str(e)}"}

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
    
    # === ПОПЫТКИ ===
    if text == "/my_attempts":
        return "my_attempts", []
    
    match = re.match(r'^/attempt (\d+)$', text)
    if match:
        return "my_attempt", [int(match.group(1))]
    
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
    
    # Проверяем, есть ли активная попытка и текст - это число (ответ на вопрос)
    if redis_client.get_active_attempt(chat_id) and re.match(r'^\d+$', text) and not text.startswith("/"):
        return await handle_test_answer(chat_id, int(text), user_data)
    
    # Авторизационные команды
    if text.startswith("/login"):
        parts = text.split()
        if len(parts) == 1:
            return {"response": "Вы уже авторизованы."}
        else:
            return {"response": "Вы уже авторизованы. Используйте /logout для выхода."}
    
    if text.startswith("/logout"):
        # Удаляем активную попытку если есть
        if redis_client.get_active_attempt(chat_id):
            redis_client.delete_active_attempt(chat_id)
        redis_client.delete_user(chat_id)
        return {"response": "Вы вышли из системы"}
    
    # Парсим команду
    command, args = parse_command(text)
    
    access_token = user_data.get("access_token", "")
    refresh_token = user_data.get("refresh_token", "")
    user_id_str = user_data.get("user_id", "")
    
    # Если user_id пустой, пробуем получить максимальный ID
    if not user_id_str and access_token:
        max_id = await get_max_user_id(chat_id, access_token, refresh_token)
        if max_id is not None:
            user_id_str = str(max_id)
            user_data["user_id"] = user_id_str
            # Обновляем в Redis
            redis_client.set_authorized_user(
                chat_id, access_token, refresh_token, user_id_str
            )
        else:
            return {"response": "Не удалось получить ID пользователя. Попробуйте выйти и войти заново."}
    
    if not user_id_str or not access_token:
        return {"response": "Ошибка авторизации. Пожалуйста, войдите заново."}
    
    user_id_int = None
    try:
        user_id_int = int(user_id_str)
    except (ValueError, TypeError):
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
            logging.error(f"Error in my_profile command: {e}")
            return {"response": f"Ошибка при получении профиля: {str(e)}"}
    
    elif command == "my_attempts":
        try:
            # Используем правильный endpoint для получения всех попыток пользователя
            # Согласно routes.go, endpoint: /api/v1/users/{id}/attempts
            result = await call_api_with_retry(
                chat_id, access_token, refresh_token, user_id_str,
                f"/api/v1/users/{user_id_int}/attempts", "GET"
            )
            return await format_response(result, "Ваши попытки")
        except Exception as e:
            logging.error(f"Error in my_attempts command: {e}")
            return {"response": f"Ошибка при получении ваших попыток: {str(e)}"}
    
    elif command == "my_attempt":
        if len(args) == 1:
            attempt_id = args[0]
            try:
                # Получаем конкретную попытку
                # Согласно routes.go, endpoint: /api/v1/users/{userID}/attempts/{attemptID}
                result = await call_api_with_retry(
                    chat_id, access_token, refresh_token, user_id_str,
                    f"/api/v1/users/{user_id_int}/attempts/{attempt_id}", "GET"
                )
                return await format_response(result, f"Попытка ID:{attempt_id}")
            except Exception as e:
                logging.error(f"Error in my_attempt command: {e}")
                return {"response": f"Ошибка при получении попытки: {str(e)}"}
        else:
            return {"response": "Использование: /attempt [id_попытки]"}
    
    elif command == "start_test":
        test_id = args[0]
        
        # Проверяем, есть ли уже активная попытка
        if redis_client.get_active_attempt(chat_id):
            return {"response": "У вас уже есть активный тест. Завершите его с помощью /finish_test или отмените /cancel_test"}
        
        # Создаем новую попытку через API
        data = {"test_id": test_id}
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/users/{user_id_int}/attempts", "POST", data
        )
        
        if isinstance(result, dict) and "error" in result:
            return {"response": f"Ошибка при создании попытки: {result['error']}"}
        
        # Проверяем, что в ответе есть attempt_id и questions
        if isinstance(result, dict) and "attempt_id" in result and "questions" in result:
            attempt_id = result["attempt_id"]
            questions = result["questions"]
            
            if not questions:
                return {"response": "Тест не содержит вопросов"}
            
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
            
            # Показываем первый вопрос
            return await format_question(questions[0], 0, len(questions))
        else:
            return {"response": "Не удалось создать попытку. Проверьте ID теста."}
    
    elif command == "cancel_test":
        # Отменяем активную попытку
        if redis_client.get_active_attempt(chat_id):
            redis_client.delete_active_attempt(chat_id)
            return {"response": "Тест отменен. Вы можете начать новый тест с помощью /start_test [test_id]"}
        else:
            return {"response": "У вас нет активного теста для отмены"}
    
    elif command == "finish_test":
        # Проверяем, есть ли активная попытка
        attempt_data = redis_client.get_active_attempt(chat_id)
        if not attempt_data:
            return {"response": "У вас нет активного теста для завершения"}
        
        attempt_id = attempt_data.get("attempt_id")
        answers = attempt_data.get("answers", {})
        questions = attempt_data.get("questions", [])
        
        # Проверяем, что на все вопросы ответили
        answered_questions = set(answers.keys())
        all_questions = {str(q.get("id")) for q in questions if q.get("id")}
        
        if len(answered_questions) < len(all_questions):
            unanswered = all_questions - answered_questions
            return {"response": f"Вы ответили не на все вопросы. Осталось вопросов: {len(unanswered)}. Продолжайте отвечать."}
        
        # Формируем ответы в формате для API
        # ВАЖНО: В примере JSON видно, что question_id и answer_option_id - это ID, а не номера
        formatted_answers = []
        for question_id_str, answer_option_id in answers.items():
            formatted_answers.append({
                "question_id": int(question_id_str),
                "answer_option_id": answer_option_id  # Это уже ID варианта ответа
            })
        
        # Отправляем ответы на сервер для завершения попытки
        data = {"answers": formatted_answers}
        result = await call_api_with_retry(
            chat_id, access_token, refresh_token, user_id_str,
            f"/api/v1/users/{user_id_int}/attempts/{attempt_id}", "PUT", data
        )
        
        # Удаляем активную попытку из Redis
        redis_client.delete_active_attempt(chat_id)
        
        if isinstance(result, dict) and "error" in result:
            return {"response": f"Ошибка при завершении теста: {result['error']}"}
        
        # Проверяем структуру ответа
        if isinstance(result, dict):
            if "score" in result:
                score = result.get("score", 0)
                return {
                    "response": f"Тест успешно завершен!\n"
                               f"ID попытки: {attempt_id}\n"
                               f"Набрано баллов: {score}"
                }
            elif "message" in result and "score" in result:
                score = result.get("score", 0)
                return {
                    "response": f"Тест успешно завершен!\n"
                               f"ID попытки: {attempt_id}\n"
                               f"Набрано баллов: {score}"
                }
            else:
                return {"response": f"Тест завершен. Ответ сервера: {str(result)}"}
        else:
            return {"response": "Тест завершен, но не удалось получить результат"}
    
    elif command == "test_answer":
        # Проверяем, есть ли активная попытка
        attempt_data = redis_client.get_active_attempt(chat_id)
        if not attempt_data:
            return {"response": "У вас нет активного теста. Начните тест с помощью /start_test [test_id]"}
        
        return await handle_test_answer(chat_id, args[0], user_data)
    
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
/start_test [test_id] - Начать прохождение теста
/cancel_test - Отменить текущий тест
/finish_test - Завершить тест и отправить ответы

ПОПЫТКИ:
/my_attempts - Мои попытки тестирования
/attempt [id] - Информация о конкретной попытке

ПОЛЬЗОВАТЕЛИ:
/users - Все пользователи
/user [id] - Информация о пользователе

СТУДЕНТЫ:
/students [discipline_id] - Студенты дисциплины

ВОПРОСЫ:
/questions [discipline_id] [test_id] - Вопросы теста

МОИ КОМАНДЫ:
/my_profile - Мой профиль

АВТОРИЗАЦИЯ:
/login - Проверить статус авторизации
/login [type] - Авторизация (github/yandex/code)
/logout - Выйти
"""
    return {"response": help_text}

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

#ОСНОВНОЙ ОБРАБОТЧИК

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
                
                # Сохраняем авторизацию
                redis_client.set_authorized_user(chat_id, access_token, refresh_token, user_id)
                
                if user_id:
                    return {"response": f"Вы успешно авторизованы!\nИспользуйте /help для списка команд."}
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

@app.get("/check_auth_status_all")
async def check_auth_status_all():
    """Обработчик циклической проверки статуса анонимных пользователей"""
    try:
        # Получаем всех анонимных пользователей
        anonim_users = redis_client.get_all_anonim_users()
        results = []
        
        for chat_id, user_data in anonim_users.items():
            login_token = user_data.get("login_token")
            if login_token:
                result = await check_auth_status(login_token)
                
                if result:
                    status = result.get("status")
                    
                    if status == "granted":
                        # Авторизация успешна
                        access_token = result.get("access_token", "")
                        refresh_token = result.get("refresh_token", "")
                        user_id = result.get("user_id", "")
                        
                        redis_client.set_authorized_user(
                            chat_id, access_token, refresh_token, user_id
                        )
                        
                        results.append({
                            "chat_id": chat_id,
                            "status": "success",
                            "message": f"Вы успешно авторизованы!"
                        })
                    
                    elif status in ["denied", "expired", "not_found"]:
                        # Авторизация отклонена
                        redis_client.delete_user(chat_id)
                        results.append({
                            "chat_id": chat_id,
                            "status": "failed",
                            "message": "Авторизация отклонена или сессия истекла"
                        })
        
        return {"results": results}
    except Exception as e:
        logging.error(f"Error in check_auth_status_all: {e}")
        return {"results": []}

@app.get("/check_notifications_all")
async def check_notifications_all():
    """Обработчик циклической проверки уведомлений"""
    try:
        authorized_users = redis_client.get_all_authorized_users()
        results = []
        
        for chat_id, user_data in authorized_users.items():
            access_token = user_data.get("access_token", "")
            refresh_token = user_data.get("refresh_token", "")
            user_id = user_data.get("user_id", "")
            
            if access_token:
                # Запрос уведомлений к Main Module
                result = await call_api_with_retry(
                    chat_id, access_token, refresh_token, user_id,
                    "/api/v1/notifications", "GET"
                )
                
                if isinstance(result, dict) and "notifications" in result:
                    notifications = result.get("notifications", [])
                    if notifications:
                        results.append({
                            "chat_id": chat_id,
                            "notifications": notifications,
                            "message": "У вас новые уведомления"
                        })
                        
                        # Удаление отправленных уведомлений
                        await call_api_with_retry(
                            chat_id, access_token, refresh_token, user_id,
                            "/api/v1/notifications", "DELETE"
                        )
        
        return {"results": results}
    except Exception as e:
        logging.error(f"Error in check_notifications_all: {e}")
        return {"results": []}

@app.get("/health")
def health_check():
    return {"status": "ok", "port": 8001, "service": "bot_1"}

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    logger.info("Starting bot_1 on port 8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)