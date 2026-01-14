package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"main_logic/core"
	"net/http"
)

type ResponseMessage struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type IDResponse struct {
	ID int `json:"id"`
}

// Helper функции для валидации
func writeValidationError(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(ErrorResponse{Error: msg})
}

func requireNonEmpty(w http.ResponseWriter, fieldName, value string) bool {
	if value == "" {
		writeValidationError(w, fmt.Sprintf("%s cannot be empty", fieldName))
		return false
	}
	return true
}

func requirePositive(w http.ResponseWriter, fieldName string, value int) bool {
	if value <= 0 {
		writeValidationError(w, fmt.Sprintf("%s must be greater than 0", fieldName))
		return false
	}
	return true
}

// Disciplines
func ListDisciplinesHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Request: %s %s", r.Method, r.URL.Path)

	disciplines, err := core.GetAllDisciplines()
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(disciplines)
}

func GetDisciplineHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	discipline, err := core.GetDisciplineByID(id)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(discipline)
}

func CreateDisciplineHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Request: %s %s", r.Method, r.URL.Path)

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		TeacherID   int    `json:"teacher_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	// Валидация обязательных полей
	if !requireNonEmpty(w, "name", req.Name) {
		return
	}
	if !requireNonEmpty(w, "description", req.Description) {
		return
	}
	if !requirePositive(w, "teacher_id", req.TeacherID) {
		return
	}

	id, err := core.CreateDiscipline(req.Name, req.Description, req.TeacherID)
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

func UpdateDisciplineHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	// Валидация: хотя бы одно поле должно быть заполнено
	if req.Name == "" || req.Description == "" {
		writeValidationError(w, "name or description must be provided")
		return
	}

	err = core.ChangeDiscInfo(id, req.Name, req.Description)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "Discipline updated successfully"})
}

func DeleteDisciplineHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	err = core.DeleteDiscipline(id)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "Discipline deleted successfully"})
}

// Tests
func GetDisciplineTestsHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	tests, err := core.GetDisciplineInfo(id)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tests)
}

func GetTestStateHandler(w http.ResponseWriter, r *http.Request) {
	discID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	testID, err := GetIDFromVars(w, r, "testID")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (disciplineID=%d, testID=%d)", r.Method, r.URL.Path, discID, testID)

	isActive, err := core.CheckTestState(discID, testID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"is_active": isActive})
}

func UpdateTestStateHandler(w http.ResponseWriter, r *http.Request) {
	discID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	testID, err := GetIDFromVars(w, r, "testID")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (disciplineID=%d, testID=%d)", r.Method, r.URL.Path, discID, testID)

	var req struct {
		IsActive *bool `json:"is_active"` // pointer для отличия от false
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	// Валидация: is_active обязателен
	if req.IsActive == nil {
		writeValidationError(w, "is_active is required")
		return
	}

	err = core.ChangeTestState(*req.IsActive, discID, testID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "Test state updated successfully"})
}

func CreateTestHandler(w http.ResponseWriter, r *http.Request) {
	discID, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	// Валидация: name обязателен и не может быть пуст
	if !requireNonEmpty(w, "name", req.Name) {
		return
	}

	newID, err := core.AddTest(discID, req.Name)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(IDResponse{ID: newID})
}

func DeleteTestHandler(w http.ResponseWriter, r *http.Request) {
	discID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	testID, err := GetIDFromVars(w, r, "testID")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (disciplineID=%d, testID=%d)", r.Method, r.URL.Path, discID, testID)

	err = core.DeleteTest(discID, testID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "Test deleted successfully"})
}

// Students
func GetDisciplineStudentsHandler(w http.ResponseWriter, r *http.Request) {
	discID, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (disciplineID=%d)", r.Method, r.URL.Path, discID)

	students, err := core.GetListStudents(discID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(students)
}

func AddStudentHandler(w http.ResponseWriter, r *http.Request) {
	discID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	userID, err := GetIDFromVars(w, r, "userID")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (disciplineID=%d, userID=%d)", r.Method, r.URL.Path, discID, userID)

	err = core.AddUser(userID, discID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(ResponseMessage{Message: "Student added successfully"})
}

func RemoveStudentHandler(w http.ResponseWriter, r *http.Request) {
	discID, err := GetIDFromVars(w, r, "disciplineID")
	if err != nil {
		return
	}

	userID, err := GetIDFromVars(w, r, "userID")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (disciplineID=%d, userID=%d)", r.Method, r.URL.Path, discID, userID)

	err = core.RemoveUser(userID, discID)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "Student removed successfully"})
}
