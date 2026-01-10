# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm ci --silent

# Копируем весь проект
COPY . .

# Открываем порт для разработки
EXPOSE 5173

# Команда для запуска
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]