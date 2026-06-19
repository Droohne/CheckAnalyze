-- database/query/users.sql

-- name: CreateUser :one
INSERT INTO users (email, password_hash, name) 
VALUES ($1, $2, $3) 
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: UpdateUser :one
UPDATE users 
SET name = sqlc.arg(name)::text, email = sqlc.arg(email)::text
WHERE id = sqlc.arg(id)::int
RETURNING *;

-- name: UpdatePassword :exec
UPDATE users 
SET password_hash = $2
WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: GetUserStats :one
SELECT 
    COUNT(DISTINCT c.id) as total_checks,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT pn.id) as total_unique_products
FROM users u
LEFT JOIN checks c ON u.id = c.user_id
LEFT JOIN products p ON c.id = p.check_id
LEFT JOIN product_names pn ON p.product_id = pn.id
WHERE u.id = $1;