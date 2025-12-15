package core

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"main_logic/db"
	"sort"

	_ "github.com/lib/pq"
)

type User struct {
	ID       int    `json:"id"`
	FullName string `json:"full_name"`
}

// Получение всех пользователей
func GetUsers() ([]byte, error) {
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
			return nil, fmt.Errorf("rows.Scan: ошибка чтения строки: %v", err)
		}
		users = append(users, user)
	}

	// Проверка ошибок после итерации
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: ошибка при обработке результата: %v", err)
	}

	// Преобразуем в JSON
	jsonData, err := json.Marshal(users)
	if err != nil {
		return nil, fmt.Errorf("Marshal: ошибка преобразования в JSON: %v", err)
	}

	return jsonData, nil
}

func GetUserById(ID int) (string, error) {
	db, err := db.ConnectDB()
	if err != nil {
		return "", fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer db.Close()

	query := "SELECT full_name FROM users WHERE id = $1"
	row := db.QueryRow(query, ID)

	var answer string
	if err := row.Scan(&answer); err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("пользователь с id %d не найден", ID)
		}
		return "", fmt.Errorf("row.Scan: ошибка чтения строки: %v", err)
	}

	return answer, nil
}

// сменяет имя
func ChangeUserName(ID int, NewName string) error {
	db, err := db.ConnectDB()
	if err != nil {
		return fmt.Errorf("ConnectDB: %v", err)
	}
	defer db.Close()

	QueryRequest := "UPDATE users SET full_name = $1 WHERE id = $2"
	result, err := db.Exec(QueryRequest, NewName, ID)

	if err != nil {
		return fmt.Errorf("Query: ошибка выполнения запроса: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("RowsAffected %v: ", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("Пользователь с ID %d не найден", ID)
	}
	return nil
}

func GetUserData(ID int) ([]byte, error) {
	db, err := db.ConnectDB()
	if err != nil {
		return nil, fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer db.Close()

	query := `
		SELECT 
			d.id AS discipline_id,
			d.name AS discipline_name,
			d.description AS discipline_description,
			t.id AS test_id,
			t.name AS test_name,
			t.is_active AS test_is_active,
			t.version AS test_version,
			a.score AS attempt_score,
			a.status AS attempt_status,
			TO_CHAR(a.started_at, 'HH24:MI') AS started_at,
			TO_CHAR(a.completed_at, 'HH24:MI') AS completed_at
		FROM user_discipline ud
		JOIN discipline d ON ud.discipline_id = d.id
		JOIN test t ON t.discipline_id = d.id 
			AND t.is_active = TRUE 
			AND t.is_deleted = FALSE
		LEFT JOIN attempt a ON a.test_id = t.id 
			AND a.user_id = ud.user_id
			AND a.status = 'completed'
		WHERE ud.user_id = $1
			AND EXISTS (
				SELECT 1 FROM test t2 
				WHERE t2.discipline_id = d.id 
				AND t2.is_active = TRUE 
				AND t2.is_deleted = FALSE
			)
		ORDER BY d.name, t.id
	`

	rows, err := db.Query(query, ID)
	if err != nil {
		return nil, fmt.Errorf("Query: ошибка при получении данных: %v", err)
	}
	defer rows.Close()

	type TestData struct {
		ID          int     `json:"id"`
		Name        string  `json:"name"`
		IsActive    bool    `json:"is_active"`
		Version     int     `json:"version"`
		Score       *int    `json:"score"`
		Status      *string `json:"status"`
		StartedAt   *string `json:"started_at"`
		CompletedAt *string `json:"completed_at"`
	}

	type DisciplineData struct {
		ID          int        `json:"id"`
		Name        string     `json:"name"`
		Description string     `json:"description"`
		Tests       []TestData `json:"tests"`
	}

	disciplinesMap := make(map[int]*DisciplineData)

	for rows.Next() {
		var (
			disciplineID          int
			disciplineName        string
			disciplineDescription string
			testID                int
			testName              string
			testIsActive          bool
			testVersion           int
			attemptScore          *int
			attemptStatus         *string
			startedAt             *string
			completedAt           *string
		)

		err := rows.Scan(
			&disciplineID,
			&disciplineName,
			&disciplineDescription,
			&testID,
			&testName,
			&testIsActive,
			&testVersion,
			&attemptScore,
			&attemptStatus,
			&startedAt,
			&completedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("rows.Scan: ошибка чтения строки: %v", err)
		}

		disc, exists := disciplinesMap[disciplineID]
		if !exists {
			disc = &DisciplineData{
				ID:          disciplineID,
				Name:        disciplineName,
				Description: disciplineDescription,
				Tests:       []TestData{},
			}
			disciplinesMap[disciplineID] = disc
		}

		test := TestData{
			ID:          testID,
			Name:        testName,
			IsActive:    testIsActive,
			Version:     testVersion,
			Score:       attemptScore,
			Status:      attemptStatus,
			StartedAt:   startedAt,
			CompletedAt: completedAt,
		}

		disc.Tests = append(disc.Tests, test)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: ошибка при обработке результатов: %v", err)
	}

	if len(disciplinesMap) == 0 {
		return []byte("[]"), nil
	}

	disciplines := make([]DisciplineData, 0, len(disciplinesMap))
	for _, disc := range disciplinesMap {
		disciplines = append(disciplines, *disc)
	}

	sort.Slice(disciplines, func(i, j int) bool {
		return disciplines[i].Name < disciplines[j].Name
	})

	jsonData, err := json.Marshal(disciplines)
	if err != nil {
		return nil, fmt.Errorf("json.Marshal: ошибка при формировании JSON: %v", err)
	}

	return jsonData, nil
}
