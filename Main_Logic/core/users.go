package core

import (
	"encoding/json"
	"fmt"
	"main_logic/db"

	_ "github.com/lib/pq"
)

type User struct {
	ID       int    `json:"id"`
	FullName string `json:"full_name"`
}

func GetUsers() ([]byte, error) {
	// Подключаемся к БД
	db, err := db.ConnectDB()
	if err != nil {
		return nil, fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer db.Close()

	// Выполняем запрос
	rows, err := db.Query("SELECT id, full_name FROM users")
	if err != nil {
		return nil, fmt.Errorf("Query: ошибка выполнения запроса: %v", err)
	}
	defer rows.Close()

	// Собираем всех юзеров в один слайс
	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.FullName); err != nil {
			return nil, fmt.Errorf("ошибка чтения строки: %v", err)
		}
		users = append(users, user)
	}

	// Проверка ошибок после итерации
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ошибка при обработке результата: %v", err)
	}

	// Преобразуем в JSON
	jsonData, err := json.Marshal(users)
	if err != nil {
		return nil, fmt.Errorf("ошибка преобразования в JSON: %v", err)
	}

	return jsonData, nil
}
