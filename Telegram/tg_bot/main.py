import os
import logging
import asyncio
import aiohttp
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command

load_dotenv()

NGINX_URL = "http://nginx:80"

bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
dp = Dispatcher()

async def forward_to_nginx(message: types.Message):
    """Перенаправляет сообщение в Nginx -> Bot Logic"""
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
                    
                    # Отправляем ответ пользователю
                    if result.get("response"):
                        await message.answer(result["response"])
                        
    except Exception as e:
        logging.error(f"Ошибка при отправке в nginx: {e}")
        await message.answer("Ошибка сервера, попробуйте позже")

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer("Отправьте любое сообщение.")

@dp.message()
async def handle_all_messages(message: types.Message):
    """Обработка всех сообщений через nginx"""
    await forward_to_nginx(message)

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())