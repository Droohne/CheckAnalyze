-- name: CreateProductName :one
INSERT INTO product_names (name) 
VALUES ($1) 
ON CONFLICT (name) DO NOTHING 
RETURNING *;

-- name: GetProductNameByID :one
SELECT * FROM product_names WHERE id = $1;

-- name: GetProductNameByName :one
SELECT * FROM product_names WHERE name = $1;

-- name: ListProductNames :many
SELECT * FROM product_names ORDER BY name;

-- name: GetOrCreateProductName :one
WITH inserted AS (
    INSERT INTO product_names (name) 
    VALUES ($1) 
    ON CONFLICT (name) DO NOTHING 
    RETURNING *
)
SELECT * FROM inserted
UNION ALL
SELECT * FROM product_names WHERE name = $1
LIMIT 1;

-- name: ListProductNamesWithCount :many
SELECT 
    pn.id,
    pn.name,
    COUNT(p.product_id) as usage_count
FROM product_names pn
LEFT JOIN products p ON pn.id = p.product_id
GROUP BY pn.id, pn.name
ORDER BY usage_count DESC, pn.name;