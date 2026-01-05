package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"

	"main_logic/storage"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")

	var err error
	storage.DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}

	if err = storage.DB.Ping(); err != nil {
		log.Fatalf("ping db: %v", err)
	}
	defer storage.DB.Close()

	http.ListenAndServe(":8080", nil)
}
