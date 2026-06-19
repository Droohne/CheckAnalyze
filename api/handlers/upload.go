package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"CheckAnalyze/database/sqlc"
	"CheckAnalyze/parser"
)

func writeJSONError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
}

func writeJSONSuccess(w http.ResponseWriter, data map[string]string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (h *Handlers) PostUploadCheck(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		writeJSONError(w, "File too large", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeJSONError(w, "file required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if ext := filepath.Ext(header.Filename); ext != ".json" {
		writeJSONError(w, "Only JSON files allowed", http.StatusBadRequest)
		return
	}

	tempFile, err := os.CreateTemp("", "check_*.json")
	if err != nil {
		writeJSONError(w, "Failed to create temp file", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	if _, err := io.Copy(tempFile, file); err != nil {
		writeJSONError(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	parsedCheck, err := parser.ParseCheckJSON(tempFile.Name())
	if err != nil {
		writeJSONError(w, "Failed to parse check: "+err.Error(), http.StatusBadRequest)
		return
	}

	_, err = h.DB.GetCheckByCheckID(ctx, parsedCheck.CheckID)
	if err == nil {
		writeJSONError(w, "Check already exists: "+parsedCheck.CheckID, http.StatusConflict)
		return
	}

	shop, err := h.DB.GetShopByAddress(ctx, parsedCheck.Address)
	if err != nil {
		shop, err = h.DB.CreateShop(ctx, sqlc.CreateShopParams{
			Name:    parsedCheck.ShopFullname,
			Address: parsedCheck.Address,
		})
		if err != nil {
			writeJSONError(w, "Failed to create shop", http.StatusInternalServerError)
			return
		}
	}

	dbCheck, err := h.DB.GetOrCreateCheck(ctx, sqlc.GetOrCreateCheckParams{
		CheckID:  parsedCheck.CheckID,
		ShopID:   shop.ID,
		UserID:   userID,
		FileName: header.Filename,
	})
	if err != nil {
		writeJSONError(w, "Failed to create check", http.StatusInternalServerError)
		return
	}

	for _, item := range parsedCheck.Items {
		priceRub := float64(item.Price) / 100
		quantity := item.Quantity
		if quantity == 0 {
			quantity = 1.0
		}

		category, err := h.DB.GetCategoryByProductNameOrCreateUndefined(ctx, item.Name)
		if err != nil {
			writeJSONError(w, "Failed to get category", http.StatusInternalServerError)
			return
		}

		product, err := h.DB.GetOrCreateProductName(ctx, item.Name)
		if err != nil {
			writeJSONError(w, "Failed to get/create product", http.StatusInternalServerError)
			return
		}

		_, err = h.DB.CreateProduct(ctx, sqlc.CreateProductParams{
			ProductID:      product.ID,
			CheckID:        dbCheck.ID,
			CategoryID:     category.ID,
			PricePerUnit:   priceRub,
			AmountOrWeight: quantity,
		})
		if err != nil {
			writeJSONError(w, "Failed to save product", http.StatusInternalServerError)
			return
		}
	}

	writeJSONSuccess(w, map[string]string{
		"message":  "Check uploaded successfully",
		"check_id": parsedCheck.CheckID,
	}, http.StatusCreated)
}
