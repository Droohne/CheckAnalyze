package parser

import (
    "encoding/json"
    "fmt"
    "os"

    "check_scan/models"
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
    checkID := checkItem.ID
    if checkID == "" {
        checkID = "unknown"
    }

    user := checkItem.Ticket.Document.Receipt.User
    if user == "" {
        user = "Unknown"
    }

    items := checkItem.Ticket.Document.Receipt.Items

    fmt.Printf("📄 Check ID: %s\n", checkID)
    fmt.Printf("👤 User: %s\n", user)
    fmt.Printf("📦 Items: %d\n", len(items))

    return &models.ParsedCheck{
        CheckID: checkID,
        User:    user,
        Items:   items,
    }, nil
}