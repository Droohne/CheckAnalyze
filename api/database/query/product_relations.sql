-- name: CreateProductRelation :one
INSERT INTO product_relations (product_name_id, identical_product_name_id) 
VALUES ($1, $2)
ON CONFLICT (product_name_id, identical_product_name_id) DO NOTHING 
RETURNING *;

-- name: GetProductRelationsByProductNameID :many
SELECT * FROM product_relations WHERE product_name_id = $1;

-- name: GetIdenticalProductsWithDetailsByProductNameId :many
SELECT 
    pr.product_name_id,
    pr.identical_product_name_id,
    pn1.name as product_name,
    pn2.name as identical_product_name,
    p.price_per_unit,
    p.amount_or_weight,
    c.check_id
FROM product_relations pr
JOIN product_names pn1 ON pr.product_name_id = pn1.id
JOIN product_names pn2 ON pr.identical_product_name_id = pn2.id
LEFT JOIN products p ON pn1.id = p.product_id
LEFT JOIN checks c ON p.check_id = c.id
WHERE pr.product_name_id = $1;

-- name: DeleteProductRelation :exec
DELETE FROM product_relations 
WHERE product_name_id = $1 AND identical_product_name_id = $2;


-- name: ListProductsWithDetails :many
SELECT 
    pn.id as product_name_id,
    pn.name as product_name,
    p.id,
    p.price_per_unit,
    p.amount_or_weight,
    c.check_id as check_id
FROM product_names pn
LEFT JOIN products p ON pn.id = p.product_id
LEFT JOIN checks c ON p.check_id = c.id
WHERE pn.id NOT IN (
    SELECT identical_product_name_id FROM product_relations
)
AND p.id IS NOT NULL
ORDER BY pn.name;