import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    BOT_TOKEN=os.getenv("TELEGRAM_BOT_TOKEN")

    REDIS_HOST=os.getenv("REDIS_HOST","localhost")
    REDIS_PORT=int(os.getenv("REDIS_PORT",6379))
    REDIS_DB=int(os.getenv("REDIS_DB",0))

    AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:8080")

config = Config()