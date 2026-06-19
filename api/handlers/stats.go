package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
)

func (h *Handlers) GetStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	stats, err := h.DB.GetStats(ctx)
	if err != nil {
		http.Error(w, "Failed to get stats: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	// Вот это возвращает ответ на запрос. 
	json.NewEncoder(w).Encode(stats)
}

func (h *Handlers) GetCategoryStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "category id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid category id", http.StatusBadRequest)
		return
	}

	stats, err := h.DB.GetCategoryStats(ctx, int32(id))
	if err != nil {
		http.Error(w, "Failed to get category stats: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}