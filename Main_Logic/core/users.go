package core

import (
	"database/sql"
	"errors"
	"fmt"

	"main_logic/storage"
)

// Структуры для возврата информации о пользователе

// UserTest содержит информацию о тесте и оценке пользователя
type UserTest struct {
	ID    int
	Name  string
	Score int
}

// UserDiscipline содержит информацию о дисциплине и тестах в ней
type UserDiscipline struct {
	ID    int
	Name  string
	Tests []UserTest
}

// UserData содержит полную информацию о пользователе (курсы, тесты, оценки)
type UserData struct {
	Disciplines []UserDiscipline
}

// ============================================================================

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
		return result, fmt.Errorf("Query error: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var discID int
		if err := rows.Scan(&discID); err != nil {
			return result, fmt.Errorf("Scan error: %v", err)
		}
		userDiscID = append(userDiscID, discID)
	}
	if err := rows.Err(); err != nil {
		return result, fmt.Errorf("rows.Err: %v", err)
	}

	// 2. Для каждой дисциплины собираем имя и тесты
	for _, discID := range userDiscID {
		var d UserDiscipline
		d.ID = discID

		if err := storage.DB.QueryRow(
			"SELECT name FROM discipline WHERE id = $1",
			discID,
		).Scan(&d.Name); err != nil {
			return result, fmt.Errorf("Query error: %v", err)
		}

		testsRows, err := storage.DB.Query(
			"SELECT id, name FROM test WHERE discipline_id = $1",
			discID,
		)
		if err != nil {
			return result, fmt.Errorf("Query error: %v", err)
		}

		allTests := make([]UserTest, 0)

		for testsRows.Next() {
			var t UserTest
			if err := testsRows.Scan(&t.ID, &t.Name); err != nil {
				testsRows.Close()
				return result, fmt.Errorf("Scan error: %v", err)
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
					return result, fmt.Errorf("Scan error: %v", scoreErr)
				}
			}

			allTests = append(allTests, t)
		}

		if err := testsRows.Err(); err != nil {
			testsRows.Close()
			return result, fmt.Errorf("rows.Err: %v", err)
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
		return nil, fmt.Errorf("Query error: %v", err)
	}
	result := make([]string, 0)
	defer rows.Close()

	for rows.Next() {
		var r string
		if err := rows.Scan(&r); err != nil {
			return nil, fmt.Errorf("Scan error: %v", err)
		}
		result = append(result, r)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: %v", err)
	}

	return result, nil
}

// UpdateUserRoles заменяет все роли пользователя на указанные
func UpdateUserRoles(id int, roles []string) error {
	// Сначала удаляем все старые роли
	_, err := storage.DB.Exec("DELETE FROM user_role WHERE user_id = $1", id)
	if err != nil {
		return fmt.Errorf("Exec error: %v", err)
	}

	// Затем добавляем новые роли
	for _, r := range roles {
		_, err = storage.DB.Exec(
			"INSERT INTO user_role (user_id, role) VALUES ($1, $2)",
			id, r,
		)
		if err != nil {
			return fmt.Errorf("Exec error: %v", err)
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
			return false, fmt.Errorf("User not found: %v", err)
		}
		return false, fmt.Errorf("Scan error: %v", err)
	}
	return blocked, nil
}

// ChangeBlockStatus изменяет статус блокировки пользователя
func ChangeBlockStatus(id int, blocked bool) error {
	query := "UPDATE users SET is_blocked = $1 WHERE id = $2"
	res, err := storage.DB.Exec(query, blocked, id)
	if err != nil {
		return fmt.Errorf("Exec error: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("RowsAffected error: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("User not found: %v", fmt.Errorf("user with id %d does not exist", id))
	}

	return nil
}
