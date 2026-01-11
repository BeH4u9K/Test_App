import os, logging, asyncio
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher,types
from handlers import router

load_dotenv()

NGINX_URL = "http://localhost:8080"

async def forward_to_nginx(message: types.Message):
    """Перенаправляет сообщение в Nginx -> Bot Logic"""
    async with aiohttp.ClientSession() as session:
        payload = {
            "chat_id": message.chat.id,
            "text": message.text,
            "username": message.from_user.username,
            "first_name": message.from_user.first_name
        }
        
        response = await session.post(f"{NGINX_URL}/handle", json=payload)
        result = await response.json()
        await message.answer(result.get("response", ""))

async def main():
    bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
    dp = Dispatcher()
    dp.message()
    async def handle_all_messages(message: types.Message):
        await forward_to_nginx(message)
    dp.include_router(router)
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO) #потом убрать
    asyncio.run(main())