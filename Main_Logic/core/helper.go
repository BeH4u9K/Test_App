package core

import (
	"database/sql"
	"errors"
	"main_logic/storage"
)

func disciplineExists(id int) (bool, error) {
	var tmp int
	query := "SELECT 1 FROM discipline WHERE id = $1 AND is_deleted = FALSE"
	if err := storage.DB.QueryRow(query, id).Scan(&tmp); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func userExists(userID int) (bool, error) {
	var tmp int
	query := "SELECT 1 FROM users WHERE id = $1"
	if err := storage.DB.QueryRow(query, userID).Scan(&tmp); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func hasAttempts(testID int) (bool, error) {
	query := "SELECT COUNT(*) FROM attempt WHERE test_id = $1"

	var count int
	err := storage.DB.QueryRow(query, testID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
