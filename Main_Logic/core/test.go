package core

import (
	"fmt"
	"main_logic/storage"
)

// Структуры
type AttemptShort struct {
	UserID int
	Mark   int
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
	query := "UPDATE question SET is_deleted = TRUE WHERE root_id = $1 AND test_id = $2"
	res, err := storage.DB.Exec(query, questionRootID, testID)
	if err != nil {
		return fmt.Errorf("Exec error: %v", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("RowsAffected error: %v", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("Question with id %d in test with id %d not exists or already deleted.", questionRootID, testID)
	}
	return nil
}

// Функция "привязывает" тест к вопросу
func AddQuestionToTest(testID int, questionRootID int) error {
	has, err := hasAttempts(testID)
	if err != nil {
		return fmt.Errorf("hasAttempts error: %v", err)
	}
	if has {
		return fmt.Errorf("Test with id %d is have at least one attempt. You can't add a question here", testID)
	}
	query := "UPDATE question SET test_id = $1 WHERE root_id = $2 AND is_deleted = FALSE"
	res, err := storage.DB.Exec(query, testID, questionRootID)
	if err != nil {
		return fmt.Errorf("Exec error: %v", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("RowsAffected error: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("Test with id %d not exists or question with root_id %d not exists.", testID, questionRootID)
	}
	return nil
}

// Функция принимает на вход ID вопросов (их корни) в таком порядке, в каком их бы желал видеть пользователь
func ReorderQuestions(testID int, rootIds []int) error {
	has, err := hasAttempts(testID)
	if err != nil {
		return fmt.Errorf("hasAttempts error: %v", err)
	}
	if has {
		return fmt.Errorf("Can't change order of questions in test with id %d where at least one attempt.", testID)
	}

	newOrder := 1
	for _, id := range rootIds {
		query := "UPDATE question SET position = $1 WHERE root_id = $2 AND test_id = $3 AND is_deleted = FALSE"
		res, err := storage.DB.Exec(query, newOrder, id, testID)
		if err != nil {
			return fmt.Errorf("Exec error: %v", err)
		}
		rowsAffected, err := res.RowsAffected()
		if err != nil {
			return fmt.Errorf("RowsAffected error: %v", err)
		}
		if rowsAffected == 0 {
			return fmt.Errorf("Can't update question with root_id %d to position %d", id, newOrder)
		}
		newOrder += 1
	}
	return nil
}

// Функция возвращает всех, кто прошёл тест.
func GetTestPassers(testID int) ([]int, error) {
	has, err := hasAttempts(testID)
	if err != nil {
		return nil, fmt.Errorf("hasAttempts error: %v", err)
	}
	if !has {
		return nil, fmt.Errorf("No one start to complete the test with id %d", testID)
	}
	users := make([]int, 0)
	query := "SELECT user_id FROM attempt WHERE test_id = $1 AND status = $2"
	rows, err := storage.DB.Query(query, testID, "completed")
	if err != nil {
		return nil, fmt.Errorf("Query error: %v", err)
	}
	for rows.Next() {
		var i int
		if err := rows.Scan(&i); err != nil {
			return nil, fmt.Errorf("Scan error: %v", err)
		}
		users = append(users, i)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows Err: %v", err)
	}
	return users, nil
}

// Функция возвращает ID и оценки тех пользователей, которые прошли тест.
func GetUserMarks(testID int) ([]AttemptShort, error) {
	has, err := hasAttempts(testID)
	if err != nil {
		return nil, fmt.Errorf("hasAttempts error: %v", err)
	}
	if !has {
		return nil, fmt.Errorf("There is no attempts in test with id %d", testID)
	}

	result := make([]AttemptShort, 0)
	query := "SELECT user_id, score FROM attempt WHERE test_id = $1 AND status = 'completed'"
	rows, err := storage.DB.Query(query, testID)
	if err != nil {
		return nil, fmt.Errorf("Query error: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var a AttemptShort
		if err := rows.Scan(&a.UserID, &a.Mark); err != nil {
			return nil, fmt.Errorf("Scan error: %v", err)
		}
		result = append(result, a)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows Err: %v", err)
	}
	return result, nil
}

// Функция принимает на вход ID теста и возвращает все попытки пользователей, включая их ответы на вопросы.
func CheckUserAnswers(testID int) ([]UserAnswer, error) {
	// Проверка были ли попытки у теста
	has, err := hasAttempts(testID)
	if err != nil {
		return nil, fmt.Errorf("hasAttempts error: %v", err)
	}
	if !has {
		return nil, fmt.Errorf("test with id %d don't have any attempts", testID)
	}

	// Собираем всех пользователей, которые прошли тест
	result := make([]UserAnswer, 0)

	// Первым делом получим ID пользователей, которые прошли тест
	userIds := make([]int, 0)

	queryUsers := "SELECT user_id FROM attempt WHERE test_id = $1 AND status = 'completed'"
	rows, err := storage.DB.Query(queryUsers, testID)
	if err != nil {
		return nil, fmt.Errorf("query users error: %v", err)
	}
	defer rows.Close()

	// Находим ID пользователей
	for rows.Next() {
		var userID int
		if err := rows.Scan(&userID); err != nil {
			return nil, fmt.Errorf("scan user_id error: %v", err)
		}
		userIds = append(userIds, userID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %v", err)
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
			return nil, fmt.Errorf("query attempt_id error: %v", err)
		}

		// 2. Находим все user_answer по этому attempt_id
		queryAnswers := "SELECT question_id, answer_option_id FROM user_answer WHERE attempt_id = $1"
		rowsAnswers, err := storage.DB.Query(queryAnswers, attemptID)
		if err != nil {
			return nil, fmt.Errorf("query user_answers error: %v", err)
		}
		defer rowsAnswers.Close()

		// 3. Для каждой пары берём текст вопроса и ответа
		for rowsAnswers.Next() {
			var questionID, answerOptionID int
			if err := rowsAnswers.Scan(&questionID, &answerOptionID); err != nil {
				return nil, fmt.Errorf("scan question/answer id error: %v", err)
			}

			// Находим текст вопроса
			var questionText string
			queryQuestion := "SELECT text FROM question WHERE id = $1"
			err := storage.DB.QueryRow(queryQuestion, questionID).Scan(&questionText)
			if err != nil {
				return nil, fmt.Errorf("query question text error: %v", err)
			}

			// Находим текст ответа
			var answerText string
			queryAnswer := "SELECT text FROM answer_option WHERE id = $1"
			err = storage.DB.QueryRow(queryAnswer, answerOptionID).Scan(&answerText)
			if err != nil {
				return nil, fmt.Errorf("query answer text error: %v", err)
			}

			// Добавляем пару в ответы
			answers = append(answers, QA{QuestionText: questionText, AnswerText: answerText})
		}

		if err := rowsAnswers.Err(); err != nil {
			return nil, fmt.Errorf("rows answers error: %v", err)
		}

		u.Answers = answers
		result = append(result, u)
	}

	return result, nil
}
