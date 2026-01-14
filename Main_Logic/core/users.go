package core

import (
	"database/sql"
	"errors"
	"fmt"
	"net/mail"

	"main_logic/storage"
)

// Структуры для возврата информации о пользователе

// UserTest содержит информацию о тесте и оценке пользователя
type UserTest struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Score int    `json:"score"`
}

// UserDiscipline содержит информацию о дисциплине и тестах в ней
type UserDiscipline struct {
	ID    int        `json:"id"`
	Name  string     `json:"name"`
	Tests []UserTest `json:"tests"`
}

// Ошибки связанные с регистрацией
var (
	ErrInvalidEmail  = fmt.Errorf("invalid email")
	ErrEmptyFullName = fmt.Errorf("empty full name")
	ErrEmailExists   = fmt.Errorf("email already exists")
)

// UserData содержит полную информацию о пользователе (курсы, тесты, оценки)
type UserData struct {
	Disciplines []UserDiscipline `json:"disciplines"`
}

// Вспомогательная ф-ция для валидации почты
func isValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

// ============================================================================

func GetFullName(id int) (string, error) {
	query := "SELECT full_name FROM users WHERE id = $1"

	var res string

	if err := storage.DB.QueryRow(query, id).Scan(&res); err != nil {
		return "", fmt.Errorf("scan error: %v", err)
	}

	return res, nil

}

func RegisterUser(email string, fullName string) (int, error) {
	if !isValidEmail(email) {
		return 0, ErrInvalidEmail
	}
	if fullName == "" {
		return 0, ErrEmptyFullName
	}

	var id int
	query := "INSERT INTO users(email, full_name) VALUES($1, $2) RETURNING id"
	err := storage.DB.QueryRow(query, email, fullName).Scan(&id)
	if err != nil {
		return 0, ErrEmailExists
	}

	return id, nil
}

// GetUserData возвращает информацию о пользователе (курсы, тесты, оценки)
func GetUserData(id int) (UserData, error) {
	var result UserData
	result.Disciplines = make([]UserDiscipline, 0)

	// 1. Собираем ID дисциплин пользователя
	userDiscID := make([]int, 0)
	rows, err := storage.DB.Query(
		"SELECT discipline_id FROM user_discipline WHERE user_id = $1",
		id,
	)
	if err != nil {
		return result, fmt.Errorf("failed to fetch user disciplines: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var discID int
		if err := rows.Scan(&discID); err != nil {
			return result, fmt.Errorf("scan error: %v", err)
		}
		userDiscID = append(userDiscID, discID)
	}
	if err := rows.Err(); err != nil {
		return result, fmt.Errorf("rows error: %v", err)
	}

	// 2. Для каждой дисциплины собираем имя и тесты
	for _, discID := range userDiscID {
		var d UserDiscipline
		d.ID = discID

		if err := storage.DB.QueryRow(
			"SELECT name FROM discipline WHERE id = $1 AND is_deleted = FALSE",
			discID,
		).Scan(&d.Name); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				continue
			}
			return result, fmt.Errorf("failed to fetch discipline name: %v", err)
		}

		testsRows, err := storage.DB.Query(
			"SELECT id, name FROM test WHERE discipline_id = $1 AND is_deleted = FALSE",
			discID,
		)
		if err != nil {
			return result, fmt.Errorf("failed to fetch tests: %v", err)
		}

		allTests := make([]UserTest, 0)

		for testsRows.Next() {
			var t UserTest
			if err := testsRows.Scan(&t.ID, &t.Name); err != nil {
				testsRows.Close()
				return result, fmt.Errorf("scan test error: %v", err)
			}

			// 3. Подтягиваем балл пользователя, если попытки нет — ставим 0
			scoreErr := storage.DB.QueryRow(
				"SELECT score FROM attempt WHERE user_id = $1 AND test_id = $2",
				id, t.ID,
			).Scan(&t.Score)

			if scoreErr != nil {
				if errors.Is(scoreErr, sql.ErrNoRows) {
					t.Score = 0
				} else {
					testsRows.Close()
					return result, fmt.Errorf("score fetch error: %v", scoreErr)
				}
			}

			allTests = append(allTests, t)
		}

		testsRows.Close()
		d.Tests = allTests
		result.Disciplines = append(result.Disciplines, d)
	}

	return result, nil
}

// GetUserRoles возвращает массив ролей пользователя
func GetUserRoles(id int) ([]string, error) {
	query := "SELECT role FROM user_role WHERE user_id = $1"
	rows, err := storage.DB.Query(query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch roles: %v", err)
	}
	result := make([]string, 0)
	defer rows.Close()

	for rows.Next() {
		var r string
		if err := rows.Scan(&r); err != nil {
			return nil, fmt.Errorf("scan role error: %v", err)
		}
		result = append(result, r)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %v", err)
	}

	return result, nil
}

// UpdateUserRoles заменяет все роли пользователя на указанные
func UpdateUserRoles(id int, roles []string) error {
	// Сначала удаляем все старые роли
	_, err := storage.DB.Exec("DELETE FROM user_role WHERE user_id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to clear old roles: %v", err)
	}

	// Затем добавляем новые роли
	for _, r := range roles {
		_, err = storage.DB.Exec(
			"INSERT INTO user_role (user_id, role) VALUES ($1, $2)",
			id, r,
		)
		if err != nil {
			return fmt.Errorf("failed to insert role %s: %v", r, err)
		}
	}

	return nil
}

// IsUserBlocked проверяет, заблокирован ли пользователь
func IsUserBlocked(id int) (bool, error) {
	var blocked bool
	query := "SELECT is_blocked FROM users WHERE id = $1"
	err := storage.DB.QueryRow(query, id).Scan(&blocked)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, fmt.Errorf("user with id %d not found", id)
		}
		return false, fmt.Errorf("database error: %v", err)
	}
	return blocked, nil
}

// ChangeBlockStatus изменяет статус блокировки пользователя
func ChangeBlockStatus(id int, blocked bool) error {
	query := "UPDATE users SET is_blocked = $1 WHERE id = $2"
	res, err := storage.DB.Exec(query, blocked, id)
	if err != nil {
		return fmt.Errorf("failed to update block status: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected error: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user with id %d does not exist", id)
	}

	return nil
}

type UserShort struct {
	ID       int    `json:"id"`
	FullName string `json:"full_name"`
}

func GetAllUsers() ([]UserShort, error) {
	query := "SELECT id, full_name FROM users WHERE is_blocked = FALSE"
	rows, err := storage.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("select users error: %v", err)
	}

	users := make([]UserShort, 0)

	for rows.Next() {
		var u UserShort
		if err := rows.Scan(&u.ID, &u.FullName); err != nil {
			return nil, fmt.Errorf("scan error: %v", err)
		}
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows Err: %v", err)
	}

	return users, nil
}

func ChangeUserName(id int, newName string) error {
	query := "UPDATE users SET full_name = $1 WHERE id = $2 AND is_blocked = FALSE"
	res, err := storage.DB.Exec(query, newName, id)
	if err != nil {
		return fmt.Errorf("change user name error: %v", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("RowsAffected error: %v", err)
	}

	if rowsAffected == 0 {
		// Проверяем, существует ли пользователь
		checkQuery := "SELECT id FROM users WHERE id = $1"
		var existingID int
		err := storage.DB.QueryRow(checkQuery, id).Scan(&existingID)

		if err == sql.ErrNoRows {
			// Пользователь не существует
			return fmt.Errorf("User with id %d not found", id)
		}

		// Пользователь существует, но заблокирован
		return fmt.Errorf("User with id %d is blocked", id)
	}

	return nil
}
