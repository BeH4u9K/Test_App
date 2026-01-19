# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci

# Копируем все файлы проекта
COPY . .

# Собираем фронтенд
RUN npm run build

# Открываем порт сервера
EXPOSE 3007

# Запускаем сервер
CMD ["node", "server.js"]