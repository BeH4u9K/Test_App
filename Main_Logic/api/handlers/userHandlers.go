package handlers

import (
	"encoding/json"
	"log"
	"main_logic/core"
	"net/http"
)

// Users

func RegisterUserHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Request: %s %s", r.Method, r.URL.Path)

	var req struct {
		Email string `json:"email"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	if req.Email == "" {
		writeValidationError(w, "Email is required")
		return
	}

	id, err := core.RegisterUser(req.Email)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")

		switch err {
		case core.ErrInvalidEmail:
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid email format"})
		default:
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(ErrorResponse{Error: "Internal server error"})
		}
		return
	}

	log.Printf("User registered/retrieved - Email: %s, ID: %d", req.Email, id)

	w.Header().Set("Content-Type", "application/json")

	// Возвращаем 200 OK если пользователь уже существовал
	// Или 201 Created если был создан новый
	// Но для простоты всегда возвращаем 200
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(IDResponse{ID: id})
}

func GetUserInfoHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	user, err := core.GetUserData(id)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func GetUserRolesHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	roles, err := core.GetUserRoles(id)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roles)
}

func UpdateUserRolesHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	var req struct {
		Roles []string `json:"roles"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	err = core.UpdateUserRoles(id, req.Roles)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "User roles updated successfully"})
}

func IsUserBlockedHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	blocked, err := core.IsUserBlocked(id)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"is_blocked": blocked})
}

func ChangeBlockStatusHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	var req struct {
		IsBlocked *bool `json:"is_blocked"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	if req.IsBlocked == nil {
		writeValidationError(w, "is_blocked is required")
		return
	}

	err = core.ChangeBlockStatus(id, *req.IsBlocked)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "User block status changed successfully"})
}

func GetAllUsersHandler(w http.ResponseWriter, r *http.Request) {

	log.Printf("Request: %s %s", r.Method, r.URL.Path)

	users := make([]core.UserShort, 0)

	users, err := core.GetAllUsers()
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func GetUserNameHandler(w http.ResponseWriter, r *http.Request) {

	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	name, err := core.GetFullName(id)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")

	var response struct {
		Name string `json:"name"`
	}
	response.Name = name

	json.NewEncoder(w).Encode(response)

}

func ChangeUserNameHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	log.Printf("Request: %s %s (id=%d)", r.Method, r.URL.Path, id)

	var req struct {
		NewName string `json:"name"`
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		log.Printf("ERROR: Failed to decode request: %v", err)
		writeValidationError(w, "Invalid request body")
		return
	}

	err = core.ChangeUserName(id, req.NewName)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ResponseMessage{Message: "User name changed successfully", Data: req.NewName})
}

func IsUserExistsHandler(w http.ResponseWriter, r *http.Request) {
	id, err := GetIDFromVars(w, r, "id")
	if err != nil {
		return
	}

	exists, err := core.IsUserExists(id)
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"is_exists": exists})

}

func GetMaxIDHandler(w http.ResponseWriter, r *http.Request) {
	id, err := core.GetMaxID()
	if err != nil {
		log.Printf("ERROR: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: err.Error()})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(IDResponse{ID: id})

}
