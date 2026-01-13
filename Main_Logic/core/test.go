package core

import (
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
func RemoveQuestionFromTest(testID int, questionRootID int) error {
	var isActive bool
	if err := storage.DB.QueryRow("SELECT is_active FROM test WHERE id = $1", testID).Scan(&isActive); err == nil && isActive {
		return fmt.Errorf("cannot remove questions from an active test")
	}

	query := "UPDATE question SET is_deleted = TRUE WHERE root_id = $1 AND test_id = $2"
	res, err := storage.DB.Exec(query, questionRootID, testID)
	if err != nil {
		return fmt.Errorf("failed to remove question: %v", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %v", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("question with root_id %d in test %d not found or deleted", questionRootID, testID)
	}
	return nil
}

// Функция "привязывает" тест к вопросу
func AddQuestionToTest(testID int, questionRootID int) error {
	has, err := hasAttempts(testID)
	if err != nil {
		return fmt.Errorf("error checking attempts: %v", err)
	}
	if has {
		return fmt.Errorf("test with id %d has attempts, cannot add more questions", testID)
	}
	query := "UPDATE question SET test_id = $1 WHERE root_id = $2 AND is_deleted = FALSE"
	res, err := storage.DB.Exec(query, testID, questionRootID)
	if err != nil {
		return fmt.Errorf("failed to add question: %v", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("error checking rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("test or question not found")
	}
	return nil
}

// Функция принимает на вход ID вопросов (их корни) в таком порядке, в каком их бы желал видеть пользователь
func ReorderQuestions(testID int, rootIds []int) error {
	has, err := hasAttempts(testID)
	if err != nil {
		return fmt.Errorf("error checking attempts: %v", err)
	}
	if has {
		return fmt.Errorf("cannot change order of questions for a test with existing attempts")
	}

	newOrder := 1
	for _, id := range rootIds {
		query := "UPDATE question SET position = $1 WHERE root_id = $2 AND test_id = $3 AND is_deleted = FALSE"
		res, err := storage.DB.Exec(query, newOrder, id, testID)
		if err != nil {
			return fmt.Errorf("failed to update position for question %d: %v", id, err)
		}
		rowsAffected, err := res.RowsAffected()
		if err != nil || rowsAffected == 0 {
			return fmt.Errorf("failed to update question %d order", id)
		}
		newOrder += 1
	}
	return nil
}

// Функция возвращает всех, кто прошёл тест.
func GetTestPassers(testID int) ([]int, error) {
	has, err := hasAttempts(testID)
	if err != nil {
		return nil, fmt.Errorf("error checking attempts: %v", err)
	}
	if !has {
		return nil, fmt.Errorf("no attempts found for test %d", testID)
	}
	users := make([]int, 0)
	query := "SELECT user_id FROM attempt WHERE test_id = $1 AND status = $2"
	rows, err := storage.DB.Query(query, testID, "completed")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch passers: %v", err)
	}
	defer rows.Close()
	for rows.Next() {
		var i int
		if err := rows.Scan(&i); err != nil {
			return nil, fmt.Errorf("scan error: %v", err)
		}
		users = append(users, i)
	}
	return users, nil
}

// Функция возвращает ID и оценки тех пользователей, которые прошли тест.
func GetUserMarks(testID int) ([]AttemptShort, error) {
	has, err := hasAttempts(testID)
	if err != nil {
		return nil, fmt.Errorf("error checking attempts: %v", err)
	}
	if !has {
		return nil, fmt.Errorf("no attempts found for test %d", testID)
	}

	result := make([]AttemptShort, 0)
	query := "SELECT user_id, score FROM attempt WHERE test_id = $1 AND status = 'completed'"
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
	return result, nil
}

// Функция принимает на вход ID теста и возвращает все попытки пользователей, включая их ответы на вопросы.
func CheckUserAnswers(testID int) ([]UserAnswer, error) {
	// Проверка были ли попытки у теста
	has, err := hasAttempts(testID)
	if err != nil {
		return nil, fmt.Errorf("error checking attempts: %v", err)
	}
	if !has {
		return nil, fmt.Errorf("test with id %d has no attempts", testID)
	}

	// Собираем всех пользователей, которые прошли тест
	result := make([]UserAnswer, 0)

	// Первым делом получим ID пользователей, которые прошли тест
	userIds := make([]int, 0)

	queryUsers := "SELECT user_id FROM attempt WHERE test_id = $1 AND status = 'completed'"
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

	// Теперь находим ответы пользователя по его ID
	for _, userID := range userIds {
		var u UserAnswer
		u.UserID = userID
		answers := make([]QA, 0)

		// 1. Находим attempt_id
		var attemptID int
		queryAttempt := "SELECT id FROM attempt WHERE test_id = $1 AND user_id = $2 AND status = 'completed'"
		err := storage.DB.QueryRow(queryAttempt, testID, userID).Scan(&attemptID)
		if err != nil {
			continue
		}

		// 2. Находим все user_answer по этому attempt_id
		queryAnswers := "SELECT question_id, answer_option_id FROM user_answer WHERE attempt_id = $1"
		rowsAnswers, err := storage.DB.Query(queryAnswers, attemptID)
		if err != nil {
			continue
		}
		defer rowsAnswers.Close()

		// 3. Для каждой пары берём текст вопроса и ответа
		for rowsAnswers.Next() {
			var questionID, answerOptionID int
			if err := rowsAnswers.Scan(&questionID, &answerOptionID); err != nil {
				continue
			}

			var questionText string
			queryQuestion := "SELECT text FROM question WHERE id = $1"
			_ = storage.DB.QueryRow(queryQuestion, questionID).Scan(&questionText)

			var answerText string
			queryAnswer := "SELECT text FROM answer_option WHERE id = $1"
			err = storage.DB.QueryRow(queryAnswer, answerOptionID).Scan(&answerText)
			if err != nil {
				answerText = "Unknown/Empty"
			}

			answers = append(answers, QA{QuestionText: questionText, AnswerText: answerText})
		}
		u.Answers = answers
		result = append(result, u)
	}

	return result, nil
}
