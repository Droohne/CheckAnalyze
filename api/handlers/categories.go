package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
)

func (h *Handlers) GetListCategories(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	categories, err := h.DB.ListCategories(ctx)
	if err != nil {
		http.Error(w, "Failed to list categories: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func (h *Handlers) GetCategoryByName(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	name := r.URL.Query().Get("name")
	if strings.TrimSpace(name) == "" {
		http.Error(w, "category name required", http.StatusBadRequest)
		return
	}

	category, err := h.DB.GetCategoryByName(ctx, name)
	if err != nil {
		http.Error(w, "Category not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(category)
}

func (h *Handlers) PostCreateCategory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Name) == "" {
		http.Error(w, "category name required", http.StatusBadRequest)
		return
	}

	category, err := h.DB.CreateCategory(ctx, req.Name)
	if err != nil {
		http.Error(w, "Failed to create category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(category)
}

func (h *Handlers) DeleteCategoryById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "category id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid category id", http.StatusBadRequest)
		return
	}

	if err := h.DB.DeleteCategory(ctx, int32(id)); err != nil {
		http.Error(w, "Failed to delete category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handlers) GetCategoryByProductNameOrCreateUndefined(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	name := r.URL.Query().Get("name")
	if strings.TrimSpace(name) == "" {
		http.Error(w, "product name required", http.StatusBadRequest)
		return
	}

	category, err := h.DB.GetCategoryByProductNameOrCreateUndefined(ctx, name)
	if err != nil {
		http.Error(w, "Failed to get category: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(category)
}