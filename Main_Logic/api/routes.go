package api

import (
	"main_logic/api/handlers"
	"main_logic/api/middleware"

	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	api := r.PathPrefix("/api/v1").Subrouter()

	// Middleware
	api.Use(middleware.ValidateStringsMiddleware)

	// Disciplines
	api.HandleFunc("/disciplines", handlers.ListDisciplinesHandler).Methods("GET")
	api.HandleFunc("/disciplines", handlers.CreateDisciplineHandler).Methods("POST")
	api.HandleFunc("/disciplines/{id:[0-9]+}", handlers.GetDisciplineHandler).Methods("GET")
	api.HandleFunc("/disciplines/{id:[0-9]+}", handlers.UpdateDisciplineHandler).Methods("PUT")
	api.HandleFunc("/disciplines/{id:[0-9]+}", handlers.DeleteDisciplineHandler).Methods("DELETE")

	// Tests
	api.HandleFunc("/disciplines/{id:[0-9]+}/tests", handlers.GetDisciplineTestsHandler).Methods("GET")
	api.HandleFunc("/disciplines/{id:[0-9]+}/tests", handlers.CreateTestHandler).Methods("POST")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}", handlers.GetTestStateHandler).Methods("GET")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}", handlers.UpdateTestStateHandler).Methods("PUT")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}", handlers.DeleteTestHandler).Methods("DELETE")

	// Students
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/students", handlers.GetDisciplineStudentsHandler).Methods("GET")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/students/{userID:[0-9]+}", handlers.AddStudentHandler).Methods("POST")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/students/{userID:[0-9]+}", handlers.RemoveStudentHandler).Methods("DELETE")

	// Users
	api.HandleFunc("users/{id:[0-9]+}", handlers.GetUserInfoHandler).Methods("GET")
	api.HandleFunc("users/{id:[0-9]+}/roles", handlers.GetUserRolesHandler).Methods("GET")
	api.HandleFunc("users/{id:[0-9]+}/roles", handlers.UpdateUserRolesHandler).Methods("PUT")
	api.HandleFunc("users/{id:[0-9]+}/state", handlers.IsUserBlockedHandler).Methods("GET")
	api.HandleFunc("users/{id:[0-9]+}/state", handlers.ChangeBlockStatusHandler).Methods("PUT")
}
