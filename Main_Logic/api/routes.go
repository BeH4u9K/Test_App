package api

import (
	"main_logic/api/handlers"

	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	api := r.PathPrefix("/api/v1").Subrouter()
	api.HandleFunc("/disciplines", handlers.GetAllDisciplinesHandler).Methods("GET")
	api.HandleFunc("/disciplines/{id:[0-9]+}", handlers.GetDisciplineHandler).Methods("GET")
}
