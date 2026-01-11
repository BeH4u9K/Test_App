from aiogram.types import ReplyKeyboardMarkup, KeyboardButton

main = ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text='/login github')],
                                     [KeyboardButton(text='/login yandex')],
                                     [KeyboardButton(text='/login code')]],
                                     resize_keyboard=True,
                                     input_field_placeholder='Выберите пункт меню')

