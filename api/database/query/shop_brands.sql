-- name: CreateBrand :one
INSERT INTO shop_brands (name) 
VALUES ($1) 
ON CONFLICT (name) DO NOTHING 
RETURNING id, name;

-- name: GetBrandByName :one
SELECT id, name FROM shop_brands WHERE name = $1;

-- name: GetBrandByID :one
SELECT id, name FROM shop_brands WHERE id = $1;

-- name: ListBrands :many
SELECT id, name FROM shop_brands ORDER BY name;

-- name: SearchBrands :many
SELECT id, name FROM shop_brands WHERE name ILIKE '%' || $1 || '%' ORDER BY name;

-- name: UpdateBrand :one
UPDATE shop_brands 
SET name = $2 
WHERE id = $1 
RETURNING id, name;

-- name: DeleteBrand :exec
DELETE FROM shop_brands WHERE id = $1;