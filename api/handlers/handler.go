package handlers

import (
	"CheckAnalyze/database"
)

type Handlers struct {
	DB *database.Database
}

func New(db *database.Database) *Handlers {
	return &Handlers{DB: db}
}