package handlers

import (
	"encoding/json"
	"log"
	"main_logic/core"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func GetAllDisciplinesHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GET /disciplines")
	disciplines, err := core.GetAllDisciplines()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application-json")

	if err := json.NewEncoder(w).Encode(disciplines); err != nil {

		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func GetDisciplineHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idString, ok := vars["id"]
	if !ok {
		log.Println("ID is missing in parameters")
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	id, err := strconv.Atoi(idString)
	if err != nil {
		http.Error(w, "Invalid discipline ID", http.StatusBadRequest)
		return
	}
	log.Printf("GET /disciplines{id:%d}\n", id)
	discipline, err := core.GetDisciplineByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(discipline)

}
