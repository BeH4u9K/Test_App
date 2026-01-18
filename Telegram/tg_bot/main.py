import os
import asyncio
import aiohttp
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command

load_dotenv()

NGINX_URL = "http://nginx:80"
CHECK_INTERVAL = 30  # секунды

bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
dp = Dispatcher()

async def forward_to_nginx(message: types.Message):
    #Перенаправляет сообщение в Nginx -> Bot Logic
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "chat_id": message.chat.id,
                "text": message.text,
                "username": message.from_user.username,
                "first_name": message.from_user.first_name
            }
            
            async with session.post(
                    f"{NGINX_URL}/handle", 
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    result = await response.json()
                    
                    if result.get("response"):
                        await message.answer(result["response"])
                        
    except Exception:
        await message.answer("Ошибка сервера, попробуйте позже")

async def check_auth_status_all():
    #ЦИКЛИЧЕСКИЙ ЗАПРОС: проверка статуса всех анонимных пользователей
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{NGINX_URL}/check_auth_status_all",
                timeout=60
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    results = result.get("results", [])
                    
                    # Отправляем результаты пользователям
                    for user_result in results:
                        chat_id = user_result.get("chat_id")
                        status = user_result.get("status")
                        message_text = user_result.get("message")
                        
                        if chat_id and message_text and status in ["success", "failed"]:
                            try:
                                await bot.send_message(chat_id=chat_id, text=message_text)
                            except Exception:
                                pass  # Пользователь мог заблокировать бота
                    
                    return results
                else:
                    return []
    except Exception:
        return []


#уведомлений всех авторизованных пользователей
async def check_notifications_all():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{NGINX_URL}/check_notifications_all",
                timeout=60
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    results = result.get("results", [])
                    
                    # Отправляем уведомления пользователям
                    for user_result in results:
                        chat_id = user_result.get("chat_id")
                        notifications = user_result.get("notifications", [])
                        message_text = user_result.get("message")
                        
                        if chat_id and notifications:
                            full_message = f"{message_text}:\n\n"
                            for i, notification in enumerate(notifications, 1):
                                full_message += f"{i}. {notification}\n"
                            
                            try:
                                await bot.send_message(chat_id=chat_id, text=full_message)
                            except Exception:
                                pass  # Пользователь мог заблокировать бота
                        elif chat_id and message_text:
                            try:
                                await bot.send_message(chat_id=chat_id, text=message_text)
                            except Exception:
                                pass
                    
                    return results
                else:
                    return []
    except Exception:
        return []

async def periodic_check():
    """Фоновая задача для циклических проверок"""
    while True:
        try:
            # Проверяем статус анонимных пользователей
            await check_auth_status_all()
            
            # Проверяем уведомления авторизованных пользователей
            await check_notifications_all()
            
        except Exception:
            pass  # Игнорируем ошибки в фоновой задаче
        
        await asyncio.sleep(CHECK_INTERVAL)

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer("Отправьте любое сообщение.")

@dp.message()
async def handle_all_messages(message: types.Message):
    """Обработка всех сообщений через nginx"""
    await forward_to_nginx(message)

async def main():
    """Главная функция"""
    
    # Запускаем циклические проверки в фоне
    periodic_task = asyncio.create_task(periodic_check())
    
    try:
        # Запускаем бота для обработки сообщений пользователей
        await dp.start_polling(bot)
    finally:
        # Отменяем фоновую задачу при завершении
        periodic_task.cancel()
        try:
            await periodic_task
        except asyncio.CancelledError:
            pass

if __name__ == "__main__":
    asyncio.run(main())