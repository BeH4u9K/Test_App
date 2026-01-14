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
func GetQuestions(disciplineID, testID int) ([]QuestionListItem, error) {

	result := make([]QuestionListItem, 0)
	query := `
       SELECT q.id, q.root_id, q.title, q.version 
       FROM question q
       INNER JOIN test t ON q.test_id = t.id
       WHERE q.test_id = $1 
       AND t.discipline_id = $2
       AND q.is_deleted = false
       AND q.version = (
          SELECT MAX(version) 
          FROM question 
          WHERE root_id = q.root_id
          AND is_deleted = false
       )
       ORDER BY q.root_id
    `

	rows, err := storage.DB.Query(query, testID, disciplineID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch questions: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var q QuestionListItem
		if err := rows.Scan(&q.ID, &q.RootID, &q.Title, &q.Version); err != nil {
			return nil, fmt.Errorf("scan error: %v", err)
		}
		result = append(result, q)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %v", err)
	}

	return result, nil
}

// GetQuestion возвращает информацию о конкретной версии вопроса, включая все варианты ответов
// Возвращает ошибку, если вопрос удалён
func GetQuestion(disciplineID, testID, questionID int, version int) (Question, error) {
	var q Question
	q.Answers = make([]AnswerOption, 0)

	// Получаем информацию о вопросе с проверкой дисциплины и теста
	err := storage.DB.QueryRow(
		`SELECT q.id, q.root_id, q.test_id, q.title, q.text, q.version 
        FROM question q
        INNER JOIN test t ON q.test_id = t.id
        WHERE q.id = $1 
        AND q.version = $2 
        AND q.test_id = $3
        AND t.discipline_id = $4
        AND q.is_deleted = false`,
		questionID, version, testID, disciplineID,
	).Scan(&q.ID, &q.RootID, &q.TestID, &q.Title, &q.Text, &q.Version)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return q, fmt.Errorf("question with id %d not found or deleted in test %d for discipline %d", questionID, testID, disciplineID)
		}
		return q, fmt.Errorf("database query error: %v", err)
	}

	// Получаем все варианты ответов для этого вопроса
	answerRows, err := storage.DB.Query(
		"SELECT id, text, is_correct FROM answer_option WHERE question_id = $1 ORDER BY id",
		questionID,
	)
	if err != nil {
		return q, fmt.Errorf("failed to fetch answers: %v", err)
	}
	defer answerRows.Close()

	for answerRows.Next() {
		var a AnswerOption
		if err := answerRows.Scan(&a.ID, &a.Text, &a.IsCorrect); err != nil {
			return q, fmt.Errorf("scan answer error: %v", err)
		}
		q.Answers = append(q.Answers, a)
	}

	return q, nil
}

// CreateQuestion создаёт новый вопрос версии 1 с заданными вариантами ответов
// Возвращает ID созданного вопроса
func CreateQuestion(disciplineID, testID int, title string, text string, answers []AnswerOption) (int, error) {
	if len(answers) == 0 {
		return 0, fmt.Errorf("cannot create question without answer options")
	}

	var questionID int

	// Проверяем, что тест принадлежит дисциплине перед вставкой вопроса
	err := storage.DB.QueryRow(
		`SELECT id FROM test 
        WHERE id = $1 AND discipline_id = $2 AND is_deleted = false`,
		testID, disciplineID,
	).Scan(&testID)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, fmt.Errorf("test %d not found in discipline %d", testID, disciplineID)
		}
		return 0, fmt.Errorf("failed to verify test: %v", err)
	}

	// Вставляем новый вопрос с версией 1, is_deleted = false
	err = storage.DB.QueryRow(
		"INSERT INTO question (test_id, title, text, version, is_deleted) VALUES ($1, $2, $3, 1, false) RETURNING id",
		testID, title, text,
	).Scan(&questionID)

	if err != nil {
		return 0, fmt.Errorf("failed to create question: %v", err)
	}

	// Устанавливаем root_id равным id (это первая версия)
	_, err = storage.DB.Exec(
		"UPDATE question SET root_id = $1 WHERE id = $2",
		questionID, questionID,
	)
	if err != nil {
		return 0, fmt.Errorf("failed to set root_id: %v", err)
	}

	// Вставляем варианты ответов
	for _, ans := range answers {
		_, err := storage.DB.Exec(
			"INSERT INTO answer_option (question_id, text, is_correct) VALUES ($1, $2, $3)",
			questionID, ans.Text, ans.IsCorrect,
		)
		if err != nil {
			return 0, fmt.Errorf("failed to insert answer option: %v", err)
		}
	}

	return questionID, nil
}

// UpdateQuestion создаёт новую версию вопроса с новым текстом и вариантами ответов
// Все версии остаются в БД, новая версия имеет версию = old_max + 1
func UpdateQuestion(
	disciplineID int,
	testID int,
	rootID int,
	newTitle string,
	newText string,
	newAnswers []AnswerOption,
) (int, error) {
	// Валидация входных параметров
	if len(newAnswers) == 0 {
		return 0, fmt.Errorf("cannot update question: no answer options provided")
	}

	if disciplineID <= 0 || testID <= 0 || rootID <= 0 {
		return 0, fmt.Errorf("invalid parameters: disciplineID, testID, and rootID must be positive")
	}

	// Проверяем, что тест принадлежит дисциплине и получаем текущую версию вопроса
	var currentVersion int
	err := storage.DB.QueryRow(`
        SELECT COALESCE(MAX(q.version), 0)
        FROM question q
        INNER JOIN test t ON q.test_id = t.id
        WHERE q.root_id = $1
        AND t.id = $2
        AND t.discipline_id = $3
        AND q.is_deleted = false
        AND t.is_deleted = false
        LIMIT 1
    `, rootID, testID, disciplineID).Scan(&currentVersion)

	if err != nil && err != sql.ErrNoRows {
		return 0, fmt.Errorf("failed to fetch question: %v", err)
	}

	if currentVersion == 0 {
		return 0, fmt.Errorf(
			"question with root_id %d not found in test %d of discipline %d, or it's deleted",
			rootID, testID, disciplineID,
		)
	}

	newVersion := currentVersion + 1

	// Вставляем новую версию вопроса
	var newQuestionID int
	err = storage.DB.QueryRow(`
        INSERT INTO question (test_id, title, text, version, root_id, is_deleted)
        VALUES ($1, $2, $3, $4, $5, false)
        RETURNING id
    `, testID, newTitle, newText, newVersion, rootID).Scan(&newQuestionID)

	if err != nil {
		return 0, fmt.Errorf("failed to insert new version: %v", err)
	}

	// Вставляем варианты ответов для новой версии
	for _, ans := range newAnswers {
		_, err := storage.DB.Exec(`
            INSERT INTO answer_option (question_id, text, is_correct)
            VALUES ($1, $2, $3)
        `, newQuestionID, ans.Text, ans.IsCorrect)

		if err != nil {
			return 0, fmt.Errorf("failed to insert answer option: %v", err)
		}
	}

	return newQuestionID, nil
}

// DeleteQuestion помечает вопрос как удалённый
func DeleteQuestion(
	disciplineID int,
	testID int,
	questionID int,
) error {
	// Валидация входных параметров
	if disciplineID <= 0 || testID <= 0 || questionID <= 0 {
		return fmt.Errorf("invalid parameters: disciplineID, testID, and questionID must be positive")
	}

	// Проверяем принадлежность и активность теста
	var isActive bool
	query := `
        SELECT t.is_active
        FROM test t
        INNER JOIN question q ON q.test_id = t.id
        WHERE q.id = $1
        AND t.id = $2
        AND t.discipline_id = $3
        AND q.is_deleted = false
        AND t.is_deleted = false
    `
	err := storage.DB.QueryRow(query, questionID, testID, disciplineID).Scan(&isActive)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf(
				"question with id %d not found in test %d of discipline %d",
				questionID, testID, disciplineID,
			)
		}
		return fmt.Errorf("failed to fetch question: %v", err)
	}

	// Проверяем, активен ли тест
	if isActive {
		return fmt.Errorf(
			"cannot delete question %d: test %d is active",
			questionID, testID,
		)
	}

	// Выполняем soft delete
	res, err := storage.DB.Exec(
		"UPDATE question SET is_deleted = true WHERE id = $1",
		questionID,
	)

	if err != nil {
		return fmt.Errorf("database update error: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected error: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("question with id %d not found", questionID)
	}

	return nil
}
