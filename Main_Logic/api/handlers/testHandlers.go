package handlers

import (
	"encoding/json"
	"log"
	"main_logic/core"
	"net/http"
)

func RemoveQuestionHandler(w http.ResponseWriter, r *http.Request) {

	disciplineID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	testID, err := GetIDFromVars(w, r, "testID")
	if err != nil {
		return
	}

	var req struct {
		RootID int `json:"root_id"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}
	err = core.RemoveQuestionFromTest(disciplineID, testID, req.RootID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "Question was successfuly removed"})
}

func AddQuestionHandler(w http.ResponseWriter, r *http.Request) {

	disciplineID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	testID, err := GetIDFromVars(w, r, "testID")
	if err != nil {
		return
	}

	var req struct {
		RootID int `json:"root_id"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	err = core.AddQuestionToTest(disciplineID, testID, req.RootID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "Question was successfuly add to test"})
}

func GetTestPassersHandler(w http.ResponseWriter, r *http.Request) {

	disciplineID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	testID, err := GetIDFromVars(w, r, "testID")
	if err != nil {
		return
	}

	testIDs := make([]int, 0)

	testIDs, err = core.GetTestPassers(disciplineID, testID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}
	type Name struct {
		FullName string `json:"full_name"`
	}
	result := make([]Name, 0)

	for _, v := range testIDs {
		name, err := core.GetFullName(v)
		if err != nil {
			log.Printf("ERROR: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
			return
		}
		var n Name
		n.FullName = name
		result = append(result, n)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func GetUserMarksHandler(w http.ResponseWriter, r *http.Request) {

	disciplineID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	testID, err := GetIDFromVars(w, r, "testID")
	if err != nil {
		return
	}

	userMarks := make([]core.AttemptShort, 0)
	userMarks, err = core.GetUserMarks(disciplineID, testID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userMarks)
}

func CheckUserAnswersHandler(w http.ResponseWriter, r *http.Request) {
	disciplineID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	testID, err := GetIDFromVars(w, r, "testID")
	if err != nil {
		return
	}

	res := make([]core.UserAnswer, 0)

	res, err = core.CheckUserAnswers(disciplineID, testID)
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

func GetTestHandler(w http.ResponseWriter, r *http.Request) {
	disciplineID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	testID, err := GetIDFromVars(w, r, "testID")
	if err != nil {
		return
	}

	t, err := core.GetTest(disciplineID, testID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(t)
}
