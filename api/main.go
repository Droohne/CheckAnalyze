package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"CheckAnalyze/database"
	"CheckAnalyze/database/sqlc"
	"CheckAnalyze/parser"
)

func ProcessCheckFile(filename string) error {
	startTotal := time.Now()
	ctx := context.Background()
	db := database.New()

	defer func() {
		if err := db.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}()

	connectStart := time.Now()
	if err := db.Connect(); err != nil {
		return fmt.Errorf("Failed to connect to database: %w", err)
	}
	fmt.Printf("Connect time: %v\n", time.Since(connectStart))

	parseStart := time.Now()
	check, err := parser.ParseCheckJSON(filename)
	if err != nil {
		return fmt.Errorf("failed to parse check: %w", err)
	}
	fmt.Printf("Parse JSON time: %v\n", time.Since(parseStart))

	// GetOrCreateCheck with struct
	checkStart := time.Now()
	dbCheck, err := db.GetOrCreateCheck(ctx, sqlc.GetOrCreateCheckParams{
		CheckID:  check.CheckID,
		FileName: filename,
	})
	if err != nil {
		return fmt.Errorf("Error getting check: %w", err)
	}
	fmt.Printf("GetOrCreateCheck time: %v\n", time.Since(checkStart))
	fmt.Printf("Database check ID: %d\n", dbCheck.ID)

	savedCount := 0
	itemsStart := time.Now()
	var categoryTime, productTime, createTime time.Duration

	for _, item := range check.Items {
		priceRub := float64(item.Price)
		quantity := item.Quantity
		if quantity == 0 {
			quantity = 1.0
		}

		// Get category
		categoryStart := time.Now()
		category, err := db.GetCategoryByProductNameOrCreateUndefined(ctx, item.Name)
		if err != nil {
			return fmt.Errorf("failed to get category: %w", err)
		}
		categoryTime += time.Since(categoryStart)

		// GetOrCreateProductName
		productStart := time.Now()
		product, err := db.GetOrCreateProductName(ctx, item.Name)
		if err != nil {
			return fmt.Errorf("failed to get/create product %s: %w", item.Name, err)
		}
		productTime += time.Since(productStart)

		// Create product entry
		createStart := time.Now()
		_, err = db.CreateProduct(ctx, sqlc.CreateProductParams{
			ProductID:      int32(product.ID),
			CheckID:        int32(dbCheck.ID),
			CategoryID:     int32(category.ID),
			PricePerUnit:   priceRub,
			AmountOrWeight: quantity,
		})
		if err != nil {
			return fmt.Errorf("failed to save product %s to check: %w", item.Name, err)
		}
		createTime += time.Since(createStart)
		savedCount++
	}
	fmt.Printf("Total items time: %v\n", time.Since(itemsStart))
	fmt.Printf("   └─ Category queries: %v\n", categoryTime)
	fmt.Printf("   └─ Product name queries: %v\n", productTime)
	fmt.Printf("   └─ Create product queries: %v\n", createTime)

	fmt.Printf("Saved %d items\n", savedCount)

	// Get stats
	statsStart := time.Now()
	stats, err := db.GetStats(ctx)
	if err != nil {
		return fmt.Errorf("failed to get stats: %w", err)
	}
	fmt.Printf("GetStats time: %v\n", time.Since(statsStart))

	fmt.Println("\nDatabase Statistics:")
	fmt.Printf("   Checks: %d\n", stats.TotalChecks)
	fmt.Printf("   Unique Products: %d\n", stats.TotalUniqueProducts)
	fmt.Printf("   Total Records: %d\n", stats.TotalProductEntries)

	fmt.Printf("\nTOTAL time: %v\n", time.Since(startTotal))
	return nil
}

func main() {
	files, err := os.ReadDir("checks")
	if err != nil {
		log.Fatalf("Error reading directory: %v", err)
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".json") {
			fmt.Printf("\n📁 Processing: %s\n", file.Name())
			if err := ProcessCheckFile(filepath.Join("checks", file.Name())); err != nil {
				log.Printf("Error: %v", err)
			}
			fmt.Println(strings.Repeat("-", 50))
		}
	}
}
