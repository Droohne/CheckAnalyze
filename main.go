package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"CheckAnalyze/database"
	"CheckAnalyze/database/sqlc"
	"CheckAnalyze/parser"
)

func ProcessCheckFile(filename string) error {
	ctx := context.Background()
	db := database.New()

	defer func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}()

	if err := db.Connect(); err != nil {
		return fmt.Errorf("Failed to connect to database: %w", err)
	}

	check, err := parser.ParseCheckJSON(filename)
	if err != nil {
		return fmt.Errorf("failed to parse check: %w", err)
	}

	// GetOrCreateCheck with struct
	dbCheck, err := db.GetOrCreateCheck(ctx, sqlc.GetOrCreateCheckParams{
		CheckID:  check.CheckID,
		FileName: filename,
	})
	if err != nil {
		return fmt.Errorf("Error getting check: %w", err)
	}
	fmt.Printf("Database check ID: %d\n", dbCheck.ID)

	// Get or create default category
	category, err := db.CreateCategory(ctx, "Default")
	if err != nil {
		return fmt.Errorf("failed to get/create category: %w", err)
	}

	savedCount := 0
	for _, item := range check.Items {
		priceRub := float64(item.Price) / 100.0
		quantity := item.Quantity
		if quantity == 0 {
			quantity = 1.0
		}

		// GetOrCreateProductName with just name (single param)
		product, err := db.GetOrCreateProductName(ctx, item.Name)
		if err != nil {
			return fmt.Errorf("failed to get/create product %s: %w", item.Name, err)
		}

		// Create product entry with struct
		_, err = db.CreateProduct(ctx, sqlc.CreateProductParams{
			ProductID:       int32(product.ID),
			CheckID:         int32(dbCheck.ID),
			CategoryID:      int32(category.ID),
			PricePerUnit:    priceRub,
			AmountOrWeight:  quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to save product %s to check: %w", item.Name, err)
		}
		savedCount++
	}

	fmt.Printf("Saved %d items\n", savedCount)

	// Get stats
	stats, err := db.GetStats(ctx)
	if err != nil {
		return fmt.Errorf("failed to get stats: %w", err)
	}

	fmt.Println("\nDatabase Statistics:")
	fmt.Printf("   Checks: %d\n", stats.TotalChecks)
	fmt.Printf("   Unique Products: %d\n", stats.TotalUniqueProducts)
	fmt.Printf("   Total Records: %d\n", stats.TotalProductEntries)

	return nil
}

func main() {
	files, err := os.ReadDir("checks")
	if err != nil {
		log.Fatalf("Error reading directory: %v", err)
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".json") {
			if err := ProcessCheckFile(filepath.Join("checks", file.Name())); err != nil {
				log.Printf("Error: %v", err)
			}
		}
	}
}