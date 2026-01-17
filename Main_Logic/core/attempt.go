package core

import (
	"database/sql"
	"errors"
	"fmt"
	"main_logic/storage"
)

// Структура для передачи ответов от фронтенда
type UserAnswerData struct {
	QuestionID   int `json:"question_id"`
	AnswerOption int `json:"answer_option_id"`
}

type AnswerOptionOut struct {
	ID   int    `json:"id"`
	Text string `json:"text"`
}

// Вопрос с вариантами
type QuestionWithOptions struct {
	ID       int               `json:"id"`
	Title    string            `json:"title"`
	Text     string            `json:"text"`
	Position int               `json:"position"`
	Options  []AnswerOptionOut `json:"options"`
}

// Response при создании попытки
type CreateAttemptResponse struct {
	AttemptID int                   `json:"attempt_id"`
	Questions []QuestionWithOptions `json:"questions"`
}

type AttemptCheckResult struct {
	Answers []QA   `json:"answers"`
	Status  string `json:"status"`
	Score   int    `json:"score"`
}

func CreateAttempt(userID int, testID int) (*CreateAttemptResponse, error) {
	var isTestActive bool
	var disciplineID int
	queryTest := "SELECT is_active, discipline_id FROM test WHERE id = $1 AND is_deleted = FALSE"
	if err := storage.DB.QueryRow(queryTest, testID).Scan(&isTestActive, &disciplineID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("test with id %d not exists or deleted", testID)
		}
		return nil, fmt.Errorf("database query error: %v", err)
	}

	if !isTestActive {
		return nil, fmt.Errorf("test with id %d is not active right now", testID)
	}

	// Проверяем, что пользователь записан на дисциплину
	var dummy int
	checkEnroll := "SELECT 1 FROM user_discipline WHERE user_id = $1 AND discipline_id = $2"
	if err := storage.DB.QueryRow(checkEnroll, userID, disciplineID).Scan(&dummy); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user is not enrolled in this discipline")
		}
		return nil, fmt.Errorf("database validation error: %v", err)
	}

	// Проверяем, что у пользователя нет уже существующей попытки
	var attemptCount int
	checkAttemptQuery := "SELECT COUNT(*) FROM attempt WHERE user_id = $1 AND test_id = $2"
	if err := storage.DB.QueryRow(checkAttemptQuery, userID, testID).Scan(&attemptCount); err != nil {
		return nil, fmt.Errorf("failed to count attempts: %v", err)
	}

	if attemptCount > 0 {
		return nil, fmt.Errorf("user with id %d already has an attempt in test with id %d", userID, testID)
	}

	// Создаём попытку
	query := `INSERT INTO attempt (user_id, test_id, status) VALUES ($1, $2, 'in_progress') RETURNING id`
	var attemptID int
	if err := storage.DB.QueryRow(query, userID, testID).Scan(&attemptID); err != nil {
		return nil, fmt.Errorf("failed to start attempt: %v", err)
	}

	// Получаем последние версии вопросов с вариантами ответов
	questions, err := getLatestQuestionsWithOptions(testID, attemptID, userID)
	if err != nil {
		// Откатываем попытку если не получилось загрузить вопросы
		storage.DB.Exec("DELETE FROM attempt WHERE id = $1", attemptID)
		return nil, fmt.Errorf("failed to fetch questions: %v", err)
	}

	return &CreateAttemptResponse{
		AttemptID: attemptID,
		Questions: questions,
	}, nil
}

// Вспомогательная функция для получения последних версий вопросов
func getLatestQuestionsWithOptions(testID, attemptID, userID int) ([]QuestionWithOptions, error) {
	// Сортируем по position для правильного порядка
	queryQuestions := `
SELECT q.id, q.title, q.text, q.position
FROM question q
WHERE q.test_id = $1
  AND q.is_deleted = FALSE
  AND q.version = (
      SELECT MAX(version)
      FROM question q2
      WHERE q2.root_id = q.root_id
         OR (q2.root_id IS NULL AND q.root_id IS NULL AND q2.id = q.id)
  )
ORDER BY q.position ASC
`
	rows, err := storage.DB.Query(queryQuestions, testID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch questions: %v", err)
	}
	defer rows.Close()

	var questions []QuestionWithOptions
	for rows.Next() {
		var q QuestionWithOptions
		if err := rows.Scan(&q.ID, &q.Title, &q.Text, &q.Position); err != nil {
			return nil, fmt.Errorf("scan question error: %v", err)
		}

		// Получаем варианты ответов для этого вопроса
		options, err := getAnswerOptions(q.ID)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch answer options for question %d: %v", q.ID, err)
		}

		q.Options = options

		// Инициализируем user_answer запись (неопределённый ответ)
		if err = initializeUserAnswer(attemptID, q.ID); err != nil {
			return nil, fmt.Errorf("failed to initialize user_answer for question %d: %v", q.ID, err)
		}

		questions = append(questions, q)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %v", err)
	}

	return questions, nil
}

// initializeUserAnswer инициализирует запись в user_answer как "неопределённо"
// В БД храним NULL, в логике считаем это как -1.
func initializeUserAnswer(attemptID, questionID int) error {
	query := `
INSERT INTO user_answer (attempt_id, question_id, answer_option_id)
VALUES ($1, $2, NULL)
`
	_, err := storage.DB.Exec(query, attemptID, questionID)
	if err != nil {
		return fmt.Errorf("database error: %v", err)
	}
	return nil
}

// Получаем варианты ответов для вопроса
func getAnswerOptions(questionID int) ([]AnswerOptionOut, error) {
	query := `
SELECT id, text
FROM answer_option
WHERE question_id = $1
ORDER BY id ASC
`
	rows, err := storage.DB.Query(query, questionID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch options: %v", err)
	}
	defer rows.Close()

	var options []AnswerOptionOut
	for rows.Next() {
		var opt AnswerOptionOut
		if err := rows.Scan(&opt.ID, &opt.Text); err != nil {
			return nil, fmt.Errorf("scan option error: %v", err)
		}
		options = append(options, opt)
	}

	return options, nil
}

// CompleteAttempt завершает попытку, сохраняя ответы и подсчитывая баллы
func CompleteAttempt(userID, attemptID int, answers []UserAnswerData) error {
	// Проверяем, что попытка принадлежит userID
	var testID int
	var status string
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

	// Получаем ID всех вопросов теста
	validQuestionIDs, err := getQuestionIDsForTest(testID)
	if err != nil {
		return fmt.Errorf("failed to get question ids: %v", err)
	}

	if len(validQuestionIDs) == 0 {
		return fmt.Errorf("test has no questions")
	}

	// Валидируем ответы
	if err := validateAnswers(answers, validQuestionIDs); err != nil {
		return err
	}

	// Сохраняем ответы пользователя
	if err := saveUserAnswers(attemptID, answers); err != nil {
		return fmt.Errorf("failed to save answers: %v", err)
	}

	// Подсчитываем баллы
	score, err := calculateScore(attemptID, testID)
	if err != nil {
		return fmt.Errorf("failed to calculate score: %v", err)
	}

	// Обновляем попытку
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

// Получаем ID вопросов теста
func getQuestionIDsForTest(testID int) ([]int, error) {
	query := `
SELECT id FROM question
WHERE test_id = $1 AND is_deleted = FALSE
  AND version = (
      SELECT MAX(version)
      FROM question q2
      WHERE q2.root_id = question.root_id
         OR (q2.root_id IS NULL AND question.root_id IS NULL AND q2.id = question.id)
  )
`
	rows, err := storage.DB.Query(query, testID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch question ids: %v", err)
	}
	defer rows.Close()

	var questionIDs []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan error: %v", err)
		}
		questionIDs = append(questionIDs, id)
	}

	return questionIDs, rows.Err()
}

// Валидация ответов
func validateAnswers(answers []UserAnswerData, validQuestionIDs []int) error {
	validQMap := make(map[int]bool)
	for _, id := range validQuestionIDs {
		validQMap[id] = true
	}

	answeredQuestions := make(map[int]bool)
	for _, answer := range answers {
		if !validQMap[answer.QuestionID] {
			return fmt.Errorf("invalid question id: %d", answer.QuestionID)
		}

		if answer.AnswerOption < -1 {
			return fmt.Errorf("invalid answer option id: %d for question %d", answer.AnswerOption, answer.QuestionID)
		}

		answeredQuestions[answer.QuestionID] = true
	}

	if len(answeredQuestions) != len(validQuestionIDs) {
		return fmt.Errorf("not all questions answered: %d/%d", len(answeredQuestions), len(validQuestionIDs))
	}

	return nil
}

// Сохранение ответов
func saveUserAnswers(attemptID int, answers []UserAnswerData) error {
	for _, answer := range answers {
		query := `
UPDATE user_answer
SET answer_option_id = $1
WHERE attempt_id = $2 AND question_id = $3
`
		result, err := storage.DB.Exec(query, answer.AnswerOption, attemptID, answer.QuestionID)
		if err != nil {
			return fmt.Errorf("failed to save answer for question %d: %v", answer.QuestionID, err)
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to check rows affected: %v", err)
		}

		if rowsAffected == 0 {
			return fmt.Errorf("no user_answer record found for attempt %d, question %d", attemptID, answer.QuestionID)
		}
	}

	return nil
}

// Подсчет баллов
func calculateScore(attemptID int, testID int) (int, error) {
	var totalQuestions int
	_ = storage.DB.QueryRow(
		"SELECT COUNT(*) FROM question WHERE test_id = $1 AND is_deleted = FALSE",
		testID,
	).Scan(&totalQuestions)

	if totalQuestions == 0 {
		return 0, fmt.Errorf("test has no questions")
	}

	// Читаем NULL как -1, чтобы трактовать как "не отвечено"
	rows, err := storage.DB.Query(
		"SELECT COALESCE(answer_option_id, -1) FROM user_answer WHERE attempt_id = $1",
		attemptID,
	)
	if err != nil {
		return 0, fmt.Errorf("failed to get user answers: %v", err)
	}
	defer rows.Close()

	var correctAnswers int
	var answeredCount int

	for rows.Next() {
		var optID int
		_ = rows.Scan(&optID)
		answeredCount++

		if optID == -1 {
			continue
		}

		var isCorrect bool
		_ = storage.DB.QueryRow(
			"SELECT is_correct FROM answer_option WHERE id = $1",
			optID,
		).Scan(&isCorrect)

		if isCorrect {
			correctAnswers++
		}
	}

	if err := rows.Err(); err != nil {
		return 0, fmt.Errorf("rows error: %v", err)
	}

	if answeredCount == 0 {
		return 0, nil
	}

	score := (correctAnswers * 100) / totalQuestions
	return score, nil
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

	// Собираем ответы, NULL трактуем как -1
	answers := make([]QA, 0)
	query := "SELECT question_id, COALESCE(answer_option_id, -1) FROM user_answer WHERE attempt_id = $1"
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

func GetScore(attemptID int) (int, error) {
	query := "SELECT score FROM attempt WHERE id = $1"
	row := storage.DB.QueryRow(query, attemptID)
	var score int
	if err := row.Scan(&score); err != nil {
		return 0, fmt.Errorf("Score not found: %v", err)
	}

	return score, nil
}
