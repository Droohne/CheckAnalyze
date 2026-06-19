package parser

import (
	"encoding/json"
	"fmt"
	"os"

	"CheckAnalyze/models"
)

func ParseCheckJSON(filename string) (*models.ParsedCheck, error) {
	if _, err := os.Stat(filename); os.IsNotExist(err) {
		return nil, fmt.Errorf("file %s not found: %w", filename, err)
	}

	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read file %s: %w", filename, err)
	}

	var checks []models.Check
	if err := json.Unmarshal(data, &checks); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	if len(checks) == 0 {
		return nil, fmt.Errorf("empty check array in file %s", filename)
	}

	checkItem := checks[0]

	user := checkItem.Ticket.Document.Receipt.ShopFullname
	if user == "" {
		user = "Unknown"
	}

	address := checkItem.Ticket.Document.Receipt.RetailPlaceAddress
	if address == "" {
		address = "Unknown"
	}

	items := checkItem.Ticket.Document.Receipt.Items

	fmt.Printf("📄 Check ID: %s\n", checkItem.ID)
	fmt.Printf("👤 User: %s\n", user)
	fmt.Printf("📍 Address: %s\n", address)
	fmt.Printf("📦 Items: %d\n", len(items))

	return &models.ParsedCheck{
		CheckID:      checkItem.ID,
		ShopFullname: user,
		Address:      address,
		Items:        items,
	}, nil
}
