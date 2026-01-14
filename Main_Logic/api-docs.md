# 📚 API Documentation

## DISCIPLINES

### GET /disciplines

**Description:** Получить список всех дисциплин (кроме удалённых).

**Method:** `GET`

**URL:** `/disciplines`

**Request Body:** нет

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Математика",
    "description": "Основы высшей математики"
  },
  {
    "id": 2,
    "name": "Физика",
    "description": "Общая физика"
  }
]
```

**Error Responses:**
```json
// 500 Internal Server Error
{
  "error": "Failed to fetch disciplines"
}
```

---

### POST /disciplines

**Description:** Создать новую дисциплину и вернуть её ID.

**Method:** `POST`

**URL:** `/disciplines`

**Request Body:**
```json
{
  "name": "История",
  "description": "История Европы в XX веке",
  "teacher_id": 5
}
```

**Success Response (201 Created):**
```json
{
  "id": 3
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: name and teacher_id are required"
}

// 404 Not Found
{
  "error": "Teacher not found"
}

// 500 Internal Server Error
{
  "error": "Failed to create discipline"
}
```

---

### GET /disciplines/{id}

**Description:** Получить информацию о дисциплине по её ID.

**Method:** `GET`

**URL:** `/disciplines/{id}`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "id": 1,
  "name": "Математика",
  "description": "Основы высшей математики",
  "teacher_id": 5
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid discipline ID"
}

// 404 Not Found
{
  "error": "Discipline not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch discipline"
}
```

---

### PUT /disciplines/{id}

**Description:** Обновить данные дисциплины (имя и описание).

**Method:** `PUT`

**URL:** `/disciplines/{id}`

**Request Body:**
```json
{
  "name": "Математика (обновлено)",
  "description": "Обновленное описание"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Discipline updated successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: name is required"
}

// 404 Not Found
{
  "error": "Discipline not found"
}

// 500 Internal Server Error
{
  "error": "Failed to update discipline"
}
```

---

### DELETE /disciplines/{id}

**Description:** Удалить дисциплину (soft delete, is_deleted = true).

**Method:** `DELETE`

**URL:** `/disciplines/{id}`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "message": "Discipline deleted successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid discipline ID"
}

// 404 Not Found
{
  "error": "Discipline not found"
}

// 500 Internal Server Error
{
  "error": "Failed to delete discipline"
}
```

---

## TESTS (в рамках дисциплины)

### GET /disciplines/{id}/tests

**Description:** Получить все тесты дисциплины.

**Method:** `GET`

**URL:** `/disciplines/{id}/tests`

**Request Body:** нет

**Success Response (200 OK):**
```json
[
  {
    "id": 101,
    "name": "Алгебра. Базовый тест"
  },
  {
    "id": 102,
    "name": "Геометрия. Промежуточный тест"
  }
]
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid discipline ID"
}

// 404 Not Found
{
  "error": "Discipline not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch tests"
}
```

---

### POST /disciplines/{id}/tests

**Description:** Создать новый тест для дисциплины (по умолчанию неактивен).

**Method:** `POST`

**URL:** `/disciplines/{id}/tests`

**Request Body:**
```json
{
  "name": "Алгебра. Уровень 1"
}
```

**Success Response (201 Created):**
```json
{
  "id": 103
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: name is required"
}

// 404 Not Found
{
  "error": "Discipline not found"
}

// 500 Internal Server Error
{
  "error": "Failed to create test"
}
```

---

### DELETE /disciplines/{id}/tests/{testId}

**Description:** Удалить тест (soft delete).

**Method:** `DELETE`

**URL:** `/disciplines/{id}/tests/{testId}`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "message": "Test deleted successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid discipline ID or test ID"
}

// 404 Not Found
{
  "error": "Test not found"
}

// 500 Internal Server Error
{
  "error": "Failed to delete test"
}
```

---

### GET /disciplines/{id}/tests/{testId}/state

**Description:** Получить состояние теста (активен или нет).

**Method:** `GET`

**URL:** `/disciplines/{id}/tests/{testId}/state`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "is_active": true
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid discipline ID or test ID"
}

// 404 Not Found
{
  "error": "Test not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch test state"
}
```

---

### PUT /disciplines/{id}/tests/{testId}/state

**Description:** Обновить состояние теста (активировать/деактивировать).

**Method:** `PUT`

**URL:** `/disciplines/{id}/tests/{testId}/state`

**Request Body:**
```json
{
  "is_active": true
}
```

**Success Response (200 OK):**
```json
{
  "message": "Test state updated successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: is_active is required"
}

// 404 Not Found
{
  "error": "Test not found"
}

// 500 Internal Server Error
{
  "error": "Failed to update test state"
}
```

---

## QUESTIONS (в рамках теста)

### GET /disciplines/{id}/tests/{testId}/questions

**Description:** Получить список вопросов теста (последние версии, без удалённых).

**Method:** `GET`

**URL:** `/disciplines/{id}/tests/{testId}/questions`

**Request Body:** нет

**Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Что такое интеграл?",
    "version": 1
  },
  {
    "id": 2,
    "title": "Найти производную функции",
    "version": 2
  }
]
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid test ID"
}

// 404 Not Found
{
  "error": "Test not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch questions"
}
```

---

### POST /disciplines/{id}/tests/{testId}/questions

**Description:** Создать новый вопрос с вариантами ответов.

**Method:** `POST`

**URL:** `/disciplines/{id}/tests/{testId}/questions`

**Request Body:**
```json
{
  "title": "Что такое дифференциал?",
  "text": "Дайте определение дифференциала функции",
  "options": [
    {
      "text": "Главная часть приращения функции",
      "is_correct": true
    },
    {
      "text": "Вторая производная функции",
      "is_correct": false
    },
    {
      "text": "Интеграл от функции",
      "is_correct": false
    }
  ]
}
```

**Success Response (201 Created):**
```json
{
  "id": 3
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: title, text and at least 2 options are required"
}

// 404 Not Found
{
  "error": "Test not found"
}

// 500 Internal Server Error
{
  "error": "Failed to create question"
}
```

---

### DELETE /disciplines/{id}/tests/{testId}/questions

**Description:** Удалить вопрос из теста по `root_id` (soft delete).

**Method:** `DELETE`

**URL:** `/disciplines/{id}/tests/{testId}/questions`

**Request Body:**
```json
{
  "root_id": 3
}
```

**Success Response (200 OK):**
```json
{
  "message": "Question was successfully removed"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: root_id is required"
}

// 404 Not Found
{
  "error": "Question not found"
}

// 500 Internal Server Error
{
  "error": "Failed to delete question"
}
```

---

## STUDENTS (в рамках дисциплины)

### GET /disciplines/{id}/students

**Description:** Получить список студентов, записанных на дисциплину.

**Method:** `GET`

**URL:** `/disciplines/{id}/students`

**Request Body:** нет

**Success Response (200 OK):**
```json
[
  {
    "id": 10,
    "full_name": "Иван Петров"
  },
  {
    "id": 11,
    "full_name": "Мария Сидорова"
  }
]
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid discipline ID"
}

// 404 Not Found
{
  "error": "Discipline not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch students"
}
```

---

### POST /disciplines/{id}/students/{userId}

**Description:** Записать существующего пользователя на дисциплину.

**Method:** `POST`

**URL:** `/disciplines/{id}/students/{userId}`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "message": "Student added successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid discipline ID or user ID"
}

// 404 Not Found
{
  "error": "User or discipline not found"
}

// 409 Conflict
{
  "error": "Student is already enrolled in this discipline"
}

// 500 Internal Server Error
{
  "error": "Failed to add student"
}
```

---

### DELETE /disciplines/{id}/students/{userId}

**Description:** Отчислить пользователя с дисциплины.

**Method:** `DELETE`

**URL:** `/disciplines/{id}/students/{userId}`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "message": "Student removed successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid discipline ID or user ID"
}

// 404 Not Found
{
  "error": "Student not found in this discipline"
}

// 500 Internal Server Error
{
  "error": "Failed to remove student"
}
```

---

## RESULTS (по тесту)

### GET /disciplines/{id}/tests/{testId}/passers

**Description:** Получить всех студентов, прошедших тест (завершённые попытки).

**Method:** `GET`

**URL:** `/disciplines/{id}/tests/{testId}/passers`

**Request Body:** нет

**Success Response (200 OK):**
```json
[
  {
    "full_name": "Иван Петров"
  },
  {
    "full_name": "Мария Сидорова"
  }
]
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid test ID"
}

// 404 Not Found
{
  "error": "Test not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch passers"
}
```

---

### GET /disciplines/{id}/tests/{testId}/passers/marks

**Description:** Получить оценки (баллы) всех студентов, прошедших тест.

**Method:** `GET`

**URL:** `/disciplines/{id}/tests/{testId}/passers/marks`

**Request Body:** нет

**Success Response (200 OK):**
```json
[
  {
    "user_id": 10,
    "mark": 85
  },
  {
    "user_id": 11,
    "mark": 92
  }
]
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid test ID"
}

// 404 Not Found
{
  "error": "Test not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch marks"
}
```

---

## USERS

### POST /users

**Description:** Регистрация пользователя. Возвращает ID созданного пользователя.

**Method:** `POST`

**URL:** `/users`

**Request Body:**
```json
{
  "email": "student@example.com",
  "full_name": "Иван Иванович Петров"
}
```

**Success Response (201 Created):**
```json
{
  "id": 12
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: email and full_name are required"
}

// 409 Conflict
{
  "error": "User with this email already exists"
}

// 500 Internal Server Error
{
  "error": "Failed to create user"
}
```

---

### GET /users/{id}

**Description:** Получить информацию о пользователе: дисциплины, тесты и оценки.

**Method:** `GET`

**URL:** `/users/{id}`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "disciplines": [
    {
      "id": 1,
      "name": "Математика",
      "tests": [
        {
          "id": 101,
          "name": "Алгебра. Базовый тест",
          "score": 85
        },
        {
          "id": 102,
          "name": "Геометрия. Промежуточный тест",
          "score": 92
        }
      ]
    },
    {
      "id": 2,
      "name": "Физика",
      "tests": [
        {
          "id": 201,
          "name": "Механика",
          "score": 88
        }
      ]
    }
  ]
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid user ID"
}

// 404 Not Found
{
  "error": "User not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch user data"
}
```

---

### GET /users/{id}/roles

**Description:** Получить роли пользователя.

**Method:** `GET`

**URL:** `/users/{id}/roles`

**Request Body:** нет

**Success Response (200 OK):**
```json
[
  "student",
  "admin"
]
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid user ID"
}

// 404 Not Found
{
  "error": "User not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch user roles"
}
```

---

### PUT /users/{id}/roles

**Description:** Обновить роли пользователя на указанный список.

**Method:** `PUT`

**URL:** `/users/{id}/roles`

**Request Body:**
```json
{
  "roles": [
    "teacher",
    "admin"
  ]
}
```

**Success Response (200 OK):**
```json
{
  "message": "Roles updated successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: roles must be an array of strings"
}

// 404 Not Found
{
  "error": "User not found"
}

// 500 Internal Server Error
{
  "error": "Failed to update roles"
}
```

---

### GET /users/{id}/state

**Description:** Получить статус блокировки пользователя.

**Method:** `GET`

**URL:** `/users/{id}/state`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "is_blocked": false
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid user ID"
}

// 404 Not Found
{
  "error": "User not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch user state"
}
```

---

### PUT /users/{id}/state

**Description:** Изменить статус блокировки пользователя.

**Method:** `PUT`

**URL:** `/users/{id}/state`

**Request Body:**
```json
{
  "is_blocked": true
}
```

**Success Response (200 OK):**
```json
{
  "message": "User state updated successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: is_blocked must be boolean"
}

// 404 Not Found
{
  "error": "User not found"
}

// 500 Internal Server Error
{
  "error": "Failed to update user state"
}
```

---

## ATTEMPTS

### POST /attempts

**Description:** Создать попытку прохождения теста для пользователя. Для каждого вопроса создаются записи в `user_answer` с `answer_option_id = -1`.

**Method:** `POST`

**URL:** `/attempts`

**Request Body:**
```json
{
  "user_id": 10,
  "test_id": 101
}
```

**Success Response (201 Created):**
```json
{
  "id": 1
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: user_id and test_id are required"
}

// 403 Forbidden
{
  "error": "User is not enrolled in the discipline of this test"
}

// 404 Not Found
{
  "error": "User or test not found"
}

// 409 Conflict
{
  "error": "User already has an attempt for this test"
}

// 500 Internal Server Error
{
  "error": "Failed to create attempt"
}
```

---

### GET /attempts/{id}

**Description:** Получить базовую информацию о попытке.

**Method:** `GET`

**URL:** `/attempts/{id}`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "id": 1,
  "user_id": 10,
  "test_id": 101,
  "status": "in_progress",
  "score": null,
  "started_at": "2026-01-13T09:30:00Z",
  "completed_at": null
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid attempt ID"
}

// 404 Not Found
{
  "error": "Attempt not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch attempt"
}
```

---

### PATCH /attempts/{id}/answers/{questionId}

**Description:** Обновить ответ пользователя на конкретный вопрос в попытке.

**Method:** `PATCH`

**URL:** `/attempts/{id}/answers/{questionId}`

**Request Body:**
```json
{
  "answer_option_id": 5
}
```

**Success Response (200 OK):**
```json
{
  "message": "Answer submitted successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid input: answer_option_id is required"
}

// 404 Not Found
{
  "error": "Question or answer option not found"
}

// 409 Conflict
{
  "error": "Attempt is already completed"
}

// 500 Internal Server Error
{
  "error": "Failed to submit answer"
}
```

---

### POST /attempts/{id}/complete

**Description:** Завершить попытку и вычислить итоговую оценку (процент правильных ответов).

**Method:** `POST`

**URL:** `/attempts/{id}/complete`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "score": 85,
  "message": "Attempt completed successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid attempt ID"
}

// 404 Not Found
{
  "error": "Attempt not found"
}

// 409 Conflict
{
  "error": "Attempt is already completed"
}

// 500 Internal Server Error
{
  "error": "Failed to complete attempt"
}
```

---

### GET /attempts/{id}/answers

**Description:** Получить текущие ответы пользователя в попытке.

**Method:** `GET`

**URL:** `/attempts/{id}/answers`

**Request Body:** нет

**Success Response (200 OK):**
```json
[
  {
    "question_id": 1,
    "answer_option_id": 5
  },
  {
    "question_id": 2,
    "answer_option_id": -1
  },
  {
    "question_id": 3,
    "answer_option_id": 8
  }
]
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid attempt ID"
}

// 404 Not Found
{
  "error": "Attempt not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch answers"
}
```

---

### GET /attempts/{id}/results

**Description:** Получить результаты завершённой попытки: вопросы, выбранные ответы, правильные ответы и статус.

**Method:** `GET`

**URL:** `/attempts/{id}/results`

**Request Body:** нет

**Success Response (200 OK):**
```json
{
  "score": 85,
  "questions": [
    {
      "question_id": 1,
      "question_text": "Что такое интеграл?",
      "student_answer": "Операция, обратная дифференцированию",
      "correct_answer": "Операция, обратная дифференцированию",
      "is_correct": true
    },
    {
      "question_id": 2,
      "question_text": "Найти производную x^2",
      "student_answer": null,
      "correct_answer": "2x",
      "is_correct": false
    }
  ]
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid attempt ID"
}

// 404 Not Found
{
  "error": "Attempt not found"
}

// 409 Conflict
{
  "error": "Attempt is not completed yet"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch results"
}
```
