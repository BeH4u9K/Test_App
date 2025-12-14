package core

import (
	_ "github.com/joho/godotenv"
)

type DisciplineResponse struct {
	ID          int            `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Tests       []TestResponse `json:"tests"`
}

type TestResponse struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	IsActive bool   `json:"is_active"`
}
