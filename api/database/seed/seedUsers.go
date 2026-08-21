package seed

import (
	"context"
	"fmt"
	"log/slog"

	"CheckAnalyze/database"
	"CheckAnalyze/database/sqlc"

	"golang.org/x/crypto/bcrypt"
)

func SeedUsers(ctx context.Context, db *database.Database) error {
	// Check if user exists
	_, err := db.GetUserByEmail(ctx, "admin@gmail.com")
	if err == nil {
		slog.Info("admin user already exists, skipping seed")
		return nil
	}

	// Generate hash at runtime
	hash, err := bcrypt.GenerateFromPassword([]byte("23Hf)0!J&9Wqk"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	_, err = db.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        "admin@gmail.com",
		PasswordHash: string(hash),
		Name:         "Admin",
	})
	if err != nil {
		return fmt.Errorf("failed to seed admin: %w", err)
	}

	slog.Info("admin user created", "email", "admin@gmail.com")
	return nil
}
