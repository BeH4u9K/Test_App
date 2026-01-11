import uvicorn,os
from fastapi import FastAPI, Request
from handlers import router as handlers_router
from aiogram import Bot, Dispatcher

app = FastAPI()
bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
dp = Dispatcher()
dp.include_router(handlers_router)

@app.post("/process")
async def process_message(request: Request):
    data = await request.json()
    return {"response": "Обработано инстансом 1"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)