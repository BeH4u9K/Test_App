docker-compose up -d --build перезалить контеинер 
# Сборка образа


docker build -t vite-react-app .

# Запуск контейнера
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules --name my-vite-app vite-react-app

# Собрать и запустить
docker-compose up --build

# Или в фоновом режиме
docker-compose up -d --build

# Остановить
docker-compose down

# Просмотр логов
docker-compose logs -f

redis-server  