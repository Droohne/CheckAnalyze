package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"CheckAnalyze/database/sqlc"
)

func (h *Handlers) GetListProducts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	products, err := h.DB.ListProductsWithDetails(ctx)
	if err != nil {
		slog.Error("failed to list products", "error", err)
		http.Error(w, "Failed to list products: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Debug("listed products with details", "count", len(products))

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(products); err != nil {
		slog.Error("failed to encode products response", "error", err)
	}
}

func (h *Handlers) GetProductById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("get product: missing id")
		http.Error(w, "product id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("get product: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid product id", http.StatusBadRequest)
		return
	}

	product, err := h.DB.GetProductWithDetails(ctx, int32(id))
	if err != nil {
		slog.Warn("product not found", "product_id", id, "error", err)
		http.Error(w, "Product not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(product); err != nil {
		slog.Error("failed to encode product response", "product_id", id, "error", err)
	}
}

func (h *Handlers) GetIdenticalProductsByProductId(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("get identical products: missing id")
		http.Error(w, "product id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("get identical products: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid product id", http.StatusBadRequest)
		return
	}

	products, err := h.DB.GetIdenticalProductsWithDetailsByProductNameId(ctx, int32(id))
	if err != nil {
		slog.Error("failed to get identical products", "product_id", id, "error", err)
		http.Error(w, "Failed to get identical products: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(products); err != nil {
		slog.Error("failed to encode identical products response", "product_id", id, "error", err)
	}
}

func (h *Handlers) PostAddIdenticalProduct(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		slog.Warn("add identical product: missing id")
		http.Error(w, "product id required", http.StatusBadRequest)
		return
	}

	productNameID, err := strconv.Atoi(idStr)
	if err != nil {
		slog.Warn("add identical product: invalid id", "id", idStr, "error", err)
		http.Error(w, "invalid product id", http.StatusBadRequest)
		return
	}

	var req struct {
		IdenticalProductNameID int32 `json:"identical_product_name_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Warn("add identical product: invalid JSON", "product_name_id", productNameID, "error", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.IdenticalProductNameID == 0 {
		slog.Warn("add identical product: missing identical_product_name_id", "product_name_id", productNameID)
		http.Error(w, "identical_product_name_id required", http.StatusBadRequest)
		return
	}

	relation, err := h.DB.CreateProductRelation(ctx, sqlc.CreateProductRelationParams{
		ProductNameID:          int32(productNameID),
		IdenticalProductNameID: req.IdenticalProductNameID,
	})
	if err != nil {
		slog.Error("failed to create product relation",
			"product_name_id", productNameID, "identical_product_name_id", req.IdenticalProductNameID, "error", err)
		http.Error(w, "Failed to add identical product: "+err.Error(), http.StatusInternalServerError)
		return
	}

	slog.Info("identical product relation created",
		"product_name_id", productNameID, "identical_product_name_id", req.IdenticalProductNameID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(relation); err != nil {
		slog.Error("failed to encode identical product response", "product_name_id", productNameID, "error", err)
	}
}

func (h *Handlers) GetLiveFeed(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		} else if err != nil {
			slog.Warn("live feed: invalid limit, using default", "limit", limitStr, "error", err)
		}
	}

	feed, err := h.DB.GetLiveFeed(ctx, int32(limit))
	if err != nil {
		slog.Error("failed to get live feed", "limit", limit, "error", err)
		http.Error(w, "Failed to get feed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(feed); err != nil {
		slog.Error("failed to encode live feed response", "error", err)
	}
}
