package seed

import (
	"context"
	"fmt"

	"CheckAnalyze/database"
	"CheckAnalyze/database/sqlc"
	"golang.org/x/crypto/bcrypt"
)

func SeedUsers(ctx context.Context, db *database.Database) {
	// Check if user exists
	_, err := db.GetUserByEmail(ctx, "admin@gmail.com")
	if err == nil {
		return // User already exists
	}

	// Generate hash at runtime
	hash, err := bcrypt.GenerateFromPassword([]byte("23Hf)0!J&9Wqk"), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Failed to hash password: %v\n", err)
		return
	}

	_, err = db.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        "admin@gmail.com",
		PasswordHash: string(hash),
		Name:         "Admin",
	})
	if err != nil {
		fmt.Printf("Failed to seed admin: %v\n", err)
	} else {
		fmt.Println("✅ Admin user created: admin@gmail.com / 23Hf)0!J&9Wqk")
	}
}