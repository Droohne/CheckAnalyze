-- database/query/shops.sql

-- name: ListShops :many
SELECT s.id, s.brand_id, s.address, s.lat, s.lng, b.name as brand_name
FROM shops s
JOIN shop_brands b ON s.brand_id = b.id
ORDER BY b.name;

-- name: GetShopByID :one
SELECT s.id, s.brand_id, s.address, s.lat, s.lng, b.name as brand_name
FROM shops s
JOIN shop_brands b ON s.brand_id = b.id
WHERE s.id = $1;

-- name: GetShopByAddress :one
SELECT id, brand_id, address, lat, lng FROM shops WHERE address = $1;

-- name: GetShopsByBrand :many
SELECT s.id, s.brand_id, s.address, s.lat, s.lng, b.name as brand_name
FROM shops s
JOIN shop_brands b ON s.brand_id = b.id
WHERE b.name = $1
ORDER BY s.address;

-- name: CreateShop :one
INSERT INTO shops (brand_id, address) 
VALUES ($1, $2) 
ON CONFLICT (brand_id, address) DO NOTHING 
RETURNING *;

-- name: UpdateShop :one
UPDATE shops 
SET address = $2, lat = $3, lng = $4
WHERE id = $1
RETURNING id, brand_id, address, lat, lng;

-- name: DeleteShop :exec
DELETE FROM shops WHERE id = $1;

-- name: SearchShops :many
SELECT s.id, s.brand_id, s.address, s.lat, s.lng, b.name as brand_name
FROM shops s
JOIN shop_brands b ON s.brand_id = b.id
WHERE b.name ILIKE '%' || $1 || '%' OR s.address ILIKE '%' || $1 || '%'
ORDER BY b.name;

-- name: GetShopStats :one
SELECT 
    s.id,
    b.name as brand_name,
    s.address,
    COUNT(DISTINCT c.id) as check_count,
    COUNT(p.id) as product_count,
    AVG(p.price_per_unit) as avg_price
FROM shops s
JOIN shop_brands b ON s.brand_id = b.id
LEFT JOIN checks c ON s.id = c.shop_id
LEFT JOIN products p ON c.id = p.check_id
WHERE s.id = $1
GROUP BY s.id, b.name, s.address;

-- name: CompareShopsByTemplate :many
SELECT 
    s.id,
    b.name as brand_name,
    s.address,
    SUM(p.price_per_unit * p.amount_or_weight)::float8 as total_price,
    COUNT(p.id) as product_count
FROM shops s
JOIN shop_brands b ON s.brand_id = b.id
JOIN checks c ON s.id = c.shop_id
JOIN products p ON c.id = p.check_id
JOIN product_names pn ON p.product_id = pn.id
WHERE pn.name = ANY($1::text[])
GROUP BY s.id, b.name, s.address
ORDER BY total_price ASC;

-- name: SearchShopsWithLocation :many
SELECT s.id, s.brand_id, s.address, s.lat, s.lng, b.name as brand_name
FROM shops s
JOIN shop_brands b ON s.brand_id = b.id
WHERE (b.name ILIKE '%' || $1 || '%' OR s.address ILIKE '%' || $1 || '%')
AND s.lat IS NOT NULL AND s.lng IS NOT NULL
ORDER BY b.name;

-- name: GetShopsNearby :many
SELECT s.id, s.brand_id, s.address, s.lat, s.lng, b.name as brand_name,
    ( 6371 * acos( cos( radians(sqlc.arg(lat_param)::float8) ) * cos( radians(s.lat) ) * cos( radians(s.lng) - radians(sqlc.arg(lng_param)::float8) ) + sin( radians(sqlc.arg(lat_param)::float8) ) * sin( radians(s.lat) ) ) ) AS distance
FROM shops s
JOIN shop_brands b ON s.brand_id = b.id
WHERE s.lat IS NOT NULL AND s.lng IS NOT NULL
    AND ( 6371 * acos( cos( radians(sqlc.arg(lat_param)::float8) ) * cos( radians(s.lat) ) * cos( radians(s.lng) - radians(sqlc.arg(lng_param)::float8) ) + sin( radians(sqlc.arg(lat_param)::float8) ) * sin( radians(s.lat) ) ) ) < sqlc.arg(radius_param)::float8
ORDER BY distance
LIMIT sqlc.arg(limit_param)::int;

-- name: GetShopCompareBreakdown :many
SELECT 
    pn.name as product_name,
    p.price_per_unit,
    p.amount_or_weight,
    SUM(p.price_per_unit * p.amount_or_weight) as total_price
FROM shops s
JOIN checks c ON s.id = c.shop_id
JOIN products p ON c.id = p.check_id
JOIN product_names pn ON p.product_id = pn.id
WHERE s.id = $1 AND pn.name = ANY($2::text[])
GROUP BY pn.name, p.price_per_unit, p.amount_or_weight
ORDER BY pn.name;

-- name: GetShopBreakdown :many
WITH matching_products AS (
    SELECT pn2.id, req.name as requested_name
    FROM product_names pn2
    CROSS JOIN unnest(sqlc.arg(products)::text[]) req(name)
    WHERE pn2.name = req.name
    UNION
    SELECT pr.identical_product_name_id, req.name
    FROM product_relations pr
    CROSS JOIN unnest(sqlc.arg(products)::text[]) req(name)
    JOIN product_names pn_req ON pn_req.name = req.name
    WHERE pr.product_name_id = pn_req.id
    UNION
    SELECT pr.product_name_id, req.name
    FROM product_relations pr
    CROSS JOIN unnest(sqlc.arg(products)::text[]) req(name)
    JOIN product_names pn_req ON pn_req.name = req.name
    WHERE pr.identical_product_name_id = pn_req.id
),
latest_checks AS (
    SELECT DISTINCT ON (p.product_id) 
        p.product_id,
        p.price_per_unit,
        p.amount_or_weight,
        pn.name as product_name,
        mp.requested_name
    FROM shops s
    JOIN checks c ON s.id = c.shop_id
    JOIN products p ON c.id = p.check_id
    JOIN product_names pn ON p.product_id = pn.id
    JOIN matching_products mp ON pn.id = mp.id
    WHERE s.id = sqlc.arg(shop_id)::int
    ORDER BY p.product_id, c.created_at DESC
)
SELECT 
    l.product_name,
    l.price_per_unit,
    l.amount_or_weight,
    (l.price_per_unit * l.amount_or_weight)::float8 as total_price,
    l.requested_name::text as matched_template_name
FROM latest_checks l
ORDER BY l.product_name;