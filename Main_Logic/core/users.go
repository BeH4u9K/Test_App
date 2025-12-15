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

	db, err := db.ConnectDB()
	if err != nil {
		return nil, fmt.Errorf("ConnectDB: ошибка подключения к БД: %w", err)
	}
	defer db.Close()

	// Выполняем запрос
	rows, err := db.Query("SELECT id, full_name FROM users")
	if err != nil {
		return nil, fmt.Errorf("Query: ошибка выполнения запроса: %w", err)
	}
	defer rows.Close()

	// Собираем всех юзеров в один слайс
	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.FullName); err != nil {
			return nil, fmt.Errorf("rows.Scan: ошибка чтения строки: %w", err)
		}
		users = append(users, user)
	}

	// Проверка ошибок после итерации
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: ошибка при обработке результата: %w", err)
	}

	// Преобразуем в JSON
	jsonData, err := json.Marshal(users)
	if err != nil {
		return nil, fmt.Errorf("Marshal: ошибка преобразования в JSON: %w", err)
	}

	return jsonData, nil
}

func GetUserById(ID int) (string, error) {
	db, err := db.ConnectDB()
	if err != nil {
		return "", fmt.Errorf("ConnectDB: ошибка подключения к БД: %w", err)
	}
	defer db.Close()

	rows, err := db.Query(fmt.Sprintf("SELECT full_name FROM users WHERE id = %d", ID))
	if err != nil {
		return "", fmt.Errorf("Query: ошибка при получении строк")
	}
	rows.Next()
	var answer string
	if err := rows.Scan(&answer); err != nil {
		return "", fmt.Errorf("rows.Scan: ошибка чтения строки: %w", err)
	}
	return answer, nil

}
