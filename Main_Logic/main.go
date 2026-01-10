package main

import (
	"database/sql"
	"log"
	"main_logic/api"
	"main_logic/storage"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Загружаем переменные окружения
	godotenv.Load()
	dsn := os.Getenv("DATABASE_URL")

	// Запускаем БД
	var err error
	storage.DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}

	if err = storage.DB.Ping(); err != nil {
		log.Fatalf("ping db: %v", err)
	}

	// Создаём роутеры, регистрируем хендлеры, запускаем сервер
	r := mux.NewRouter()
	api.RegisterRoutes(r)
	http.ListenAndServe(":8080", r)
}
