from aiogram import Bot, Dispatcher, types, Router,F
from aiogram.filters import Command
import uuid

import keyboards as kb

from redis_client import redis_client

router = Router()

@router.message()
async def unknown_cmd_login(message: types.Message):
    if message.text.startswith('/'):
        if message.text.startswith('/login'):
            parts = message.text.split()
            if len(parts) == 1:
                await message.answer('Выберите способ авторизации',reply_markup=kb.main)
            else:
                # С параметром type
                auth_type = parts[1]
                chat_id = message.chat.id
                
                # Генерируем новый токен входа
                login_token = str(uuid.uuid4())
                
                # Делаем запрос Redis чтобы запомнить chat_id как ключ
                # со статусом "Анонимный" и токеном
                redis_client.set_login_data(chat_id, login_token)

                await message.answer(f"Тип авторизации: {auth_type}")
        else:
            await message.answer("Нет такой команды")
    else:
            await message.answer("Нет такой команды")
