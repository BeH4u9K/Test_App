package main

import (
	"database/sql"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
	"log"
	"main_logic/api"
	"main_logic/storage"
	"net/http"
	"os"
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

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"}, // Разрешенные origin'ы
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
		Debug:            true,
	})

	handler := c.Handler(r)

	api.RegisterRoutes(r)
	http.ListenAndServe(":8081", handler)
}
