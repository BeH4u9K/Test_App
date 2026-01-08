package core

import (
	"database/sql"
	"errors"
	"fmt"
	"main_logic/storage"
)

func CreateAttempt(userID int, testID int) (int, error) {
	// Проверяем, активен ли тест
	checkTestQuery := "SELECT is_active FROM test WHERE id = $1"
	var isTestActive bool
	if err := storage.DB.QueryRow(checkTestQuery, testID).Scan(&isTestActive); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, fmt.Errorf("Test with id %d not exists.", testID)
		}
		return 0, fmt.Errorf("Scan error: %v", err)
	}
	if !isTestActive {
		return 0, fmt.Errorf("Test with id %d is not active right now.", testID)
	}

	// Проверяем, что попытки ещё нет
	var attemptCount int
	checkAttemptQuery := "SELECT COUNT(*) FROM attempt WHERE user_id = $1 AND test_id = $2"
	if err := storage.DB.QueryRow(checkAttemptQuery, userID, testID).Scan(&attemptCount); err != nil {
		return 0, fmt.Errorf("Scan error: %v", err)
	}
	if attemptCount > 0 {
		return 0, fmt.Errorf("User with id %d already has an attempt in test with id %d", userID, testID)
	}

	// Создаём попытку
	query := `INSERT INTO attempt (user_id, test_id, status)
              VALUES ($1, $2, $3)
              RETURNING id`
	var attemptID int
	if err := storage.DB.QueryRow(query, userID, testID, "in_progress").Scan(&attemptID); err != nil {
		return 0, fmt.Errorf("Scan error: %v", err)
	}

	// Получаем все вопросы по тесту
	questionsQuery := "SELECT id FROM question WHERE test_id = $1"
	rows, err := storage.DB.Query(questionsQuery, testID)
	if err != nil {
		return 0, fmt.Errorf("Query questions error: %v", err)
	}
	defer rows.Close()

	// Для каждого вопроса создаём ответ с "не выбран" (-1)
	insertAnswerQuery := `INSERT INTO user_answer (attempt_id, question_id, answer_option_id)
                          VALUES ($1, $2, $3)`
	for rows.Next() {
		var questionID int
		if err := rows.Scan(&questionID); err != nil {
			return 0, fmt.Errorf("Scan question_id error: %v", err)
		}

		if _, err := storage.DB.Exec(insertAnswerQuery, attemptID, questionID, -1); err != nil {
			return 0, fmt.Errorf("Insert user_answer error: %v", err)
		}
	}

	if err = rows.Err(); err != nil {
		return 0, fmt.Errorf("Rows iteration error: %v", err)
	}

	return attemptID, nil
}

func UpdateAttemptAnswer(userID, testID, questionID, answerOptionID int) error {

	// Проверяем, активен ли тест
	checkTestQuery := "SELECT is_active FROM test WHERE id = $1"
	var isTestActive bool
	if err := storage.DB.QueryRow(checkTestQuery, testID).Scan(&isTestActive); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("Test with id %d not exists.", testID)
		}
		return fmt.Errorf("Scan error: %v", err)
	}
	if !isTestActive {
		return fmt.Errorf("Test with id %d is not active right now.", testID)
	}
	// Находим попытку и статус этой попытки для пользователя
	var attemptID int
	var status string
	queryAttempt := "SELECT id, status FROM attempt WHERE user_id = $1 AND test_id = $2"
	if err := storage.DB.QueryRow(queryAttempt, userID, testID).Scan(&attemptID, &status); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("attempt for user %d and test %d not exists", userID, testID)
		}
		return fmt.Errorf("Scan error: %v", err)
	}
	// Если попытка закончена, то ничего поменять не получится
	if status != "in_progress" {
		return fmt.Errorf("attempt %d is already finished with status %s", attemptID, status)
	}

	// Это запрос, который обновит вариант ответа по указанному id вопроса.
	updateQuery := `
    UPDATE user_answer
    SET answer_option_id = $1
    WHERE attempt_id = $2 AND question_id = $3
`
	res, err := storage.DB.Exec(updateQuery, answerOptionID, attemptID, questionID)
	if err != nil {
		return fmt.Errorf("Update user_answer error: %v", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("RowsAffected error: %v", err)
	}
	// Если у пользователя изначально не было никакого варианта ответа, то просто он создаться
	if rowsAffected == 0 {
		insertQuery := `
        INSERT INTO user_answer (attempt_id, question_id, answer_option_id)
        VALUES ($1, $2, $3)
    `
		if _, err := storage.DB.Exec(insertQuery, attemptID, questionID, answerOptionID); err != nil {
			return fmt.Errorf("Insert user_answer error: %v", err)
		}
	}
	return nil

}

func CompleteAttempt(attemptID int) error {
	// Находим test_id и проверяем статус попытки
	var testID int
	var status string
	if err := storage.DB.QueryRow(
		"SELECT test_id, status FROM attempt WHERE id = $1",
		attemptID,
	).Scan(&testID, &status); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("Attempt with id %d not exists.", attemptID)
		}
		return fmt.Errorf("Scan error: %v", err)
	}

	// Проверяем, что попытка ещё не закончена
	if status != "in_progress" {
		return fmt.Errorf("Attempt %d is already finished with status %s", attemptID, status)
	}

	// Считаем общее количество вопросов в тесте
	var totalQuestions int
	if err := storage.DB.QueryRow(
		"SELECT COUNT(*) FROM question WHERE test_id = $1",
		testID,
	).Scan(&totalQuestions); err != nil {
		return fmt.Errorf("Count questions error: %v", err)
	}

	if totalQuestions == 0 {
		return fmt.Errorf("Test %d has no questions", testID)
	}

	// Получаем все ответы пользователя для этой попытки
	rows, err := storage.DB.Query(
		"SELECT answer_option_id FROM user_answer WHERE attempt_id = $1",
		attemptID,
	)
	if err != nil {
		return fmt.Errorf("Query user answers error: %v", err)
	}
	defer rows.Close()

	// Проходим по каждому ответу и проверяем, правильный ли он
	var correctAnswers int
	for rows.Next() {
		var answerOptionID int
		if err := rows.Scan(&answerOptionID); err != nil {
			return fmt.Errorf("Scan answer_option_id error: %v", err)
		}

		// Проверяем, правильный ли этот вариант ответа
		var isCorrect bool
		if err := storage.DB.QueryRow(
			"SELECT is_correct FROM answer_option WHERE id = $1",
			answerOptionID,
		).Scan(&isCorrect); err != nil {
			return fmt.Errorf("QueryRow is_correct error: %v", err)
		}

		if isCorrect {
			correctAnswers++
		}
	}

	if err = rows.Err(); err != nil {
		return fmt.Errorf("Rows iteration error: %v", err)
	}

	// Вычисляем процент по формуле: (правильные / всего) * 100
	score := (correctAnswers * 100) / totalQuestions

	// Обновляем попытку: статус, баллы и время завершения
	if err := storage.DB.QueryRow(`
        UPDATE attempt 
        SET status = 'completed', score = $1, completed_at = NOW()
        WHERE id = $2
        RETURNING id
    `, score, attemptID).Scan(&attemptID); err != nil {
		return fmt.Errorf("Update attempt error: %v", err)
	}

	return nil
}

func CheckAttempt(userID, testID int) ([]QA, string, error) {

	// Сначала найдём ID попытки и статус
	var attemptID int
	var status string
	queryStatus := "SELECT id, status FROM attempt WHERE user_id = $1 AND test_id = $2"
	if err := storage.DB.QueryRow(queryStatus, userID, testID).Scan(&attemptID, &status); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, "", fmt.Errorf("Attempt for user %d and test %d not exists", userID, testID)
		}
		return nil, "", fmt.Errorf("Scan error: %v", err)
	}

	answers := make([]QA, 0)

	// Получаем все ответы пользователя по attempt_id
	query := "SELECT question_id, answer_option_id FROM user_answer WHERE attempt_id = $1"
	rows, err := storage.DB.Query(query, attemptID)
	if err != nil {
		return nil, "", fmt.Errorf("Query error: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var qa QA

		// Находим ID вопроса и ID ответа
		var questionID int
		var answerID int
		if err := rows.Scan(&questionID, &answerID); err != nil {
			return nil, "", fmt.Errorf("Scan error: %v", err)
		}

		// Находим текст вопроса и текст ответа по ID, которые найдены выше
		queryQuestion := "SELECT title FROM question WHERE id = $1"
		queryAnswer := "SELECT text FROM answer_option WHERE id = $1"

		var question string
		var answer string

		// Сканируем текст вопроса
		if err := storage.DB.QueryRow(queryQuestion, questionID).Scan(&question); err != nil {
			return nil, "", fmt.Errorf("Scan error: %v", err)
		}

		// Сканируем текст ответа
		if err := storage.DB.QueryRow(queryAnswer, answerID).Scan(&answer); err != nil {
			return nil, "", fmt.Errorf("Scan error: %v", err)
		}

		// Упаковываем найденные данные и отправляем их в результирующий слайс
		qa.QuestionText = question
		qa.AnswerText = answer
		answers = append(answers, qa)
	}

	// Проверяем остаточные ошибки
	if err := rows.Err(); err != nil {
		return nil, "", fmt.Errorf("rows Err: %v", err)
	}

	return answers, status, nil

}

func DeleteAnswer(userID, testID, questionID int) error {
	// Удаление ответа — это просто установка answer_option_id на -1
	return UpdateAttemptAnswer(userID, testID, questionID, -1)
}
