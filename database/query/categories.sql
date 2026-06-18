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