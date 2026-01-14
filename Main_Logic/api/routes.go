package api

import (
	"main_logic/api/handlers"

	"github.com/gorilla/mux"
)

func RegisterRoutes(r *mux.Router) {
	api := r.PathPrefix("/api/v1").Subrouter()

	// Disciplines
	api.HandleFunc("/disciplines", handlers.ListDisciplinesHandler).Methods("GET")
	api.HandleFunc("/disciplines", handlers.CreateDisciplineHandler).Methods("POST")
	api.HandleFunc("/disciplines/{id:[0-9]+}", handlers.GetDisciplineHandler).Methods("GET")
	api.HandleFunc("/disciplines/{id:[0-9]+}", handlers.UpdateDisciplineHandler).Methods("PUT")
	api.HandleFunc("/disciplines/{id:[0-9]+}", handlers.DeleteDisciplineHandler).Methods("DELETE")

	// Tests
	api.HandleFunc("/disciplines/{id:[0-9]+}/tests", handlers.GetDisciplineTestsHandler).Methods("GET")
	api.HandleFunc("/disciplines/{id:[0-9]+}/tests", handlers.CreateTestHandler).Methods("POST")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}/state", handlers.GetTestStateHandler).Methods("GET")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}/state", handlers.UpdateTestStateHandler).Methods("PUT")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}", handlers.DeleteTestHandler).Methods("DELETE")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}", handlers.GetTestHandler).Methods("GET")

	// Students
	api.HandleFunc("/disciplines/{id:[0-9]+}/students", handlers.GetDisciplineStudentsHandler).Methods("GET")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/students/{userID:[0-9]+}", handlers.AddStudentHandler).Methods("POST")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/students/{userID:[0-9]+}", handlers.RemoveStudentHandler).Methods("DELETE")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}/passers", handlers.GetTestPassersHandler).Methods("GET")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}/passers/marks", handlers.GetUserMarksHandler).Methods("GET")

	// Users
	api.HandleFunc("/users/{id:[0-9]+}", handlers.GetUserInfoHandler).Methods("GET")
	api.HandleFunc("/users/{id:[0-9]+}/roles", handlers.GetUserRolesHandler).Methods("GET")
	api.HandleFunc("/users/{id:[0-9]+}/roles", handlers.UpdateUserRolesHandler).Methods("PUT")
	api.HandleFunc("/users/{id:[0-9]+}/state", handlers.IsUserBlockedHandler).Methods("GET")
	api.HandleFunc("/users/{id:[0-9]+}/state", handlers.ChangeBlockStatusHandler).Methods("PUT")
	api.HandleFunc("/users", handlers.RegisterUserHandler).Methods("POST")
	api.HandleFunc("/users", handlers.GetAllUsersHandler).Methods("GET")
	api.HandleFunc("/users/{id:[0-9]+}/name", handlers.GetUserNameHandler).Methods("GET")
	api.HandleFunc("/users/{id:[0-9]+}/name", handlers.ChangeUserNameHandler).Methods("PUT")

	// Questions
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}", handlers.RemoveQuestionHandler).Methods("DELETE")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}", handlers.AddQuestionHandler).Methods("POST")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}/passers/attempts", handlers.CheckUserAnswersHandler).Methods("GET")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}/questions", handlers.GetQuestionsHandler).Methods("GET")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+/questions/{questionID:[0-9]+}}", handlers.GetQuestionHandler).Methods("GET")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}/questions", handlers.CreateQuestionHandler).Methods("POST")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}/questions", handlers.UpdateQuestionHandler).Methods("PUT")
	api.HandleFunc("/disciplines/{disciplineID:[0-9]+}/tests/{testID:[0-9]+}/questions/{questionID:[0-9]+}", handlers.DeleteQuestionHandler).Methods("DELETE")

	// Attempts
	api.HandleFunc("/users/{id:[0-9]+}/attempts", handlers.CreateAttemptHandler).Methods("POST")
	api.HandleFunc("/users/{userID:[0-9]+}/attempts/{attemptID:[0-9]+}", handlers.CompleteAttemptHandler).Methods("PUT")
	api.HandleFunc("/users/{userID:[0-9]+}/attempts/{attemptID:[0-9]+}", handlers.CheckAttemptHandler).Methods("GET")

}
