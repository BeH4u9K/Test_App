package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func GetIDFromVars(w http.ResponseWriter, r *http.Request, paramName string) (int, error) {
	vars := mux.Vars(r)
	idString, ok := vars[paramName]
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Missing required parameter: " + paramName})
		return 0, http.ErrMissingBoundary
	}

	id, err := strconv.Atoi(idString)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid " + paramName + " format"})
		return 0, err
	}

	return id, nil
}
