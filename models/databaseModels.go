package models

import "time"

type DBCheck struct {
	ID        int       `db:"id"`
	CheckID   string    `db:"check_id"`
	FileName  string    `db:"file_name"`
	CreatedAt time.Time `db:"created_at"`
}

type DBProductName struct {
	ID   int    `db:"id"`
	Name string `db:"product_name_string"`
}

type DBProduct struct {
	ID             int     `db:"id"`
	ProductID      int     `db:"product_id"`
	CheckID        int     `db:"check_id"`
	PricePerUnit   float64 `db:"price_per_unit"`
	AmountOrWeight float64 `db:"amount_or_weight"`
}

// Many-to-Many связь для таблицы DBProduct (Идентичные продукты, например курица бедро 1 и курица бедро 2)
type ProductRelation struct {
	ID                 int `db:"id"`
	ProductID          int `db:"product_id"`
	IdenticalProductID int `db:"identical_product_id"`
}
