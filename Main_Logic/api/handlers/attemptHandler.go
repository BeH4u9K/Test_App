package handlers

import (
	"encoding/json"
	"log"
	"main_logic/core"
	"net/http"
)

// Структуры для парсинга ответов
type UserAnswer struct {
	QuestionID     int `json:"question_id"`
	AnswerOptionID int `json:"answer_option_id"`
}

type CompleteAttemptRequest struct {
	Answers []UserAnswer `json:"answers"`
}

func CreateAttemptHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	var req struct {
		TestID int `json:"test_id"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	response, err := core.CreateAttempt(userID, req.TestID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func CompleteAttemptHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := GetIDFromVars(w, r, "userID")
	if err != nil {
		return
	}

	attemptID, err := GetIDFromVars(w, r, "attemptID")
	if err != nil {
		return
	}

	// Парсим JSON с ответами
	var req CompleteAttemptRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	// Конвертируем в тип core
	answers := make([]core.UserAnswerData, len(req.Answers))
	for i, a := range req.Answers {
		answers[i] = core.UserAnswerData{
			QuestionID:   a.QuestionID,
			AnswerOption: a.AnswerOptionID,
		}
	}

	// Вызываем обновленную функцию с ответами
	err = core.CompleteAttempt(userID, attemptID, answers)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	// Успешный ответ
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Attempt completed successfully",
	})
}

func CheckAttemptHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := GetIDFromVars(w, r, "userID")
	if err != nil {
		return
	}

	attemptID, err := GetIDFromVars(w, r, "attemptID")
	if err != nil {
		return
	}

	testID, err := core.GetTestIdByAttemptId(attemptID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	var res core.AttemptCheckResult
	res, err = core.CheckAttempt(userID, testID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
