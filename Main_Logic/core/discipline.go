package core

import (
	"database/sql"
	"errors"
	"fmt"
	"main_logic/storage"
)

type Discipline struct {
	Name        string
	Description string
	ID          int
}

// Тоже дисциплина, но уже с ID преподавателя.
type DisciplineDTO struct {
	Name        string
	Description string
	TeacherID   int
}

// Короткая информация: Название и ID
type TestShort struct {
	ID   int
	Name string
}

type StudentShort struct {
	ID       int
	FullName string
}

func GetAllDisciplines() ([]Discipline, error) {
	query := "SELECT id, name, description FROM discipline WHERE is_deleted = FALSE ORDER BY id"
	rows, err := storage.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch disciplines: %v", err)
	}
	defer rows.Close()
	answer := make([]Discipline, 0)
	for rows.Next() {
		var d Discipline
		if err := rows.Scan(&d.ID, &d.Name, &d.Description); err != nil {
			return nil, fmt.Errorf("scan discipline error: %v", err)
		}
		answer = append(answer, d)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %v", err)
	}
	return answer, nil
}

func GetDisciplineByID(id int) (DisciplineDTO, error) {
	// Сначала ищем запись по ID без учёта флага is_deleted
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, id).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Если мы здесь, значит строки с таким ID НЕТ ВООБЩЕ.
			return DisciplineDTO{}, fmt.Errorf("discipline with id %d not found", id)
		}
		// Другая ошибка
		return DisciplineDTO{}, fmt.Errorf("database check error: %v", err)
	}

	// Запись физически существует. Осталость проверить удалена она или нет
	if isDeleted {
		// Запись есть, но она помечена как удаленная.
		return DisciplineDTO{}, fmt.Errorf("discipline with id %d has been deleted", id)
	}

	// И только если запись существует И она НЕ удалена, мы запрашиваем все остальные данные.
	query := "SELECT name, description, teacher_id FROM discipline WHERE id = $1"
	row := storage.DB.QueryRow(query, id)

	var result DisciplineDTO
	if scanErr := row.Scan(&result.Name, &result.Description, &result.TeacherID); scanErr != nil {
		return DisciplineDTO{}, fmt.Errorf("database scan error: %v", scanErr)
	}

	return result, nil
}

func ChangeDiscInfo(id int, newName string, newDescription string) error {
	// Сначала проверяем статус дисциплины для точной ошибки
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, id).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("discipline with id %d not found", id)
		}
		return fmt.Errorf("discipline validation error: %v", err)
	}

	if isDeleted {
		return fmt.Errorf("discipline with id %d has been deleted", id)
	}

	// Выполняем обновление
	query := "UPDATE discipline SET name = $1, description = $2 WHERE id = $3"
	_, err = storage.DB.Exec(query, newName, newDescription, id)

	if err != nil {
		return fmt.Errorf("failed to update discipline: %v", err)
	}

	return nil
}

func GetDisciplineInfo(id int) ([]TestShort, error) {
	// Проверка существования дисциплины
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, id).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("discipline with id %d not found", id)
		}
		return nil, fmt.Errorf("discipline validation error: %v", err)
	}

	if isDeleted {
		return nil, fmt.Errorf("discipline with id %d has been deleted", id)
	}

	// Собираем тесты для найденной дисциплины
	query := "SELECT id, name FROM test WHERE discipline_id = $1 AND is_deleted = FALSE"
	rows, err := storage.DB.Query(query, id)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch tests: %v", err)
	}
	defer rows.Close()
	result := make([]TestShort, 0)
	for rows.Next() {
		var t TestShort
		if err := rows.Scan(&t.ID, &t.Name); err != nil {
			return nil, fmt.Errorf("scan test error: %v", err)
		}
		result = append(result, t)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %v", err)
	}
	return result, nil
}

func CheckTestState(disciplineID, testID int) (bool, error) {
	query := "SELECT is_active FROM test WHERE id = $1 AND discipline_id = $2 AND is_deleted = FALSE"

	var isActive bool
	row := storage.DB.QueryRow(query, testID, disciplineID)

	if err := row.Scan(&isActive); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, fmt.Errorf("test %d in discipline %d not found or deleted", testID, disciplineID)
		}
		return false, fmt.Errorf("database error: %v", err)
	}

	return isActive, nil
}

func ChangeTestState(newStatus bool, disciplineID, testID int) error {
	query := "UPDATE test SET is_active = $1 WHERE id = $2 AND discipline_id = $3 AND is_deleted = FALSE"
	res, err := storage.DB.Exec(query, newStatus, testID, disciplineID)
	if err != nil {
		return fmt.Errorf("failed to update test state: %v", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking affected rows: %v", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("test with id %d in discipline %d not found or deleted", testID, disciplineID)
	}
	return nil
}

func AddTest(disciplineID int, name string) (int, error) {
	exists, _ := disciplineExists(disciplineID)
	if !exists {
		return 0, fmt.Errorf("cannot add test: discipline with id %d not found", disciplineID)
	}

	var id int
	query := `INSERT INTO test(discipline_id, name, is_active, is_deleted)
			  VALUES ($1, $2, FALSE, FALSE) 
			  RETURNING id;`
	if err := storage.DB.QueryRow(query, disciplineID, name).Scan(&id); err != nil {
		return 0, fmt.Errorf("failed to create test: %v", err)
	}
	return id, nil
}

func DeleteTest(disciplineID int, testID int) error {
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM test WHERE id = $1 AND discipline_id = $2"
	err := storage.DB.QueryRow(checkQuery, testID, disciplineID).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("test with id %d in discipline %d not found", testID, disciplineID)
		}
		return fmt.Errorf("validation error: %v", err)
	}

	if isDeleted {
		return fmt.Errorf("test with id %d in discipline %d has been already deleted", testID, disciplineID)
	}

	query := `UPDATE test SET is_deleted = TRUE WHERE discipline_id = $1 AND id = $2`
	_, err = storage.DB.Exec(query, disciplineID, testID)
	if err != nil {
		return fmt.Errorf("failed to delete test: %v", err)
	}
	return nil
}

func GetListStudents(disciplineID int) ([]StudentShort, error) {
	// Проверка существования дисциплины
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, disciplineID).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("discipline with id %d not found", disciplineID)
		}
		return nil, fmt.Errorf("discipline validation error: %v", err)
	}

	if isDeleted {
		return nil, fmt.Errorf("discipline with id %d has been deleted", disciplineID)
	}

	// Получение списка студентов с именами
	result := make([]StudentShort, 0)
	query := `
        SELECT u.id, u.full_name 
        FROM user_discipline ud
        JOIN users u ON ud.user_id = u.id
        WHERE ud.discipline_id = $1
    `
	rows, err := storage.DB.Query(query, disciplineID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch students: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var s StudentShort
		if err := rows.Scan(&s.ID, &s.FullName); err != nil {
			return nil, fmt.Errorf("scan student error: %v", err)
		}
		result = append(result, s)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("rows error: %v", rows.Err())
	}

	return result, nil
}

func AddUser(userID, disciplineID int) error {
	existsUser, err := userExists(userID)
	if err != nil {
		return fmt.Errorf("validation error: %v", err)
	}
	if !existsUser {
		return fmt.Errorf("user with id %d does not exist", userID)
	}
	existsDiscipline, err := disciplineExists(disciplineID)
	if err != nil {
		return fmt.Errorf("validation error: %v", err)
	}
	if !existsDiscipline {
		return fmt.Errorf("discipline with id %d does not exist or deleted", disciplineID)
	}

	var dummy int
	checkQuery := "SELECT 1 FROM user_discipline WHERE user_id = $1 AND discipline_id = $2"
	err = storage.DB.QueryRow(checkQuery, userID, disciplineID).Scan(&dummy)
	if err == nil {
		return fmt.Errorf("user is already enrolled in this discipline")
	}

	query := `INSERT INTO user_discipline(user_id, discipline_id) VALUES ($1, $2);`
	_, err = storage.DB.Exec(query, userID, disciplineID)
	if err != nil {
		return fmt.Errorf("failed to enroll student: %v", err)
	}
	return nil
}

func RemoveUser(userID, disciplineID int) error {
	// Проверка пользователя
	existsUser, err := userExists(userID)
	if err != nil {
		return fmt.Errorf("user validation error: %v", err)
	}
	if !existsUser {
		return fmt.Errorf("user with id %d not found", userID)
	}

	// Умная проверка дисциплины (существует или удалена)
	var isDeleted bool
	checkDiscQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err = storage.DB.QueryRow(checkDiscQuery, disciplineID).Scan(&isDeleted)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("discipline with id %d not found", disciplineID)
		}
		return fmt.Errorf("discipline validation error: %v", err)
	}
	if isDeleted {
		return fmt.Errorf("discipline with id %d has been deleted", disciplineID)
	}

	// Удаление связи
	query := "DELETE FROM user_discipline WHERE user_id = $1 AND discipline_id = $2"
	res, err := storage.DB.Exec(query, userID, disciplineID)
	if err != nil {
		return fmt.Errorf("failed to remove user from discipline: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking affected rows: %v", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("student with id %d is not enrolled in discipline %d", userID, disciplineID)
	}
	return nil
}

func CreateDiscipline(name, description string, teacher_id int) (int, error) {
	if name == "" || description == "" {
		return 0, fmt.Errorf("Name or description can't be empty.")
	}

	exists, err := userExists(teacher_id)
	if err != nil {
		return 0, fmt.Errorf("validation error: %v", err)
	}
	if !exists {
		return 0, fmt.Errorf("failed to create discipline: teacher with id %d does not exist", teacher_id)
	}

	var id int
	query := `INSERT INTO discipline(teacher_id, name, description)
              VALUES ($1, $2, $3)
              RETURNING id;`
	row := storage.DB.QueryRow(query, teacher_id, name, description)
	if err := row.Scan(&id); err != nil {
		return 0, fmt.Errorf("failed to insert discipline: %v", err)
	}
	return id, nil
}

func DeleteDiscipline(disciplineID int) error {
	// Cуществует ли запись вообще и удалена ли она
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, disciplineID).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Такой дисциплины никогда не было
			return fmt.Errorf("discipline with id %d not found", disciplineID)
		}
		return fmt.Errorf("database check error: %v", err)
	}

	if isDeleted {
		return fmt.Errorf("discipline with id %d is already deleted", disciplineID)
	}

	// Дисциплина существует и активна. Удаляем её.
	query := "UPDATE discipline SET is_deleted = TRUE WHERE id = $1"
	_, err = storage.DB.Exec(query, disciplineID)
	if err != nil {
		return fmt.Errorf("failed to delete discipline: %v", err)
	}

	// "Выключаем" все тесты этой дисциплины

	queryTest := "UPDATE test SET is_deleted = TRUE WHERE discipline_id = $1"
	_, err = storage.DB.Exec(queryTest, disciplineID)
	if err != nil {
		// Если не удалось удалить тесты, это не критично для самой дисциплины,
		// но лучше вернуть ошибку, чтобы администратор знал.
		return fmt.Errorf("failed to cascade delete tests: %v", err)
	}

	return nil
}
