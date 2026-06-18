-- name: CreateCheck :one
INSERT INTO checks (check_id, file_name) 
VALUES ($1, $2) 
ON CONFLICT (check_id) DO NOTHING
RETURNING *;

-- name: GetCheckByID :one
SELECT * FROM checks WHERE id = $1;

-- name: GetCheckByCheckID :one
SELECT * FROM checks WHERE check_id = $1;

-- name: ListChecks :many
SELECT * FROM checks ORDER BY created_at DESC;

-- name: DeleteCheck :exec
DELETE FROM checks WHERE id = $1;

-- name: GetChecksByDateRange :many
SELECT * FROM checks 
WHERE ($1::timestamp IS NULL OR created_at >= $1)
AND ($2::timestamp IS NULL OR created_at <= $2)
ORDER BY created_at DESC;

-- name: GetOrCreateCheck :one
WITH inserted AS (
    INSERT INTO checks (check_id, file_name) 
    VALUES ($1, $2) 
    ON CONFLICT (check_id) DO NOTHING 
    RETURNING *
)
SELECT * FROM inserted
UNION ALL
SELECT * FROM checks WHERE check_id = $1
LIMIT 1;