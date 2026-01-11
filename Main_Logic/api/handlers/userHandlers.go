package handlers

import (
	"encoding/json"
	"log"
	"main_logic/core"
	"net/http"
)

// Users
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
