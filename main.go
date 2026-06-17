package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"check_scan/database"
	"check_scan/parser"
)

func ProcessCheckFile(filename string) error {
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

	dbCheckID, err := db.GetOrCreateCheck(check.CheckID, filename)
	if err != nil {
		return fmt.Errorf("Error getting check ID: %w", err)
	}
	fmt.Printf("Database check ID: %d\n", dbCheckID)

	savedCount := 0
	for _, item := range check.Items {
		priceRub := float64(item.Price) / 100.0 
		quantity := item.Quantity
		if quantity == 0 {
			quantity = 1.0
		}

		productID, err := db.GetOrCreateProductName(item.Name)
		if err != nil {
			return fmt.Errorf("failed to get/create product %s: %w", item.Name, err)
		}

		if err := db.SaveProductToCheck(productID, dbCheckID, priceRub, quantity); err != nil {
			return fmt.Errorf("failed to save product %s to check: %w", item.Name, err)
		}
		savedCount++
	}

	fmt.Printf("Saved %d items\n", savedCount)


	stats, err := db.GetStats()
	if err != nil {
		return fmt.Errorf("failed to get stats: %w", err)
	}

	fmt.Println("\nDatabase Statistics:")
	fmt.Printf("   Checks: %d\n", stats.Checks)
	fmt.Printf("   Unique Products: %d\n", stats.Products)
	fmt.Printf("   Total Records: %d\n", stats.Total)

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
