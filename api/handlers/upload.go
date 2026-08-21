package handlers

import (
	"CheckAnalyze/config"
	"CheckAnalyze/database/sqlc"
	"CheckAnalyze/parser"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func writeJSONError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(map[string]string{"message": message}); err != nil {
		slog.Error("failed to encode error response", "error", err)
	}
}

func writeJSONSuccess(w http.ResponseWriter, data map[string]string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("failed to encode success response", "error", err)
	}
}

func NormalizeAddress(addr string) string {
	n := strings.TrimSpace(addr)

	if idx := strings.Index(n, "Пермь"); idx != -1 {
		n = n[idx:]
	} else if idx := strings.Index(n, "Пермский"); idx != -1 {
		n = n[idx:]
	}

	n = regexp.MustCompile(`г\.\s*о\.?\s*`).ReplaceAllString(n, "")
	n = regexp.MustCompile(`^(город|г\.|г)\s*`).ReplaceAllString(n, "")

	n = regexp.MustCompile(`\.(\p{L})`).ReplaceAllString(n, ". $1")
	n = regexp.MustCompile(`\s+`).ReplaceAllString(n, " ")
	n = regexp.MustCompile(`,+`).ReplaceAllString(n, ",")
	n = regexp.MustCompile(`\s*,\s*`).ReplaceAllString(n, ", ")

	// Normalize "дом", "д.", "здание" → "д."
	n = regexp.MustCompile(`(?i)(дом|здание)\s*№?\s*`).ReplaceAllString(n, "д. ")

	n = strings.Trim(n, " ,")
	return n
}

func (h *Handlers) PostUploadCheck(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userID, ok := ctx.Value("user_id").(int32)
	if !ok {
		slog.Error("upload check: unauthorized, no user_id in context")
		writeJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	log := slog.With("user_id", userID)

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		log.Warn("upload check: file too large", "error", err)
		writeJSONError(w, "File too large", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		log.Warn("upload check: file required", "error", err)
		writeJSONError(w, "file required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if ext := filepath.Ext(header.Filename); ext != ".json" {
		log.Warn("upload check: invalid file extension", "extension", ext)
		writeJSONError(w, "Only JSON files allowed", http.StatusBadRequest)
		return
	}

	tempFile, err := os.CreateTemp("", "check_*.json")
	if err != nil {
		log.Error("upload check: failed to create temp file", "error", err)
		writeJSONError(w, "Failed to create temp file", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())
	defer tempFile.Close()

	if _, err := io.Copy(tempFile, file); err != nil {
		log.Error("upload check: failed to save file", "error", err)
		writeJSONError(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	parsedCheck, err := parser.ParseCheckJSON(tempFile.Name())
	if err != nil {
		log.Warn("upload check: failed to parse check", "error", err)
		writeJSONError(w, "Failed to parse check: "+err.Error(), http.StatusBadRequest)
		return
	}

	log = log.With("check_id", parsedCheck.CheckID)
	log.Info("check parsed",
		"shop", parsedCheck.ShopFullname,
		"address", parsedCheck.Address,
		"items", len(parsedCheck.Items),
	)

	// Check if check already exists
	_, err = h.DB.GetCheckByCheckID(ctx, parsedCheck.CheckID)
	if err == nil {
		log.Warn("upload check: check already exists")
		writeJSONError(w, "Check already exists: "+parsedCheck.CheckID, http.StatusConflict)
		return
	}
	log.Debug("check not found in DB, proceeding")

	// Step 1: Find or create brand
	brand, err := h.DB.GetBrandByName(ctx, parsedCheck.ShopFullname)
	if err != nil {
		log.Info("brand not found, creating", "brand_name", parsedCheck.ShopFullname, "lookup_error", err)
		brand, err = h.DB.CreateBrand(ctx, parsedCheck.ShopFullname)
		if err != nil {
			log.Error("failed to create brand", "brand_name", parsedCheck.ShopFullname, "error", err)
			writeJSONError(w, "Failed to create brand", http.StatusInternalServerError)
			return
		}
		log.Info("brand created", "brand_id", brand.ID, "brand_name", brand.Name)
	} else {
		log.Debug("brand found", "brand_id", brand.ID, "brand_name", brand.Name)
	}

	// Step 2: Find or create shop with brand link
	parsedCheck.Address = NormalizeAddress(parsedCheck.Address)
	shop, err := h.DB.GetShopByAddress(ctx, parsedCheck.Address)
	if err != nil {
		log.Info("shop not found, creating", "address", parsedCheck.Address, "brand_id", brand.ID, "lookup_error", err)
		shop, err = h.DB.CreateShop(ctx, sqlc.CreateShopParams{
			BrandID: brand.ID,
			Address: parsedCheck.Address,
		})
		if err != nil {
			log.Error("failed to create shop", "brand_id", brand.ID, "address", parsedCheck.Address, "error", err)
			writeJSONError(w, "Failed to create shop", http.StatusInternalServerError)
			return
		}
		log.Info("shop created", "shop_id", shop.ID, "brand_id", shop.BrandID, "address", shop.Address)
	} else {
		log.Debug("shop found", "shop_id", shop.ID, "brand_id", shop.BrandID, "address", shop.Address)
		if shop.BrandID != brand.ID {
			log.Warn("shop brand mismatch",
				"shop_id", shop.ID,
				"shop_brand_id", shop.BrandID,
				"check_brand_id", brand.ID,
				"check_brand_name", parsedCheck.ShopFullname,
			)
		}
	}

	// Step 3: Create the check
	parsedTime, err := time.Parse("2006-01-02T15:04:05", parsedCheck.DateTime)
	if err != nil {
		log.Warn("failed to parse check date, using current time", "date", parsedCheck.DateTime, "error", err)
		parsedTime = time.Now()
	}

	dbCheck, err := h.DB.GetOrCreateCheck(ctx, sqlc.GetOrCreateCheckParams{
		CheckID:   parsedCheck.CheckID,
		ShopID:    shop.ID,
		UserID:    userID,
		FileName:  header.Filename,
		CreatedAt: pgtype.Timestamp{Time: parsedTime, Valid: true},
	})
	if err != nil {
		log.Error("failed to create check", "error", err)
		writeJSONError(w, "Failed to create check", http.StatusInternalServerError)
		return
	}
	log.Info("check created", "db_check_id", dbCheck.ID, "date", parsedTime.Format("2006-01-02"))

	// Step 4: Process items
	for _, item := range parsedCheck.Items {
		priceRub := float64(item.Price) / 100
		quantity := item.Quantity
		if quantity == 0 {
			quantity = 1.0
		}

		normalizedName := parser.NormalizeProductName(item.Name)

		// Auto-categorize product
		categoryName := config.CategorizeProduct(normalizedName)
		category, err := h.DB.GetCategoryByName(ctx, categoryName)
		if err != nil {
			category, err = h.DB.CreateCategory(ctx, categoryName)
			if err != nil {
				log.Error("failed to create category", "category_name", categoryName, "product_name", normalizedName, "error", err)
				writeJSONError(w, "Failed to create category", http.StatusInternalServerError)
				return
			}
		}

		product, err := h.DB.GetOrCreateProductName(ctx, normalizedName)
		if err != nil {
			log.Error("failed to get/create product", "product_name", normalizedName, "error", err)
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
			log.Error("failed to save product", "product_name", normalizedName, "error", err)
			writeJSONError(w, "Failed to save product", http.StatusInternalServerError)
			return
		}
	}

	log.Info("check uploaded successfully", "items", len(parsedCheck.Items))
	writeJSONSuccess(w, map[string]string{
		"message":  "Check uploaded successfully",
		"check_id": parsedCheck.CheckID,
	}, http.StatusCreated)
}
