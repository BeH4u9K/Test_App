package handlers

import (
	"encoding/json"
	"log"
	"main_logic/core"
	"net/http"
)

func GetQuestionsHandler(w http.ResponseWriter, r *http.Request) {
	testID, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}
	res := make([]core.QuestionListItem, 0)
	res, err = core.GetQuestions(testID)
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

func GetQuestionHandler(w http.ResponseWriter, r *http.Request) {
	testID, err := GetIDFromVars(w, r, "test_id")
	if err != nil {
		return
	}
	questionID, err := GetIDFromVars(w, r, "question_id")
	if err != nil {
		return
	}

	var req struct {
		Version int `json:"version"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	var q core.Question
	q, err = core.GetQuestion(testID, questionID, req.Version)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(q)
}

func CreateQuestionHandler(w http.ResponseWriter, r *http.Request) {
	testID, err := GetIDFromVars(w, r, "test_id")
	if err != nil {
		return
	}

	var req struct {
		Title   string              `json:"title"`
		Text    string              `json:"text"`
		Answers []core.AnswerOption `json:"answers"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	id, err := core.CreateQuestion(testID, req.Title, req.Text, req.Answers)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(IDResponse{ID: id})

}

func UpdateQuestionHandler(w http.ResponseWriter, r *http.Request) {

	var req struct {
		RootID     int                 `json:"root_id"`
		NewTitle   string              `json:"new_title"`
		NewText    string              `json:"new_text"`
		NewAnswers []core.AnswerOption `json:"new_answers"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	id, err := core.UpdateQuestion(req.RootID, req.NewTitle, req.NewText, req.NewAnswers)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(IDResponse{ID: id})
}

func DeleteQuestionHandler(w http.ResponseWriter, r *http.Request) {
	testID, err := GetIDFromVars(w, r, "test_id")
	if err != nil {
		return
	}
	questionID, err := GetIDFromVars(w, r, "question_id")
	if err != nil {
		return
	}

	err = core.DeleteQuestion(testID, questionID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "Question deleted successfully"})
}
