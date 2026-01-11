import os, logging, asyncio
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher
from handlers import router

load_dotenv()


async def main():
    bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
    dp = Dispatcher()
    dp.include_router(router)
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO) #потом убрать
    asyncio.run(main())