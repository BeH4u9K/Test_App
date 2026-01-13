package core

import (
	"database/sql"
	"errors"
	"fmt"
	"main_logic/storage"
)

func CreateAttempt(userID int, testID int) (int, error) {
	var isTestActive bool
	var disciplineID int
	queryTest := "SELECT is_active, discipline_id FROM test WHERE id = $1 AND is_deleted = FALSE"
	if err := storage.DB.QueryRow(queryTest, testID).Scan(&isTestActive, &disciplineID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, fmt.Errorf("test with id %d not exists or deleted", testID)
		}
		return 0, fmt.Errorf("database query error: %v", err)
	}
	if !isTestActive {
		return 0, fmt.Errorf("test with id %d is not active right now", testID)
	}

	var dummy int
	checkEnroll := "SELECT 1 FROM user_discipline WHERE user_id = $1 AND discipline_id = $2"
	if err := storage.DB.QueryRow(checkEnroll, userID, disciplineID).Scan(&dummy); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, fmt.Errorf("user is not enrolled in this discipline")
		}
		return 0, fmt.Errorf("database validation error: %v", err)
	}

	var attemptCount int
	checkAttemptQuery := "SELECT COUNT(*) FROM attempt WHERE user_id = $1 AND test_id = $2"
	if err := storage.DB.QueryRow(checkAttemptQuery, userID, testID).Scan(&attemptCount); err != nil {
		return 0, fmt.Errorf("failed to count attempts: %v", err)
	}
	if attemptCount > 0 {
		return 0, fmt.Errorf("user with id %d already has an attempt in test with id %d", userID, testID)
	}

	query := `INSERT INTO attempt (user_id, test_id, status) VALUES ($1, $2, 'in_progress') RETURNING id`
	var attemptID int
	if err := storage.DB.QueryRow(query, userID, testID).Scan(&attemptID); err != nil {
		return 0, fmt.Errorf("failed to start attempt: %v", err)
	}

	questionsQuery := "SELECT id FROM question WHERE test_id = $1 AND is_deleted = FALSE"
	rows, err := storage.DB.Query(questionsQuery, testID)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch questions for attempt: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var questionID int
		if err := rows.Scan(&questionID); err != nil {
			return 0, fmt.Errorf("scan error: %v", err)
		}
		_, _ = storage.DB.Exec("INSERT INTO user_answer (attempt_id, question_id, answer_option_id) VALUES ($1, $2, -1)", attemptID, questionID)
	}

	return attemptID, nil
}

func CompleteAttempt(userID, attemptID int) error {
	var testID int
	var status string
	// Проверяем, что попытка принадлежит userID
	err := storage.DB.QueryRow(
		"SELECT test_id, status FROM attempt WHERE id = $1 AND user_id = $2",
		attemptID, userID,
	).Scan(&testID, &status)
	if err != nil {
		return fmt.Errorf("attempt not found for user %d", userID)
	}

	if status != "in_progress" {
		return fmt.Errorf("attempt already finished")
	}

	var totalQuestions int
	_ = storage.DB.QueryRow(
		"SELECT COUNT(*) FROM question WHERE test_id = $1 AND is_deleted = FALSE",
		testID,
	).Scan(&totalQuestions)
	if totalQuestions == 0 {
		return fmt.Errorf("test has no questions")
	}

	rows, err := storage.DB.Query(
		"SELECT answer_option_id FROM user_answer WHERE attempt_id = $1",
		attemptID,
	)
	if err != nil {
		return fmt.Errorf("failed to get user answers: %v", err)
	}
	defer rows.Close()

	var correctAnswers int
	for rows.Next() {
		var optID int
		_ = rows.Scan(&optID)
		var isCorrect bool
		_ = storage.DB.QueryRow(
			"SELECT is_correct FROM answer_option WHERE id = $1",
			optID,
		).Scan(&isCorrect)
		if isCorrect {
			correctAnswers++
		}
	}

	score := (correctAnswers * 100) / totalQuestions

	// Обновляем конкретно попытку этого пользователя
	queryUpdate := `
        UPDATE attempt
        SET status = 'completed', score = $1, completed_at = NOW()
        WHERE id = $2 AND user_id = $3
    `
	_, err = storage.DB.Exec(queryUpdate, score, attemptID, userID)
	if err != nil {
		return fmt.Errorf("failed to finalize attempt: %v", err)
	}

	return nil
}

type AttemptCheckResult struct {
	Answers []QA
	Status  string
	Score   int
}

func CheckAttempt(userID, testID int) (AttemptCheckResult, error) {
	var res AttemptCheckResult

	// Ищем попытку
	var attemptID int
	queryStatus := "SELECT id, status, score FROM attempt WHERE user_id = $1 AND test_id = $2"
	if err := storage.DB.QueryRow(queryStatus, userID, testID).Scan(&attemptID, &res.Status, &res.Score); err != nil {
		return res, fmt.Errorf("attempt not found")
	}

	// Гарантируем, что попытка завершена
	if res.Status != "completed" {
		return res, fmt.Errorf("attempt is not completed yet")
	}

	// Собираем ответы
	answers := make([]QA, 0)
	query := "SELECT question_id, answer_option_id FROM user_answer WHERE attempt_id = $1"
	rows, err := storage.DB.Query(query, attemptID)
	if err != nil {
		return res, fmt.Errorf("failed to fetch answers: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var qID, aID int
		if err := rows.Scan(&qID, &aID); err != nil {
			return res, fmt.Errorf("scan user_answer error: %v", err)
		}

		var question string
		_ = storage.DB.QueryRow("SELECT title FROM question WHERE id = $1", qID).Scan(&question)

		var answer string
		// aID может быть -1 (не отвечено)
		if aID > 0 {
			err = storage.DB.QueryRow("SELECT text FROM answer_option WHERE id = $1", aID).Scan(&answer)
			if err != nil {
				answer = "Not answered"
			}
		} else {
			answer = "Not answered"
		}

		answers = append(answers, QA{
			QuestionText: question,
			AnswerText:   answer,
		})
	}

	if err := rows.Err(); err != nil {
		return res, fmt.Errorf("rows error: %v", err)
	}

	res.Answers = answers
	return res, nil
}
