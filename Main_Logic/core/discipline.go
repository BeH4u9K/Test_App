package core

import (
	"database/sql"
	"errors"
	"fmt"
	"main_logic/storage"
)

type Discipline struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	TeacherName string `json:"teacher_name"`
}

type DisciplineDTO struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	TeacherName string `json:"teacher_name"`
	TeacherID   int    `json:"teacher_id"`
}

type TestShort struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type StudentShort struct {
	ID       int    `json:"id"`
	FullName string `json:"full_name"`
}

func GetAllDisciplines() ([]Discipline, error) {
	query := `
        SELECT id, name, description, teacher_id
        FROM discipline
        WHERE is_deleted = FALSE
        ORDER BY id`
	rows, err := storage.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch disciplines: %v", err)
	}
	defer rows.Close()

	answer := make([]Discipline, 0)
	for rows.Next() {
		var d Discipline
		var teacherID int

		if err := rows.Scan(&d.ID, &d.Name, &d.Description, &teacherID); err != nil {
			return nil, fmt.Errorf("failed to scan discipline: %v", err)
		}

		err = storage.DB.
			QueryRow("SELECT full_name FROM users WHERE id = $1", teacherID).
			Scan(&d.TeacherName)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch teacher name: %v", err)
		}

		answer = append(answer, d)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read disciplines: %v", err)
	}

	return answer, nil
}

func GetDisciplineByID(id int) (DisciplineDTO, error) {
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, id).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return DisciplineDTO{}, fmt.Errorf("discipline with id %d not found", id)
		}
		return DisciplineDTO{}, fmt.Errorf("failed to check discipline: %v", err)
	}

	if isDeleted {
		return DisciplineDTO{}, fmt.Errorf("discipline with id %d not found", id)
	}

	query := "SELECT name, description, teacher_id FROM discipline WHERE id = $1"
	row := storage.DB.QueryRow(query, id)

	var result DisciplineDTO
	err = row.Scan(&result.Name, &result.Description, &result.TeacherID)
	if err != nil {
		return DisciplineDTO{}, fmt.Errorf("failed to scan discipline: %v", err)
	}

	teacherQuery := "SELECT full_name FROM users WHERE id = $1"
	err = storage.DB.QueryRow(teacherQuery, result.TeacherID).Scan(&result.TeacherName)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			result.TeacherName = ""
		} else {
			return DisciplineDTO{}, fmt.Errorf("failed to scan teacher: %v", err)
		}
	}

	return result, nil
}

func ChangeDiscInfo(id int, newName string, newDescription string) error {

	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, id).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("discipline with id %d not found", id)
		}
		return fmt.Errorf("failed to check discipline: %v", err)
	}

	if isDeleted {
		return fmt.Errorf("discipline with id %d not found", id)
	}

	// Обновляем только заполненные поля
	if newName != "" && newDescription != "" {
		query := "UPDATE discipline SET name = $1, description = $2 WHERE id = $3"
		_, err = storage.DB.Exec(query, newName, newDescription, id)
	} else if newName != "" {
		query := "UPDATE discipline SET name = $1 WHERE id = $2"
		_, err = storage.DB.Exec(query, newName, id)
	} else if newDescription != "" {
		query := "UPDATE discipline SET description = $1 WHERE id = $2"
		_, err = storage.DB.Exec(query, newDescription, id)
	}

	if err != nil {
		return fmt.Errorf("failed to update discipline: %v", err)
	}

	return nil
}

func GetDisciplineInfo(id int) ([]TestShort, error) {
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, id).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("discipline with id %d not found", id)
		}
		return nil, fmt.Errorf("failed to check discipline: %v", err)
	}

	if isDeleted {
		return nil, fmt.Errorf("discipline with id %d not found", id)
	}

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
			return nil, fmt.Errorf("failed to scan test: %v", err)
		}
		result = append(result, t)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read tests: %v", err)
	}

	return result, nil
}

func CheckTestState(disciplineID, testID int) (bool, error) {
	query := "SELECT is_active FROM test WHERE id = $1 AND discipline_id = $2 AND is_deleted = FALSE"

	var isActive bool
	row := storage.DB.QueryRow(query, testID, disciplineID)

	if err := row.Scan(&isActive); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, fmt.Errorf("test with id %d not found in discipline %d", testID, disciplineID)
		}
		return false, fmt.Errorf("failed to check test state: %v", err)
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
		return fmt.Errorf("failed to check affected rows: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("test with id %d not found in discipline %d", testID, disciplineID)
	}

	return nil
}

func AddTest(disciplineID int, name string) (int, error) {

	if name == "" {
		return 0, fmt.Errorf("Name can't be empty")
	}

	exists, _ := disciplineExists(disciplineID)
	if !exists {
		return 0, fmt.Errorf("discipline with id %d not found", disciplineID)
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
			return fmt.Errorf("test with id %d not found in discipline %d", testID, disciplineID)
		}
		return fmt.Errorf("failed to check test: %v", err)
	}

	if isDeleted {
		return fmt.Errorf("test with id %d already deleted", testID)
	}

	query := `UPDATE test SET is_deleted = TRUE WHERE discipline_id = $1 AND id = $2`
	_, err = storage.DB.Exec(query, disciplineID, testID)
	if err != nil {
		return fmt.Errorf("failed to delete test: %v", err)
	}

	return nil
}

func GetListStudents(disciplineID int) ([]StudentShort, error) {
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, disciplineID).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("discipline with id %d not found", disciplineID)
		}
		return nil, fmt.Errorf("failed to check discipline: %v", err)
	}

	if isDeleted {
		return nil, fmt.Errorf("discipline with id %d not found", disciplineID)
	}

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
			return nil, fmt.Errorf("failed to scan student: %v", err)
		}
		result = append(result, s)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("failed to read students: %v", err)
	}

	return result, nil
}

func AddUser(userID, disciplineID int) error {
	existsUser, err := userExists(userID)
	if err != nil {
		return fmt.Errorf("failed to check user: %v", err)
	}
	if !existsUser {
		return fmt.Errorf("user with id %d not found", userID)
	}

	existsDiscipline, err := disciplineExists(disciplineID)
	if err != nil {
		return fmt.Errorf("failed to check discipline: %v", err)
	}
	if !existsDiscipline {
		return fmt.Errorf("discipline with id %d not found", disciplineID)
	}

	var dummy int
	checkQuery := "SELECT 1 FROM user_discipline WHERE user_id = $1 AND discipline_id = $2"
	err = storage.DB.QueryRow(checkQuery, userID, disciplineID).Scan(&dummy)
	if err == nil {
		return fmt.Errorf("user with id %d already enrolled in discipline %d", userID, disciplineID)
	}

	query := `INSERT INTO user_discipline(user_id, discipline_id) VALUES ($1, $2);`
	_, err = storage.DB.Exec(query, userID, disciplineID)
	if err != nil {
		return fmt.Errorf("failed to add user to discipline: %v", err)
	}

	return nil
}

func RemoveUser(userID, disciplineID int) error {
	existsUser, err := userExists(userID)
	if err != nil {
		return fmt.Errorf("failed to check user: %v", err)
	}
	if !existsUser {
		return fmt.Errorf("user with id %d not found", userID)
	}

	var isDeleted bool
	checkDiscQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err = storage.DB.QueryRow(checkDiscQuery, disciplineID).Scan(&isDeleted)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("discipline with id %d not found", disciplineID)
		}
		return fmt.Errorf("failed to check discipline: %v", err)
	}
	if isDeleted {
		return fmt.Errorf("discipline with id %d not found", disciplineID)
	}

	query := "DELETE FROM user_discipline WHERE user_id = $1 AND discipline_id = $2"
	res, err := storage.DB.Exec(query, userID, disciplineID)
	if err != nil {
		return fmt.Errorf("failed to remove user from discipline: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check affected rows: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user with id %d not enrolled in discipline %d", userID, disciplineID)
	}

	return nil
}
func CreateDiscipline(name, description string, teacherID int) (int, error) {
	if name == "" || description == "" {
		return 0, fmt.Errorf("name or description cannot be empty")
	}

	// Проверяем, что учитель существует
	exists, err := userExists(teacherID)
	if err != nil {
		return 0, fmt.Errorf("failed to check teacher: %v", err)
	}
	if !exists {
		return 0, fmt.Errorf("teacher with id %d not found", teacherID)
	}

	// Проверяем, есть ли уже НЕудалённая дисциплина с таким именем
	var existsDiscipline bool
	checkQuery := `
        SELECT EXISTS(
            SELECT 1 FROM discipline
            WHERE name = $1 AND is_deleted = FALSE
        );
    `
	if err := storage.DB.QueryRow(checkQuery, name).Scan(&existsDiscipline); err != nil {
		return 0, fmt.Errorf("failed to check discipline name: %v", err)
	}
	if existsDiscipline {
		return 0, fmt.Errorf("discipline with name %s already exists", name)
	}

	// Создаём новую дисциплину
	var id int
	query := `
        INSERT INTO discipline (teacher_id, name, description, is_deleted)
        VALUES ($1, $2, $3, FALSE)
        RETURNING id;
    `
	if err := storage.DB.QueryRow(query, teacherID, name, description).Scan(&id); err != nil {
		return 0, fmt.Errorf("failed to create discipline: %v", err)
	}

	return id, nil
}

func DeleteDiscipline(disciplineID int) error {
	var isDeleted bool
	checkQuery := "SELECT is_deleted FROM discipline WHERE id = $1"
	err := storage.DB.QueryRow(checkQuery, disciplineID).Scan(&isDeleted)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("discipline with id %d not found", disciplineID)
		}
		return fmt.Errorf("failed to check discipline: %v", err)
	}

	if isDeleted {
		return fmt.Errorf("discipline with id %d already deleted", disciplineID)
	}

	query := "UPDATE discipline SET is_deleted = TRUE WHERE id = $1"
	_, err = storage.DB.Exec(query, disciplineID)
	if err != nil {
		return fmt.Errorf("failed to delete discipline: %v", err)
	}

	queryTest := "UPDATE test SET is_deleted = TRUE WHERE discipline_id = $1"
	_, err = storage.DB.Exec(queryTest, disciplineID)
	if err != nil {
		return fmt.Errorf("failed to delete tests: %v", err)
	}

	queryUsers := "DELETE FROM user_discipline WHERE discipline_id = $1"
	_, err = storage.DB.Exec(queryUsers, disciplineID)
	if err != nil {
		return fmt.Errorf("failed to delete relations of users and disciplines: %v", err)
	}

	return nil
}
