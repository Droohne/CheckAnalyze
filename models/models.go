package models

import "time"

type Check struct {
    ID        string    `json:"_id"`
    CreatedAt time.Time `json:"createdAt"`
    Ticket    Ticket    `json:"ticket"`
}

type Ticket struct {
    Document Document `json:"document"`
}

type Document struct {
    Receipt Receipt `json:"receipt"`
}

type Receipt struct {
    User  string `json:"user"`
    Items []Item `json:"items"`
}

type Item struct {
    Name     string  `json:"name"`
    Price    int     `json:"price"`
    Quantity float64 `json:"quantity"`
}

type ParsedCheck struct {
    CheckID string
    User    string
    Items   []Item
}

type DBStats struct {
    Checks   int64
    Products int64
    Total    int64
}