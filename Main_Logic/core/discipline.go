package core

import (
	"encoding/json"
	"fmt"

	"main_logic/db"
)

//
// ===== СТРУКТУРЫ ДАННЫХ =====
//

type Discipline struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type DisciplineInfo struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	TeacherID   int    `json:"teacher_id"`
}

type DisciplineUpdateResult struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	TeacherID   int    `json:"teacher_id"`
}

type TestShort struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type StudentRef struct {
	UserID int `json:"user_id"`
}

//
// ===== ФУНКЦИИ РАБОТЫ С ДИСЦИПЛИНАМИ =====
//

// Получить список дисциплин
func GetDisciplines() ([]byte, error) {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return nil, fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	rows, err := dbConn.Query("SELECT id, name, description FROM discipline")
	if err != nil {
		return nil, fmt.Errorf("Query: ошибка выполнения запроса: %v", err)
	}
	defer rows.Close()

	var disciplines []Discipline

	for rows.Next() {
		var d Discipline
		if err := rows.Scan(&d.ID, &d.Name, &d.Description); err != nil {
			return nil, fmt.Errorf("rows.Scan: ошибка чтения строки: %v", err)
		}
		disciplines = append(disciplines, d)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: ошибка при обработке результата: %v", err)
	}

	jsonData, err := json.Marshal(disciplines)
	if err != nil {
		return nil, fmt.Errorf("Marshal: ошибка преобразования в JSON: %v", err)
	}

	return jsonData, nil
}

// Получить полную информацию по дисциплине
func GetDisciplineByID(disciplineID int) ([]byte, error) {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return nil, fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	row := dbConn.QueryRow(
		`SELECT id, name, description, teacher_id
		 FROM discipline
		 WHERE id = $1`,
		disciplineID,
	)

	var d DisciplineInfo

	if err := row.Scan(&d.ID, &d.Name, &d.Description, &d.TeacherID); err != nil {
		return nil, fmt.Errorf("row.Scan: ошибка чтения результата: %v", err)
	}

	jsonData, err := json.Marshal(d)
	if err != nil {
		return nil, fmt.Errorf("Marshal: ошибка преобразования в JSON: %v", err)
	}

	return jsonData, nil
}

// Обновить название / описание дисциплины
func UpdateDiscipline(disciplineID int, name *string, description *string) ([]byte, error) {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return nil, fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	row := dbConn.QueryRow(
		`UPDATE discipline
		 SET name        = COALESCE($2, name),
		     description = COALESCE($3, description)
		 WHERE id = $1
		 RETURNING id, name, description, teacher_id`,
		disciplineID,
		name,
		description,
	)

	var d DisciplineUpdateResult

	if err := row.Scan(&d.ID, &d.Name, &d.Description, &d.TeacherID); err != nil {
		return nil, fmt.Errorf("row.Scan: ошибка чтения результата: %v", err)
	}

	jsonData, err := json.Marshal(d)
	if err != nil {
		return nil, fmt.Errorf("Marshal: ошибка преобразования в JSON: %v", err)
	}

	return jsonData, nil
}

//
// ===== Список тестов дисциплины =====
//

func GetDisciplineTests(disciplineID int) ([]byte, error) {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return nil, fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	rows, err := dbConn.Query(
		`SELECT id, name 
		 FROM test
		 WHERE discipline_id = $1 AND is_deleted = FALSE`,
		disciplineID,
	)
	if err != nil {
		return nil, fmt.Errorf("Query: ошибка выполнения запроса: %v", err)
	}
	defer rows.Close()

	var tests []TestShort

	for rows.Next() {
		var t TestShort
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, fmt.Errorf("rows.Scan: ошибка чтения строки: %v", err)
		}
		tests = append(tests, t)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: ошибка при обработке результата: %v", err)
	}

	jsonData, err := json.Marshal(tests)
	if err != nil {
		return nil, fmt.Errorf("Marshal: ошибка преобразования в JSON: %v", err)
	}

	return jsonData, nil
}

//
// ===== Проверить активность теста =====
//

func IsTestActive(disciplineID int, testID int) (bool, error) {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return false, fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	var isActive bool

	err = dbConn.QueryRow(
		`SELECT is_active 
		 FROM test 
		 WHERE id = $1 AND discipline_id = $2 AND is_deleted = FALSE`,
		testID,
		disciplineID,
	).Scan(&isActive)

	if err != nil {
		return false, fmt.Errorf("row.Scan: ошибка чтения результата: %v", err)
	}

	return isActive, nil
}

//
// ===== Активировать / деактивировать тест =====
//

func SetTestActiveState(disciplineID int, testID int, active bool) error {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	_, err = dbConn.Exec(
		`UPDATE test
		 SET is_active = $3
		 WHERE id = $1 AND discipline_id = $2 AND is_deleted = FALSE`,
		testID,
		disciplineID,
		active,
	)

	if err != nil {
		return fmt.Errorf("Exec: ошибка обновления состояния теста: %v", err)
	}

	// если тест деактивирован — отмечаем попытки завершенными
	if !active {
		_, _ = dbConn.Exec(
			`UPDATE attempt 
			 SET status = 'completed', completed_at = NOW()
			 WHERE test_id = $1 AND status = 'in_progress'`,
			testID,
		)
	}

	return nil
}

//
// ===== Добавить тест в дисциплину =====
//

func AddTestToDiscipline(disciplineID int, name string) error {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	_, err = dbConn.Exec(
		`INSERT INTO test (discipline_id, name, is_active, is_deleted)
		 VALUES ($1, $2, FALSE, FALSE)`,
		disciplineID,
		name,
	)

	if err != nil {
		return fmt.Errorf("Exec: ошибка добавления теста: %v", err)
	}

	return nil
}

//
// ===== Удалить тест (soft-delete) =====
//

func DeleteTest(testID int, disciplineID int) error {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	_, err = dbConn.Exec(
		`UPDATE test
		 SET is_deleted = TRUE, is_active = FALSE
		 WHERE id = $1 AND discipline_id = $2`,
		testID,
		disciplineID,
	)

	if err != nil {
		return fmt.Errorf("Exec: ошибка пометки теста удалённым: %v", err)
	}

	return nil
}

//
// ===== Список студентов дисциплины =====
//

func GetDisciplineStudents(disciplineID int) ([]byte, error) {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return nil, fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	rows, err := dbConn.Query(
		`SELECT user_id 
		 FROM user_discipline
		 WHERE discipline_id = $1`,
		disciplineID,
	)
	if err != nil {
		return nil, fmt.Errorf("Query: ошибка выполнения запроса: %v", err)
	}
	defer rows.Close()

	var students []StudentRef

	for rows.Next() {
		var s StudentRef
		if err := rows.Scan(&s.UserID); err != nil {
			return nil, fmt.Errorf("rows.Scan: ошибка чтения строки: %v", err)
		}
		students = append(students, s)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: ошибка при обработке результата: %v", err)
	}

	jsonData, err := json.Marshal(students)
	if err != nil {
		return nil, fmt.Errorf("Marshal: ошибка преобразования в JSON: %v", err)
	}

	return jsonData, nil
}

//
// ===== Записать студента на дисциплину =====
//

func EnrollStudent(userID int, disciplineID int) error {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	_, err = dbConn.Exec(
		`INSERT INTO user_discipline (user_id, discipline_id)
		 VALUES ($1, $2)
		 ON CONFLICT DO NOTHING`,
		userID,
		disciplineID,
	)

	if err != nil {
		return fmt.Errorf("Exec: ошибка записи студента на дисциплину: %v", err)
	}

	return nil
}

//
// ===== Отчислить студента с дисциплины =====
//

func RemoveStudent(userID int, disciplineID int) error {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	_, err = dbConn.Exec(
		`DELETE FROM user_discipline
		 WHERE user_id = $1 AND discipline_id = $2`,
		userID,
		disciplineID,
	)

	if err != nil {
		return fmt.Errorf("Exec: ошибка удаления студента с дисциплины: %v", err)
	}

	return nil
}

//
// ===== Создать дисциплину =====
//

func CreateDiscipline(name string, description string, teacherID int) (int, error) {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return 0, fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	var id int

	err = dbConn.QueryRow(
		`INSERT INTO discipline (name, description, teacher_id)
		 VALUES ($1, $2, $3)
		 RETURNING id`,
		name,
		description,
		teacherID,
	).Scan(&id)

	if err != nil {
		return 0, fmt.Errorf("Exec: ошибка создания дисциплины: %v", err)
	}

	return id, nil
}

//
// ===== Удалить дисциплину =====
//

func DeleteDiscipline(disciplineID int) error {
	dbConn, err := db.ConnectDB()
	if err != nil {
		return fmt.Errorf("ConnectDB: ошибка подключения к БД: %v", err)
	}
	defer dbConn.Close()

	_, err = dbConn.Exec(
		`UPDATE discipline
		 SET description = description, teacher_id = teacher_id
		 WHERE id = $1`,
		disciplineID,
	)

	if err != nil {
		return fmt.Errorf("Exec: ошибка пометки дисциплины удалённой: %v", err)
	}

	return nil
}
