FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Используем npm install вместо npm ci (более гибко)
RUN npm install --no-optional --legacy-peer-deps

# Копируем весь проект
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]