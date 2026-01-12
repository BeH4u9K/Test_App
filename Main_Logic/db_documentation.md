# Схема БД `test_app_logic`

## Дисциплина (`discipline`)

**Смысл:** учебный курс.

**Структура:**
```sql
CREATE TABLE discipline (
    id SERIAL PRIMARY KEY,
    teacher_id INT REFERENCES users(id),
    name VARCHAR(100),
    description VARCHAR(255)
);
```
- `id` — идентификатор дисциплины.
    
- `teacher_id` — ссылка на преподавателя из `users.id`. Один пользователь может вести несколько дисциплин.
    
- `name` — название дисциплины.
    
- `description` — краткое описание.

**Логика:**

- У дисциплины есть тесты.
    
- У дисциплины есть студенты, записанные через таблицу `user_discipline`.

## Тест (`test`)

**Смысл:** набор вопросов по одной дисциплине.

**Структура:**
```sql
CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    discipline_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (discipline_id) REFERENCES discipline(id)
);
```


- `id` — идентификатор теста.
    
- `discipline_id` — ссылка на дисциплину.
    
- `name` — название теста.
    
- `is_active` — можно ли сейчас проходить тест.
    
- `is_deleted` — «мягкое» удаление: тест скрыт, но данные сохранены.
    

**Логика:**

- Каждый тест относится к одной дисциплине.
    
- У теста есть набор вопросов.
    

---

## Вопрос (`question`)

**Смысл:** один вопрос внутри теста.

**Структура:**

```sql
CREATE TABLE question (
    id SERIAL PRIMARY KEY,
    test_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    text TEXT,
    version INT DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    root_id INT,
    position INT NOT NULL DEFAULT 1;
    FOREIGN KEY (test_id) REFERENCES test(id)
);
```

- `id` — идентификатор вопроса.
    
- `test_id` — ссылка на тест.
    
- `title` — краткая формулировка/название вопроса.
    
- `text` — полный текст, если нужен.
    
- `version` — версия вопроса (чтобы различать изменения во времени).
    
- `root_id` — корень вопроса, нужен чтобы находить разные версии одного и того же вопроса.
    
- `is_deleted` — флаг для мягкого удаления.
    

**Логика:**

- Один тест содержит много вопросов.
    
- У каждого вопроса есть варианты ответа.
    

---

## Вариант ответа (`answer_option`)

**Смысл:** один возможный ответ для конкретного вопроса.

**Структура:**

```sql
CREATE TABLE answer_option (
    id SERIAL PRIMARY KEY,
    question_id INT NOT NULL,
    text VARCHAR(500) NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES question(id)
);
```
- `id` — идентификатор варианта.
    
- `question_id` — ссылка на вопрос.
    
- `text` — текст варианта ответа.
    
- `is_correct` — флаг правильности.
    

**Логика:**

- У вопроса может быть несколько вариантов, один или несколько из них помечаются как правильные.
    

---

## Пользователь (`users`)

**Смысл:** студент или преподаватель.

**Структура:**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    email VARCHAR(150) NOT NULL UNIQUE
);
```

- `id` — идентификатор пользователя.
    
- `full_name` — ФИО.
    
- `is_blocked` — может ли пользователь пользоваться системой.
    
- `created_at` — дата регистрации.

- `email` - почта Ы
    

**Логика:**

- Пользователь может быть студентом на разных дисциплинах.
    
- Пользователь может быть преподавателем дисциплин через `discipline.teacher_id`.
    
- Пользователь проходит тесты, создавая попытки в `attempt`.
    

---

## Пользователи на дисциплинах (`user_discipline`)

**Смысл:** связь «какой студент записан на какую дисциплину».

**Структура:**

```sql
CREATE TABLE user_discipline (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    discipline_id INT REFERENCES discipline(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, discipline_id)
);
```

- `user_id` — студент.
    
- `discipline_id` — дисциплина.
    

**Логика:**

- Пара `(user_id, discipline_id)` уникальна: один студент может быть записан на дисциплину только один раз.
    
- При удалении пользователя или дисциплины записи связи удаляются автоматически.
    

---

## Попытка пройти тест (`attempt`)

**Смысл:** одна попытка пользователя пройти конкретный тест.

**Структура:**

```sql
CREATE TABLE attempt (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    test_id INT NOT NULL REFERENCES test(id),
    score INT,
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'expired'
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    version INT DEFAULT 1,
    UNIQUE (user_id, test_id)
);
```
- `id` — идентификатор попытки.
    
- `user_id` — кто проходит тест.
    
- `test_id` — какой тест.
    
- `score` — набранный балл (может быть заполнен после завершения).
    
- `status` — состояние: в процессе, завершён, просрочен и т.п.
    
- `started_at` / `completed_at` — время начала и окончания.
    
- `version` — версия логики подсчёта/структуры теста (опционально).
    
- `UNIQUE (user_id, test_id)` — у пользователя не более одной активной попытки для теста.
    

---

## Ответ пользователя в попытке (`user_answer`)

**Смысл:** что именно пользователь выбрал в рамках попытки.

**Структура:**

```sql
CREATE TABLE user_answer (
    id SERIAL PRIMARY KEY,
    attempt_id INT REFERENCES attempt(id) ON DELETE CASCADE,
    question_id INT REFERENCES question(id),
    answer_option_id INT REFERENCES answer_option(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (attempt_id, question_id)
);
```

- `id` — идентификатор записи.
    
- `attempt_id` — к какой попытке относится ответ.
    
- `question_id` — на какой вопрос отвечали.
    
- `answer_option_id` — какой вариант выбрали.
    
- `created_at` — когда ответ был зафиксирован.
    
- `UNIQUE (attempt_id, question_id)` — в одной попытке на один вопрос можно дать только один вариант ответа.
    

**Интерпретация:**  
Каждая строка означает: «пользователь X в попытке Y на вопрос Z выбрал вариант W».

---

## Роли пользователя (`user_role`)

**Смысл:** роли пользователя в системе (1:N).

**Структура:**

```sql
CREATE TABLE user_role (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL
);
```

- `id` — идентификатор роли.
    
- `user_id` — ссылка на пользователя.
    
- `role` — название роли (например, `student`, `teacher`, `admin`).
    

**Логика:**

- У одного пользователя может быть много ролей.