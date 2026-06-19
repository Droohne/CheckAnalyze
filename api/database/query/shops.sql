-- database/query/shops.sql

-- name: ListShops :many
SELECT * FROM shops ORDER BY name;

-- name: GetShopByID :one
SELECT * FROM shops WHERE id = $1;

-- name: GetShopByName :one
SELECT * FROM shops WHERE name = $1;

-- name: CreateShop :one
INSERT INTO shops (name, address, lat, lng) 
VALUES ($1, $2, NULL, NULL) 
ON CONFLICT (name) DO NOTHING 
RETURNING id, name, address, lat, lng;

-- name: UpdateShop :one
UPDATE shops 
SET name = $2, address = $3
WHERE id = $1
RETURNING id, name, address;

-- name: DeleteShop :exec
DELETE FROM shops WHERE id = $1;

-- name: SearchShops :many
SELECT *
FROM shops
WHERE name ILIKE '%' || $1 || '%' OR address ILIKE '%' || $1 || '%'
ORDER BY name;

-- name: GetShopStats :one
SELECT 
    s.id,
    s.name,
    s.address,
    COUNT(DISTINCT c.id) as check_count,
    COUNT(p.id) as product_count,
    AVG(p.price_per_unit) as avg_price
FROM shops s
LEFT JOIN checks c ON s.id = c.shop_id
LEFT JOIN products p ON c.id = p.check_id
WHERE s.id = $1
GROUP BY s.id, s.name, s.address;

-- name: CompareShopsByTemplate :many
SELECT 
    s.id,
    s.name,
    s.address,
    SUM(p.price_per_unit * p.amount_or_weight) as total_price,
    COUNT(p.id) as product_count
FROM shops s
JOIN checks c ON s.id = c.shop_id
JOIN products p ON c.id = p.check_id
JOIN product_names pn ON p.product_id = pn.id
WHERE pn.name = ANY($1::text[])
GROUP BY s.id, s.name, s.address
ORDER BY total_price ASC;

-- name: SearchShopsWithLocation :many
SELECT * FROM shops
WHERE (name ILIKE '%' || $1::text || '%' OR address ILIKE '%' || $1::text || '%')
AND lat IS NOT NULL AND lng IS NOT NULL
ORDER BY name;

-- name: GetShopsNearby :many
SELECT id, name, address, lat, lng,
    ( 6371 * acos( cos( radians(sqlc.arg(lat_param)::float8) ) * cos( radians(lat) ) * cos( radians(lng) - radians(sqlc.arg(lng_param)::float8) ) + sin( radians(sqlc.arg(lat_param)::float8) ) * sin( radians(lat) ) ) ) AS distance
FROM shops
WHERE lat IS NOT NULL AND lng IS NOT NULL
    AND ( 6371 * acos( cos( radians(sqlc.arg(lat_param)::float8) ) * cos( radians(lat) ) * cos( radians(lng) - radians(sqlc.arg(lng_param)::float8) ) + sin( radians(sqlc.arg(lat_param)::float8) ) * sin( radians(lat) ) ) ) < sqlc.arg(radius_param)::float8
ORDER BY distance
LIMIT sqlc.arg(limit_param)::int;

-- name: GetShopByAddress :one
SELECT * FROM shops WHERE address = $1;