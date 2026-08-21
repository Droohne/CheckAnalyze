package handlers

import (
	"CheckAnalyze/config"
	"CheckAnalyze/database/sqlc"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func generateToken(userID int32, email string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})
	return token.SignedString(config.JWTSecret)
}

func (h *Handlers) PostLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("login: invalid JSON", "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	user, err := h.DB.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		slog.Warn("login failed: user not found", "email", req.Email)
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		slog.Warn("login failed: password mismatch", "user_id", user.ID, "email", req.Email)
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Generate real JWT token
	token, err := generateToken(user.ID, user.Email)
	if err != nil {
		slog.Error("failed to generate token", "user_id", user.ID, "error", err)
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Convert pgtype.Text to string for name
	userName := ""
	if user.Name.Valid {
		userName = user.Name.String
	}

	slog.Info("user logged in", "user_id", user.ID, "email", user.Email)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"token": token,
		"user": map[string]interface{}{
			"id":    user.ID,
			"email": user.Email,
			"name":  userName,
		},
	}); err != nil {
		slog.Error("failed to encode login response", "user_id", user.ID, "error", err)
	}
}

func (h *Handlers) PostRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("register: invalid JSON", "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		slog.Warn("register: missing email or password")
		http.Error(w, "Email and password required", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("failed to hash password", "email", req.Email, "error", err)
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	user, err := h.DB.CreateUser(r.Context(), sqlc.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
	})
	if err != nil {
		slog.Warn("register failed: user already exists", "email", req.Email, "error", err)
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	slog.Info("user registered", "user_id", user.ID, "email", user.Email)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "User created successfully",
		"user":    user,
	}); err != nil {
		slog.Error("failed to encode register response", "user_id", user.ID, "error", err)
	}
}
