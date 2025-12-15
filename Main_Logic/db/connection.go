package db

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func ConnectDB() (*sql.DB, error) {
	envPath := "C:/Users/shaht/Desktop/Test_App/Main_Logic/.env"

	// Загружаем переменные окружения
	if err := godotenv.Load(envPath); err != nil {
		return nil, fmt.Errorf("ошибка загрузки .env файла: %v", err)
	}

	// Формируем строку подключения
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_SSLMODE"),
	)

	// Подключаемся к БД
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("ошибка подключения к БД: %v", err)
	}

	// Проверяем подключение
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("ошибка проверки подключения: %v", err)
	}

	return db, nil
}
