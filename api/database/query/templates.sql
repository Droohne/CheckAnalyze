-- database/query/templates.sql

-- name: ListTemplates :many
SELECT * FROM templates ORDER BY name;

-- name: ListUserTemplates :many
SELECT 
    t.id,
    t.name,
    t.user_id,
    t.is_default,
    t.created_at,
    tp.id as tp_id,
    tp.amount_or_weight,
    pn.id as product_id,
    pn.name as product_name
FROM templates t
LEFT JOIN template_products tp ON t.id = tp.template_id
LEFT JOIN product_names pn ON tp.product_name_id = pn.id
WHERE t.user_id = sqlc.arg(user_id)::int
ORDER BY t.name, pn.name;

-- name: ListDefaultTemplates :many
SELECT 
    t.id,
    t.name,
    t.user_id,
    t.is_default,
    t.created_at,
    tp.id as tp_id,
    tp.amount_or_weight,
    pn.id as product_id,
    pn.name as product_name
FROM templates t
LEFT JOIN template_products tp ON t.id = tp.template_id
LEFT JOIN product_names pn ON tp.product_name_id = pn.id
WHERE t.is_default = TRUE
ORDER BY t.name, pn.name;

-- name: GetTemplateByID :one
SELECT * FROM templates WHERE id = sqlc.arg(id)::int;

-- name: CreateTemplate :one
INSERT INTO templates (name, user_id, is_default) 
VALUES (sqlc.arg(name)::text, sqlc.arg(user_id)::int, sqlc.arg(is_default)::bool) 
RETURNING *;

-- name: UpdateTemplate :one
UPDATE templates 
SET name = sqlc.arg(name)::text, user_id = sqlc.arg(user_id)::int, is_default = sqlc.arg(is_default)::bool
WHERE id = sqlc.arg(id)::int
RETURNING *;

-- name: DeleteTemplate :exec
DELETE FROM templates WHERE id = sqlc.arg(id)::int;

-- name: ListTemplateProducts :many
SELECT tp.id, tp.product_name_id, tp.amount_or_weight, pn.name as product_name
FROM template_products tp
JOIN product_names pn ON tp.product_name_id = pn.id
WHERE tp.template_id = sqlc.arg(template_id)::int
ORDER BY pn.name;

-- name: AddProductToTemplate :exec
INSERT INTO template_products (template_id, product_name_id, amount_or_weight) 
VALUES (sqlc.arg(template_id)::int, sqlc.arg(product_name_id)::int, sqlc.arg(amount_or_weight)::float8) 
ON CONFLICT (template_id, product_name_id) DO UPDATE 
SET amount_or_weight = EXCLUDED.amount_or_weight;

-- name: RemoveProductFromTemplate :exec
DELETE FROM template_products 
WHERE template_id = sqlc.arg(template_id)::int AND product_name_id = sqlc.arg(product_name_id)::int;

-- name: RemoveAllProductsFromTemplate :exec
DELETE FROM template_products WHERE template_id = sqlc.arg(template_id)::int;

-- name: CopyTemplate :one
WITH new_template AS (
    INSERT INTO templates (name, user_id, is_default) 
    VALUES (sqlc.arg(name)::text, sqlc.arg(user_id)::int, FALSE) 
    RETURNING id
), copied_products AS (
    INSERT INTO template_products (template_id, product_name_id, amount_or_weight)
    SELECT (SELECT id FROM new_template), tp.product_name_id, tp.amount_or_weight
    FROM template_products tp
    WHERE tp.template_id = sqlc.arg(template_id)::int
)
SELECT id FROM new_template;

-- name: GetTemplateWithProducts :many
SELECT 
    t.id,
    t.name,
    t.user_id,
    t.is_default,
    t.created_at,
    tp.id as tp_id,
    tp.amount_or_weight,
    pn.id as product_id,
    pn.name as product_name
FROM templates t
LEFT JOIN template_products tp ON t.id = tp.template_id
LEFT JOIN product_names pn ON tp.product_name_id = pn.id
WHERE t.id = sqlc.arg(id)::int
ORDER BY pn.name;