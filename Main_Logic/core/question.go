package core

import (
	"database/sql"
	"errors"
	"fmt"

	"main_logic/storage"
)

// Структуры

// AnswerOption содержит информацию об одном варианте ответа
type AnswerOption struct {
	ID        int
	Text      string
	IsCorrect bool
}

// Question содержит информацию о вопросе и его вариантах ответов
type Question struct {
	ID      int
	RootID  int
	TestID  int
	Title   string
	Text    string
	Version int
	Answers []AnswerOption
}

// QuestionListItem содержит краткую информацию о вопросе для списка
type QuestionListItem struct {
	ID      int
	RootID  int
	Title   string
	Version int
}

// Функции

// GetQuestions возвращает список всех вопросов по ID теста (только последние версии, не удалённые)
func GetQuestions(testID int) ([]QuestionListItem, error) {
	result := make([]QuestionListItem, 0)
	query := `
		SELECT q.id, q.root_id, q.title, q.version 
		FROM question q
		WHERE q.test_id = $1 
		AND q.is_deleted = false
		AND q.version = (
			SELECT MAX(version) 
			FROM question 
			WHERE root_id = q.root_id
			AND is_deleted = false
		)
		ORDER BY q.root_id
	`

	rows, err := storage.DB.Query(query, testID)
	if err != nil {
		return nil, fmt.Errorf("Query error: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var q QuestionListItem
		if err := rows.Scan(&q.ID, &q.RootID, &q.Title, &q.Version); err != nil {
			return nil, fmt.Errorf("Scan error: %v", err)
		}
		result = append(result, q)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows.Err: %v", err)
	}

	return result, nil
}

// GetQuestion возвращает информацию о конкретной версии вопроса, включая все варианты ответов
// Возвращает ошибку, если вопрос удалён
func GetQuestion(questionID int, version int) (Question, error) {
	var q Question
	q.Answers = make([]AnswerOption, 0)

	// Получаем информацию о вопросе
	err := storage.DB.QueryRow(
		"SELECT id, root_id, test_id, title, text, version FROM question WHERE id = $1 AND version = $2 AND is_deleted = false",
		questionID, version,
	).Scan(&q.ID, &q.RootID, &q.TestID, &q.Title, &q.Text, &q.Version)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return q, fmt.Errorf("Question not found: %v", err)
		}
		return q, fmt.Errorf("Scan error: %v", err)
	}

	// Получаем все варианты ответов для этого вопроса
	answerRows, err := storage.DB.Query(
		"SELECT id, text, is_correct FROM answer_option WHERE question_id = $1 ORDER BY id",
		questionID,
	)
	if err != nil {
		return q, fmt.Errorf("Query answers error: %v", err)
	}
	defer answerRows.Close()

	for answerRows.Next() {
		var a AnswerOption
		if err := answerRows.Scan(&a.ID, &a.Text, &a.IsCorrect); err != nil {
			return q, fmt.Errorf("Scan answer error: %v", err)
		}
		q.Answers = append(q.Answers, a)
	}

	if err := answerRows.Err(); err != nil {
		return q, fmt.Errorf("answers rows.Err: %v", err)
	}

	return q, nil
}

// CreateQuestion создаёт новый вопрос версии 1 с заданными вариантами ответов
// Возвращает ID созданного вопроса
func CreateQuestion(testID int, title string, text string, answers []AnswerOption) (int, error) {
	var questionID int

	// Вставляем новый вопрос с версией 1, is_deleted = false
	err := storage.DB.QueryRow(
		"INSERT INTO question (test_id, title, text, version, is_deleted) VALUES ($1, $2, $3, 1, false) RETURNING id",
		testID, title, text,
	).Scan(&questionID)

	if err != nil {
		return 0, fmt.Errorf("Insert question error: %v", err)
	}

	// Устанавливаем root_id равным id (это первая версия)
	_, err = storage.DB.Exec(
		"UPDATE question SET root_id = $1 WHERE id = $2",
		questionID, questionID,
	)
	if err != nil {
		return 0, fmt.Errorf("Update root_id error: %v", err)
	}

	// Вставляем варианты ответов
	for _, ans := range answers {
		_, err := storage.DB.Exec(
			"INSERT INTO answer_option (question_id, text, is_correct) VALUES ($1, $2, $3)",
			questionID, ans.Text, ans.IsCorrect,
		)
		if err != nil {
			return 0, fmt.Errorf("Insert answer option error: %v", err)
		}
	}

	return questionID, nil
}

// UpdateQuestion создаёт новую версию вопроса с новым текстом и вариантами ответов
// Все версии остаются в БД, новая версия имеет версию = old_max + 1
func UpdateQuestion(rootID int, newTitle string, newText string, newAnswers []AnswerOption) (int, error) {

	// Получаем текущую максимальную версию и test_id по root_id (только не удалённые)
	var currentVersion int
	var testID int
	err := storage.DB.QueryRow(
		"SELECT COALESCE(MAX(version), 0), test_id FROM question WHERE root_id = $1 AND is_deleted = false LIMIT 1",
		rootID,
	).Scan(&currentVersion, &testID)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, fmt.Errorf("Question root not found: %v", err)
		}
		return 0, fmt.Errorf("Query version error: %v", err)
	}

	if currentVersion == 0 {
		return 0, fmt.Errorf("Question root not found: root_id %d does not exist", rootID)
	}

	newVersion := currentVersion + 1

	// Вставляем новую версию вопроса с тем же root_id, is_deleted = false
	var newQuestionID int
	err = storage.DB.QueryRow(
		"INSERT INTO question (test_id, title, text, version, root_id, is_deleted) VALUES ($1, $2, $3, $4, $5, false) RETURNING id",
		testID, newTitle, newText, newVersion, rootID,
	).Scan(&newQuestionID)

	if err != nil {
		return 0, fmt.Errorf("Insert new version error: %v", err)
	}

	// Вставляем варианты ответов для новой версии
	for _, ans := range newAnswers {
		_, err := storage.DB.Exec(
			"INSERT INTO answer_option (question_id, text, is_correct) VALUES ($1, $2, $3)",
			newQuestionID, ans.Text, ans.IsCorrect,
		)
		if err != nil {
			return 0, fmt.Errorf("Insert answer option error: %v", err)
		}
	}

	return newQuestionID, nil
}

// DeleteQuestion помечает вопрос как удалённый
func DeleteQuestion(questionID int) error {
	res, err := storage.DB.Exec(
		"UPDATE question SET is_deleted = true WHERE id = $1",
		questionID,
	)

	if err != nil {
		return fmt.Errorf("Exec error: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("RowsAffected error: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("Question not found: %v", fmt.Errorf("question with id %d does not exist", questionID))
	}

	return nil
}
