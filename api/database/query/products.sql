-- name: CreateProduct :one
-- on conflict для молочки, идентичные товары идут разными позициями из-за специальных чеков
INSERT INTO products (product_id, check_id, category_id, price_per_unit, amount_or_weight) 
VALUES ($1, $2, $3, $4, $5) 
ON CONFLICT (product_id, check_id) DO UPDATE 
SET amount_or_weight = products.amount_or_weight + EXCLUDED.amount_or_weight,
    price_per_unit = EXCLUDED.price_per_unit
RETURNING *;

-- name: GetProductByID :one
SELECT * FROM products WHERE id = $1;

-- name: ListProductsByCheckID :many
SELECT * FROM products WHERE check_id = $1;

-- name: ListProductsByProductNameID :many
SELECT * FROM products WHERE product_id = $1;

-- name: GetProductWithDetails :one
SELECT 
    p.id,
    p.price_per_unit,
    p.amount_or_weight,
    pn.name as product_name
FROM products p
JOIN product_names pn ON p.product_id = pn.id
WHERE p.id = $1;

-- name: GetProductsByCheckID :many
SELECT 
    p.id,
    p.price_per_unit,
    p.amount_or_weight,
    pn.name as product_name,
    c.check_id as check_id,
    c.created_at
FROM products p
JOIN product_names pn ON p.product_id = pn.id
JOIN checks c ON p.check_id = c.id
WHERE p.check_id = $1
AND ($2::timestamp IS NULL OR c.created_at >= $2)
AND ($3::timestamp IS NULL OR c.created_at <= $3);

-- name: GetProductsByCategory :many
SELECT 
    p.id,
    p.price_per_unit,
    p.amount_or_weight,
    pn.name as product_name,
    cat.name as category_name,
    c.check_id as check_id,
    c.created_at
FROM products p
JOIN product_names pn ON p.product_id = pn.id
JOIN categories cat ON p.category_id = cat.id
JOIN checks c ON p.check_id = c.id
WHERE cat.id = $1
AND ($2::timestamp IS NULL OR c.created_at >= $2)
AND ($3::timestamp IS NULL OR c.created_at <= $3);

-- name: GetProductsByDateRange :many
SELECT 
    p.id,
    p.price_per_unit,
    p.amount_or_weight,
    pn.name as product_name,
    c.check_id as check_id,
    c.created_at
FROM products p
JOIN product_names pn ON p.product_id = pn.id
JOIN checks c ON p.check_id = c.id
WHERE ($1::timestamp IS NULL OR c.created_at >= $1)
AND ($2::timestamp IS NULL OR c.created_at <= $2)
ORDER BY c.created_at DESC;

-- name: GetProductsByCheckCount :many
SELECT 
    pn.id,
    pn.name,
    COUNT(DISTINCT p.check_id) as check_count,
    COUNT(p.id) as total_entries
FROM product_names pn
LEFT JOIN products p ON pn.id = p.product_id
GROUP BY pn.id, pn.name
HAVING COUNT(DISTINCT p.check_id) >= $1
ORDER BY check_count DESC;

-- name: GetProductsByName :many
SELECT 
    p.id,
    p.price_per_unit,
    p.amount_or_weight,
    pn.name as product_name,
    c.check_id as check_id,
    c.created_at
FROM products p
JOIN product_names pn ON p.product_id = pn.id
JOIN checks c ON p.check_id = c.id
WHERE pn.name ILIKE '%' || $1 || '%'
ORDER BY c.created_at DESC;

-- name: GetLiveFeed :many
SELECT 
    pn.name as product_name,
    b.name as store_name,
    p.price_per_unit as price,
    c.created_at
FROM products p
JOIN product_names pn ON p.product_id = pn.id
JOIN checks c ON p.check_id = c.id
JOIN shops s ON c.shop_id = s.id
JOIN shop_brands b ON s.brand_id = b.id
ORDER BY c.created_at DESC
LIMIT @limit_param::int;

-- name: GetProductStats :many
WITH canonical AS (
    SELECT 
        COALESCE(pr.product_name_id, pn.id) as canonical_id,
        pn.id as name_id
    FROM product_names pn
    LEFT JOIN product_relations pr ON pn.id = pr.identical_product_name_id
)
SELECT 
    c.canonical_id,
    pn_main.name as product_name,
    COUNT(p.id) as total_purchases,
    SUM(p.amount_or_weight) as total_amount,
    AVG(p.price_per_unit) as avg_price,
    MIN(p.price_per_unit) as min_price,
    MAX(p.price_per_unit) as max_price
FROM canonical c
JOIN product_names pn_main ON c.canonical_id = pn_main.id
JOIN products p ON c.name_id = p.product_id
GROUP BY c.canonical_id, pn_main.name
ORDER BY total_purchases DESC;

-- name: GetProductPriceHistory :many
SELECT 
    c.created_at,
    p.price_per_unit,
    p.amount_or_weight,
    c.check_id,
    pn.name as product_name,
    b.name as brand_name,
    s.address as shop_address
FROM products p
JOIN checks c ON p.check_id = c.id
JOIN product_names pn ON p.product_id = pn.id
JOIN shops s ON c.shop_id = s.id
JOIN shop_brands b ON s.brand_id = b.id
WHERE p.product_id = $1
   OR p.product_id IN (
       SELECT identical_product_name_id FROM product_relations WHERE product_name_id = $1
   )
   OR p.product_id IN (
       SELECT product_name_id FROM product_relations WHERE identical_product_name_id = $1
   )
ORDER BY b.name, s.address, c.created_at DESC;