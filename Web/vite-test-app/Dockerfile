# Фаза сборки React приложения
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Фаза продакшн с NGINX
FROM nginx:alpine

# Копируем собранное приложение из фазы builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомную конфигурацию NGINX
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем NGINX
CMD ["nginx", "-g", "daemon off;"]