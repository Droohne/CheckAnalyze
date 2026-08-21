package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"CheckAnalyze/database/sqlc"

	"golang.org/x/crypto/bcrypt"
)

func (h *Handlers) GetProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// TODO: Get user ID from auth context
	userID := int32(1)

	user, err := h.DB.GetUserByID(ctx, userID)
	if err != nil {
		slog.Error("failed to get user profile", "user_id", userID, "error", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(user); err != nil {
		slog.Error("failed to encode profile response", "user_id", userID, "error", err)
	}
}

func (h *Handlers) PutUpdateProfile(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// TODO: Get user ID from auth context
	userID := int32(1)

	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("invalid JSON in profile update request", "user_id", userID, "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		slog.Warn("profile update missing email", "user_id", userID)
		http.Error(w, "email required", http.StatusBadRequest)
		return
	}

	user, err := h.DB.UpdateUser(ctx, sqlc.UpdateUserParams{
		ID:    userID,
		Name:  req.Name,
		Email: req.Email,
	})
	if err != nil {
		slog.Error("failed to update profile", "user_id", userID, "error", err)
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	slog.Info("profile updated", "user_id", userID)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(user); err != nil {
		slog.Error("failed to encode profile response", "user_id", userID, "error", err)
	}
}

func (h *Handlers) PutChangePassword(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// TODO: Get user ID from auth context
	userID := int32(1)

	var req struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("invalid JSON in password change request", "user_id", userID, "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		slog.Warn("password change missing fields", "user_id", userID)
		http.Error(w, "old_password and new_password required", http.StatusBadRequest)
		return
	}

	user, err := h.DB.GetUserByID(ctx, userID)
	if err != nil {
		slog.Error("failed to load user for password change", "user_id", userID, "error", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		slog.Warn("password change: old password mismatch", "user_id", userID)
		http.Error(w, "Invalid old password", http.StatusUnauthorized)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("failed to hash new password", "user_id", userID, "error", err)
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	if err := h.DB.UpdatePassword(ctx, sqlc.UpdatePasswordParams{
		ID:           userID,
		PasswordHash: string(hashedPassword),
	}); err != nil {
		slog.Error("failed to update password", "user_id", userID, "error", err)
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	slog.Info("password changed", "user_id", userID)

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// TODO: Get user ID from auth context
	userID := int32(1)

	if err := h.DB.DeleteUser(ctx, userID); err != nil {
		slog.Error("failed to delete account", "user_id", userID, "error", err)
		http.Error(w, "Failed to delete account", http.StatusInternalServerError)
		return
	}

	slog.Info("account deleted", "user_id", userID)

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) GetUserStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// TODO: Get user ID from auth context
	userID := int32(1)

	stats, err := h.DB.GetUserStats(ctx, userID)
	if err != nil {
		slog.Error("failed to get user stats", "user_id", userID, "error", err)
		http.Error(w, "Failed to get user stats", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		slog.Error("failed to encode user stats response", "user_id", userID, "error", err)
	}
}
