-- database/query/templates.sql

-- name: ListTemplates :many
SELECT * FROM templates ORDER BY name;

-- name: ListDefaultTemplates :many
SELECT * FROM templates WHERE is_default = TRUE ORDER BY name;

-- name: ListUserTemplates :many
SELECT * FROM templates WHERE user_id = sqlc.arg(user_id)::int ORDER BY name;

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
SELECT pn.id, pn.name
FROM template_products tp
JOIN product_names pn ON tp.product_name_id = pn.id
WHERE tp.template_id = sqlc.arg(template_id)::int
ORDER BY pn.name;

-- name: AddProductToTemplate :exec
INSERT INTO template_products (template_id, product_name_id) 
VALUES (sqlc.arg(template_id)::int, sqlc.arg(product_name_id)::int) 
ON CONFLICT (template_id, product_name_id) DO NOTHING;

-- name: RemoveProductFromTemplate :exec
DELETE FROM template_products 
WHERE template_id = sqlc.arg(template_id)::int AND product_name_id = sqlc.arg(product_name_id)::int;

-- name: ClearTemplateProducts :exec
DELETE FROM template_products WHERE template_id = sqlc.arg(template_id)::int;

-- name: CopyTemplate :one
WITH new_template AS (
    INSERT INTO templates (name, user_id, is_default) 
    VALUES (sqlc.arg(name)::text, sqlc.arg(user_id)::int, FALSE) 
    RETURNING *
)
INSERT INTO template_products (template_id, product_name_id)
SELECT new_template.id, tp.product_name_id
FROM new_template
CROSS JOIN template_products tp
WHERE tp.template_id = sqlc.arg(template_id)::int
RETURNING (SELECT * FROM new_template);

-- name: GetTemplateWithProducts :many
SELECT 
    t.id,
    t.name,
    t.user_id,
    t.is_default,
    t.created_at,
    pn.id as product_id,
    pn.name as product_name
FROM templates t
LEFT JOIN template_products tp ON t.id = tp.template_id
LEFT JOIN product_names pn ON tp.product_name_id = pn.id
WHERE t.id = sqlc.arg(id)::int
ORDER BY pn.name;