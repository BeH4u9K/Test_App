package core

import (
	"database/sql"
	"fmt"
	"main_logic/storage"
)

// Структуры
type AttemptShort struct {
	UserID int `json:"user_id"`
	Mark   int `json:"mark"`
}

type UserAnswer struct {
	UserID  int
	Answers []QA
}

type QA struct {
	QuestionText string
	AnswerText   string
}

// Функции

// Удалить вопрос из теста (мягкое удаление). Удаление идёт по корню, то есть все версии автоматически отпадут
func RemoveQuestionFromTest(
	disciplineID int,
	testID int,
	questionRootID int,
) error {
	// Валидация входных параметров
	if disciplineID <= 0 || testID <= 0 || questionRootID <= 0 {
		return fmt.Errorf("invalid parameters: disciplineID, testID, and questionRootID must be positive")
	}

	// Проверяем принадлежность теста дисциплине и активность теста
	var isActive bool
	err := storage.DB.QueryRow(`
        SELECT t.is_active
        FROM test t
        WHERE t.id = $1
        AND t.discipline_id = $2
        AND t.is_deleted = false
    `, testID, disciplineID).Scan(&isActive)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf(
				"test with id %d not found in discipline %d",
				testID, disciplineID,
			)
		}
		return fmt.Errorf("failed to fetch test: %v", err)
	}

	// Проверяем, активен ли тест
	if isActive {
		return fmt.Errorf(
			"cannot remove question %d from active test %d",
			questionRootID, testID,
		)
	}

	// Удаляем все версии вопроса (soft delete по root_id)
	res, err := storage.DB.Exec(`
        UPDATE question
        SET is_deleted = true
        WHERE root_id = $1
        AND test_id = $2
    `, questionRootID, testID)

	if err != nil {
		return fmt.Errorf("failed to remove question: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf(
			"question with root_id %d in test %d of discipline %d not found or already deleted",
			questionRootID, testID, disciplineID,
		)
	}

	return nil
}

// Функция "привязывает" тест к вопросу
func AddQuestionToTest(
	disciplineID int,
	testID int,
	questionRootID int,
) error {
	// Валидация входных параметров
	if disciplineID <= 0 || testID <= 0 || questionRootID <= 0 {
		return fmt.Errorf("invalid parameters: disciplineID, testID, and questionRootID must be positive")
	}

	// Проверяем принадлежность теста дисциплине
	var testExists bool
	err := storage.DB.QueryRow(`
        SELECT EXISTS(
            SELECT 1 FROM test t
            WHERE t.id = $1
            AND t.discipline_id = $2
            AND t.is_deleted = false
        )
    `, testID, disciplineID).Scan(&testExists)

	if err != nil {
		return fmt.Errorf("failed to fetch test: %v", err)
	}

	if !testExists {
		return fmt.Errorf(
			"test with id %d not found in discipline %d",
			testID, disciplineID,
		)
	}

	// Проверяем наличие попыток прохождения теста
	has, err := hasAttempts(testID)
	if err != nil {
		return fmt.Errorf("error checking attempts: %v", err)
	}

	if has {
		return fmt.Errorf(
			"test with id %d in discipline %d has attempts, cannot add more questions",
			testID, disciplineID,
		)
	}

	// Добавляем вопрос к тесту (обновляем test_id для всех версий вопроса)
	res, err := storage.DB.Exec(`
        UPDATE question
        SET test_id = $1
        WHERE root_id = $2
        AND is_deleted = false
    `, testID, questionRootID)

	if err != nil {
		return fmt.Errorf("failed to add question: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf(
			"question with root_id %d not found in discipline %d or test %d",
			questionRootID, disciplineID, testID,
		)
	}

	return nil
}

// Функция возвращает всех, кто прошёл тест.
func GetTestPassers(disciplineID int, testID int) ([]int, error) {
	// Валидация входных параметров
	if disciplineID <= 0 || testID <= 0 {
		return nil, fmt.Errorf("invalid parameters: disciplineID and testID must be positive")
	}

	// Проверяем принадлежность теста дисциплине
	var testExists bool
	err := storage.DB.QueryRow(`
        SELECT EXISTS(
            SELECT 1 FROM test t
            WHERE t.id = $1
            AND t.discipline_id = $2
            AND t.is_deleted = false
        )
    `, testID, disciplineID).Scan(&testExists)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch test: %v", err)
	}

	if !testExists {
		return nil, fmt.Errorf(
			"test with id %d not found in discipline %d",
			testID, disciplineID,
		)
	}

	// Проверяем наличие попыток прохождения теста
	has, err := hasAttempts(testID)
	if err != nil {
		return nil, fmt.Errorf("error checking attempts: %v", err)
	}

	if !has {
		return nil, fmt.Errorf(
			"no attempts found for test %d in discipline %d",
			testID, disciplineID,
		)
	}

	// Получаем список пользователей, завершивших тест
	users := make([]int, 0)
	query := `
        SELECT user_id
        FROM attempt
        WHERE test_id = $1
        AND status = $2
    `
	rows, err := storage.DB.Query(query, testID, "completed")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch passers: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var userID int
		if err := rows.Scan(&userID); err != nil {
			return nil, fmt.Errorf("scan error: %v", err)
		}
		users = append(users, userID)
	}

	// Проверяем ошибки итерации
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %v", err)
	}

	return users, nil
}

// Функция возвращает ID и оценки тех пользователей, которые прошли тест.
func GetUserMarks(disciplineID int, testID int) ([]AttemptShort, error) {
	// Валидация входных параметров
	if disciplineID <= 0 || testID <= 0 {
		return nil, fmt.Errorf("invalid parameters: disciplineID and testID must be positive")
	}

	// Проверяем принадлежность теста дисциплине
	var testExists bool
	err := storage.DB.QueryRow(`
        SELECT EXISTS(
            SELECT 1 FROM test t
            WHERE t.id = $1
            AND t.discipline_id = $2
            AND t.is_deleted = false
        )
    `, testID, disciplineID).Scan(&testExists)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch test: %v", err)
	}

	if !testExists {
		return nil, fmt.Errorf(
			"test with id %d not found in discipline %d",
			testID, disciplineID,
		)
	}

	// Проверяем наличие попыток прохождения теста
	has, err := hasAttempts(testID)
	if err != nil {
		return nil, fmt.Errorf("error checking attempts: %v", err)
	}

	if !has {
		return nil, fmt.Errorf(
			"no attempts found for test %d in discipline %d",
			testID, disciplineID,
		)
	}

	// Получаем оценки пользователей
	result := make([]AttemptShort, 0)
	query := `
        SELECT user_id, score
        FROM attempt
        WHERE test_id = $1
        AND status = 'completed'
    `
	rows, err := storage.DB.Query(query, testID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch marks: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var a AttemptShort
		if err := rows.Scan(&a.UserID, &a.Mark); err != nil {
			return nil, fmt.Errorf("scan error: %v", err)
		}
		result = append(result, a)
	}

	// Проверяем ошибки итерации
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %v", err)
	}

	return result, nil
}

// Функция принимает на вход ID теста и возвращает все попытки пользователей, включая их ответы на вопросы.
func CheckUserAnswers(
	disciplineID int,
	testID int,
) ([]UserAnswer, error) {
	// Валидация входных параметров
	if disciplineID <= 0 || testID <= 0 {
		return nil, fmt.Errorf("invalid parameters: disciplineID and testID must be positive")
	}

	// Проверяем принадлежность теста дисциплине
	var testExists bool
	err := storage.DB.QueryRow(`
        SELECT EXISTS(
            SELECT 1 FROM test t
            WHERE t.id = $1
            AND t.discipline_id = $2
            AND t.is_deleted = false
        )
    `, testID, disciplineID).Scan(&testExists)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch test: %v", err)
	}

	if !testExists {
		return nil, fmt.Errorf(
			"test with id %d not found in discipline %d",
			testID, disciplineID,
		)
	}

	// Проверка были ли попытки у теста
	has, err := hasAttempts(testID)
	if err != nil {
		return nil, fmt.Errorf("error checking attempts: %v", err)
	}

	if !has {
		return nil, fmt.Errorf(
			"test with id %d in discipline %d has no attempts",
			testID, disciplineID,
		)
	}

	// Собираем всех пользователей, которые прошли тест
	result := make([]UserAnswer, 0)

	// Получим ID пользователей, которые прошли тест
	userIds := make([]int, 0)

	queryUsers := `
        SELECT user_id
        FROM attempt
        WHERE test_id = $1
        AND status = 'completed'
    `
	rows, err := storage.DB.Query(queryUsers, testID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch users: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var userID int
		if err := rows.Scan(&userID); err != nil {
			return nil, fmt.Errorf("scan user error: %v", err)
		}
		userIds = append(userIds, userID)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating users: %v", err)
	}

	// Теперь находим ответы пользователя по его ID
	for _, userID := range userIds {
		var u UserAnswer
		u.UserID = userID
		answers := make([]QA, 0)

		// 1. Находим attempt_id
		var attemptID int
		queryAttempt := `
            SELECT id
            FROM attempt
            WHERE test_id = $1
            AND user_id = $2
            AND status = 'completed'
        `
		err := storage.DB.QueryRow(queryAttempt, testID, userID).Scan(&attemptID)
		if err != nil {
			// Пропускаем пользователя, если не найдена попытка
			continue
		}

		// 2. Находим все user_answer по этому attempt_id
		queryAnswers := `
            SELECT question_id, answer_option_id
            FROM user_answer
            WHERE attempt_id = $1
        `
		rowsAnswers, err := storage.DB.Query(queryAnswers, attemptID)
		if err != nil {
			continue
		}

		// 3. Для каждой пары берём текст вопроса и ответа
		for rowsAnswers.Next() {
			var questionID, answerOptionID int
			if err := rowsAnswers.Scan(&questionID, &answerOptionID); err != nil {
				continue
			}

			var questionText string
			queryQuestion := "SELECT text FROM question WHERE id = $1"
			err := storage.DB.QueryRow(queryQuestion, questionID).Scan(&questionText)
			if err != nil {
				questionText = "Unknown/Empty"
			}

			var answerText string
			queryAnswer := "SELECT text FROM answer_option WHERE id = $1"
			err = storage.DB.QueryRow(queryAnswer, answerOptionID).Scan(&answerText)
			if err != nil {
				answerText = "Unknown/Empty"
			}

			answers = append(answers, QA{
				QuestionText: questionText,
				AnswerText:   answerText,
			})
		}

		if err = rowsAnswers.Err(); err != nil {
			continue
		}

		rowsAnswers.Close()

		u.Answers = answers
		result = append(result, u)
	}

	return result, nil
}

func GetTest(disciplineID, testID int) (TestShort, error) {
	query := "SELECT id, name FROM test WHERE discipline_id = $1 AND id = $2"

	var t TestShort

	res := storage.DB.QueryRow(query, disciplineID, testID)
	if err := res.Scan(&t.ID, &t.Name); err != nil {
		return TestShort{}, fmt.Errorf("scan errror: %v", err)
	}

	return t, nil
}
