package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
)

func (h *Handlers) GetStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	stats, err := h.DB.GetStats(ctx)
	if err != nil {
		slog.Error("failed to get stats", "error", err)
		http.Error(w, "Failed to get stats: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	// Вот это возвращает ответ на запрос.
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		slog.Error("failed to encode stats response", "error", err)
	}
}

func (h *Handlers) GetCategoryStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		slog.Warn("category stats requested without id")
		http.Error(w, "category id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("invalid category id", "id", idStr, "error", err)
		http.Error(w, "invalid category id", http.StatusBadRequest)
		return
	}

	stats, err := h.DB.GetCategoryStats(ctx, int32(id))
	if err != nil {
		slog.Error("failed to get category stats", "category_id", id, "error", err)
		http.Error(w, "Failed to get category stats: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		slog.Error("failed to encode category stats response", "error", err)
	}
}

func (h *Handlers) GetProductPriceHistory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("invalid product id", "id", idStr, "error", err)
		http.Error(w, "invalid product id", http.StatusBadRequest)
		return
	}

	history, err := h.DB.GetProductPriceHistory(ctx, int32(id))
	if err != nil {
		slog.Error("failed to get price history", "product_id", id, "error", err)
		http.Error(w, "Failed to get price history: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(history); err != nil {
		slog.Error("failed to encode price history response", "error", err)
	}
}
