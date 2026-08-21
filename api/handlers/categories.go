package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
)

func (h *Handlers) GetListCategories(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	categories, err := h.DB.ListCategories(ctx)
	if err != nil {
		slog.Error("failed to list categories", "error", err)
		http.Error(w, "Failed to list categories: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(categories); err != nil {
		slog.Error("failed to encode categories response", "error", err)
	}
}

func (h *Handlers) GetCategoryByName(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	name := r.URL.Query().Get("name")
	if strings.TrimSpace(name) == "" {
		slog.Warn("get category by name: missing name")
		http.Error(w, "category name required", http.StatusBadRequest)
		return
	}

	category, err := h.DB.GetCategoryByName(ctx, name)
	if err != nil {
		slog.Warn("category not found", "name", name, "error", err)
		http.Error(w, "Category not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(category); err != nil {
		slog.Error("failed to encode category response", "name", name, "error", err)
	}
}

func (h *Handlers) PostCreateCategory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("create category: invalid JSON", "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		slog.Warn("create category: missing name")
		http.Error(w, "category name required", http.StatusBadRequest)
		return
	}

	category, err := h.DB.CreateCategory(ctx, req.Name)
	if err != nil {
		slog.Error("failed to create category", "name", req.Name, "error", err)
		http.Error(w, "Failed to create category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Info("category created", "category_id", category.ID, "name", category.Name)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(category); err != nil {
		slog.Error("failed to encode create category response", "category_id", category.ID, "error", err)
	}
}

func (h *Handlers) DeleteCategoryById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("delete category: missing id")
		http.Error(w, "category id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("delete category: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid category id", http.StatusBadRequest)
		return
	}

	if err := h.DB.DeleteCategory(ctx, int32(id)); err != nil {
		slog.Error("failed to delete category", "category_id", id, "error", err)
		http.Error(w, "Failed to delete category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Info("category deleted", "category_id", id)

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) GetCategoryByProductNameOrCreateUndefined(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	name := r.URL.Query().Get("name")
	if strings.TrimSpace(name) == "" {
		slog.Warn("get category by product name: missing name")
		http.Error(w, "product name required", http.StatusBadRequest)
		return
	}

	category, err := h.DB.GetCategoryByProductNameOrCreateUndefined(ctx, name)
	if err != nil {
		slog.Error("failed to get/create category for product", "product_name", name, "error", err)
		http.Error(w, "Failed to get category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(category); err != nil {
		slog.Error("failed to encode category response", "product_name", name, "error", err)
	}
}
