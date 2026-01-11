package middleware

import (
	"bytes"
	"io"
	"net/http"
	"strings"
)

// ValidateStringsMiddleware проверяет на наличие запрещённых управляющих символов во всех входящих данных
func ValidateStringsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		forbiddenChars := "\n\r\t\x00"

		// Проверка JSON body
		if r.Method == http.MethodPost || r.Method == http.MethodPut {
			if err := validateBody(r, forbiddenChars); err != nil {
				http.Error(w, "Invalid request: contains forbidden characters", http.StatusBadRequest)
				return
			}
		}

		// Проверка query параметров
		if err := validateQueryParams(r, forbiddenChars); err != nil {
			http.Error(w, "Invalid request: contains forbidden characters", http.StatusBadRequest)
			return
		}

		// Проверка URL path
		if err := validatePath(r, forbiddenChars); err != nil {
			http.Error(w, "Invalid request: contains forbidden characters", http.StatusBadRequest)
			return
		}

		// Всё прошло проверку, идём дальше
		next.ServeHTTP(w, r)
	})
}

// validateBody проверяет JSON body на запрещённые символы и восстанавливает body для дальнейшего использования в хендлерах
func validateBody(r *http.Request, forbiddenChars string) error {
	if r.Body == nil {
		return nil
	}

	// Читаем body в буфер
	var buf bytes.Buffer
	tee := io.TeeReader(r.Body, &buf)
	bodyBytes, err := io.ReadAll(tee)
	if err != nil {
		return err
	}

	// Восстанавливаем body для хендлера
	r.Body = io.NopCloser(&buf)

	// Проверяем на запрещённые символы
	if strings.ContainsAny(string(bodyBytes), forbiddenChars) {
		return errForbiddenChars
	}

	return nil
}

// validateQueryParams проверяет все query параметры
func validateQueryParams(r *http.Request, forbiddenChars string) error {
	query := r.URL.Query()
	for _, values := range query {
		for _, value := range values {
			if strings.ContainsAny(value, forbiddenChars) {
				return errForbiddenChars
			}
		}
	}
	return nil
}

// validatePath проверяет URL path
func validatePath(r *http.Request, forbiddenChars string) error {
	if strings.ContainsAny(r.URL.Path, forbiddenChars) {
		return errForbiddenChars
	}
	return nil
}

// Простая ошибка
type simpleError string

func (e simpleError) Error() string {
	return string(e)
}

const errForbiddenChars = simpleError("forbidden characters")
