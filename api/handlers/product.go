package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"CheckAnalyze/database/sqlc"
)

func (h *Handlers) GetListProducts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	products, err := h.DB.ListProductsWithDetails(ctx)
	if err != nil {
		http.Error(w, "Failed to list products: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Printf("ListProductsWithDetails returned %d products\n", len(products))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func (h *Handlers) GetProductById(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "product id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid product id", http.StatusBadRequest)
		return
	}

	product, err := h.DB.GetProductWithDetails(ctx, int32(id))
	if err != nil {
		http.Error(w, "Product not found: "+err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func (h *Handlers) GetIdenticalProductsByProductId(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "product id required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid product id", http.StatusBadRequest)
		return
	}

	products, err := h.DB.GetIdenticalProductsWithDetailsByProductNameId(ctx, int32(id))
	if err != nil {
		http.Error(w, "Failed to get identical products: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func (h *Handlers) PostAddIdenticalProduct(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	idStr := r.PathValue("id")
	if idStr == "" {
		http.Error(w, "product id required", http.StatusBadRequest)
		return
	}

	productNameID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid product id", http.StatusBadRequest)
		return
	}

	var req struct {
		IdenticalProductNameID int32 `json:"identical_product_name_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.IdenticalProductNameID == 0 {
		http.Error(w, "identical_product_name_id required", http.StatusBadRequest)
		return
	}

	relation, err := h.DB.CreateProductRelation(ctx, sqlc.CreateProductRelationParams{
		ProductNameID:          int32(productNameID),
		IdenticalProductNameID: req.IdenticalProductNameID,
	})
	if err != nil {
		fmt.Printf("CreateProductRelation error: %v (productNameID=%d, identicalNameID=%d)\n", err, productNameID, req.IdenticalProductNameID)
		http.Error(w, "Failed to add identical product: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(relation)
}

func (h *Handlers) GetLiveFeed(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	limit := 20
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	feed, err := h.DB.GetLiveFeed(ctx, int32(limit))
	if err != nil {
		http.Error(w, "Failed to get feed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(feed)
}
