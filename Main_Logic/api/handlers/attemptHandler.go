package handlers

import (
	"encoding/json"
	"log"
	"main_logic/core"
	"net/http"
)

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

	id, err := core.CreateAttempt(userID, req.TestID)
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

func CompleteAttemptHandler(w http.ResponseWriter, r *http.Request) {

	userID, err := GetIDFromVars(w, r, "userID")
	if err != nil {
		return
	}

	attemptID, err := GetIDFromVars(w, r, "attemptID")
	if err != nil {
		return
	}

	err = core.CompleteAttempt(userID, attemptID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

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
