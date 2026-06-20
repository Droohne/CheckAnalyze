package handlers

import (
	"encoding/json"
	"fmt"
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
		fmt.Printf("ERROR: Unauthorized - no user_id in context\n")
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		fmt.Printf("ERROR: File too large: %v\n", err)
		writeJSONError(w, "File too large", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		fmt.Printf("ERROR: file required: %v\n", err)
		writeJSONError(w, "file required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if ext := filepath.Ext(header.Filename); ext != ".json" {
		fmt.Printf("ERROR: Only JSON files allowed, got: %s\n", ext)
		writeJSONError(w, "Only JSON files allowed", http.StatusBadRequest)
		return
	}

	tempFile, err := os.CreateTemp("", "check_*.json")
	if err != nil {
		fmt.Printf("ERROR: Failed to create temp file: %v\n", err)
		writeJSONError(w, "Failed to create temp file", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	if _, err := io.Copy(tempFile, file); err != nil {
		fmt.Printf("ERROR: Failed to save file: %v\n", err)
		writeJSONError(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	parsedCheck, err := parser.ParseCheckJSON(tempFile.Name())
	if err != nil {
		fmt.Printf("ERROR: Failed to parse check: %v\n", err)
		writeJSONError(w, "Failed to parse check: "+err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("Parsed check: ID=%s, Shop=%s, Address=%s, Items=%d\n",
		parsedCheck.CheckID, parsedCheck.ShopFullname, parsedCheck.Address, len(parsedCheck.Items))

	// Check if check already exists
	_, err = h.DB.GetCheckByCheckID(ctx, parsedCheck.CheckID)
	if err == nil {
		fmt.Printf("ERROR: Check already exists: %s\n", parsedCheck.CheckID)
		writeJSONError(w, "Check already exists: "+parsedCheck.CheckID, http.StatusConflict)
		return
	}
	fmt.Printf("Check %s not found in DB, proceeding...\n", parsedCheck.CheckID)

	// Step 1: Find or create brand
	brand, err := h.DB.GetBrandByName(ctx, parsedCheck.ShopFullname)
	if err != nil {
		fmt.Printf("Brand '%s' not found, creating... (error: %v)\n", parsedCheck.ShopFullname, err)
		brand, err = h.DB.CreateBrand(ctx, parsedCheck.ShopFullname)
		if err != nil {
			fmt.Printf("ERROR: Failed to create brand '%s': %v\n", parsedCheck.ShopFullname, err)
			writeJSONError(w, "Failed to create brand", http.StatusInternalServerError)
			return
		}
		fmt.Printf("Brand created: ID=%d, Name=%s\n", brand.ID, brand.Name)
	} else {
		fmt.Printf("Brand found: ID=%d, Name=%s\n", brand.ID, brand.Name)
	}

	// Step 2: Find or create shop with brand link
	shop, err := h.DB.GetShopByAddress(ctx, parsedCheck.Address)
	if err != nil {
		fmt.Printf("Shop at address '%s' not found, creating with brand_id=%d... (error: %v)\n",
			parsedCheck.Address, brand.ID, err)
		shop, err = h.DB.CreateShop(ctx, sqlc.CreateShopParams{
			BrandID: brand.ID,
			Address: parsedCheck.Address,
		})
		if err != nil {
			fmt.Printf("ERROR: Failed to create shop: %v\n", err)
			fmt.Printf("  BrandID: %d\n", brand.ID)
			fmt.Printf("  Address: %s\n", parsedCheck.Address)
			writeJSONError(w, "Failed to create shop", http.StatusInternalServerError)
			return
		}
		fmt.Printf("Shop created: ID=%d, BrandID=%d, Address=%s\n", shop.ID, shop.BrandID, shop.Address)
	} else {
		fmt.Printf("Shop found: ID=%d, BrandID=%d, Address=%s\n", shop.ID, shop.BrandID, shop.Address)
		if shop.BrandID != brand.ID {
			fmt.Printf("WARNING: Shop brand mismatch! Shop has brand_id=%d, check has brand_id=%d (%s)\n",
				shop.BrandID, brand.ID, parsedCheck.ShopFullname)
		}
	}

	// Step 3: Create the check
	dbCheck, err := h.DB.GetOrCreateCheck(ctx, sqlc.GetOrCreateCheckParams{
		CheckID:  parsedCheck.CheckID,
		ShopID:   shop.ID,
		UserID:   userID,
		FileName: header.Filename,
	})
	if err != nil {
		fmt.Printf("ERROR: Failed to create check: %v\n", err)
		writeJSONError(w, "Failed to create check", http.StatusInternalServerError)
		return
	}
	fmt.Printf("Check created: ID=%d, CheckID=%s\n", dbCheck.ID, dbCheck.CheckID)

	// Step 4: Process items
	for _, item := range parsedCheck.Items {
		priceRub := float64(item.Price) / 100
		quantity := item.Quantity
		if quantity == 0 {
			quantity = 1.0
		}
		normalizedName := parser.NormalizeProductName(item.Name)
		category, err := h.DB.GetCategoryByProductNameOrCreateUndefined(ctx, normalizedName)
		if err != nil {
			fmt.Printf("ERROR: Failed to get category for '%s': %v\n", normalizedName, err)
			writeJSONError(w, "Failed to get category", http.StatusInternalServerError)
			return
		}
		product, err := h.DB.GetOrCreateProductName(ctx, normalizedName)
		if err != nil {
			fmt.Printf("ERROR: Failed to get/create product '%s': %v\n", normalizedName, err)
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
			fmt.Printf("ERROR: Failed to save product '%s': %v\n", normalizedName, err)
			writeJSONError(w, "Failed to save product", http.StatusInternalServerError)
			return
		}
	}

	fmt.Printf("SUCCESS: Check %s uploaded with %d items\n", parsedCheck.CheckID, len(parsedCheck.Items))
	writeJSONSuccess(w, map[string]string{
		"message":  "Check uploaded successfully",
		"check_id": parsedCheck.CheckID,
	}, http.StatusCreated)
}
