-- name: ListCategories :many
SELECT * FROM categories ORDER BY name;

-- name: GetCategoryByName :one
SELECT * FROM categories WHERE name = $1;

-- name: DeleteCategory :exec
DELETE FROM categories WHERE id = $1;

-- name: CreateCategory :one
INSERT INTO categories (name) 
VALUES ($1) 
ON CONFLICT (name) DO NOTHING 
RETURNING *;

-- name: GetCategoryByProductNameOrCreateUndefined :one
WITH product_category AS (
    SELECT 
        cat.id,
        cat.name
    FROM categories cat
    JOIN products p ON p.category_id = cat.id
    JOIN product_names pn ON p.product_id = pn.id
    WHERE pn.name = $1
    LIMIT 1
),
default_category AS (
    SELECT id, name FROM categories WHERE name = 'Uncategorized' LIMIT 1
)
SELECT id, name FROM product_category
UNION ALL
SELECT id, name FROM default_category
WHERE NOT EXISTS (SELECT 1 FROM product_category)
LIMIT 1;