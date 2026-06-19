-- name: CreateProductRelation :one
INSERT INTO product_relations (product_id, identical_product_id) 
VALUES ($1, $2), ($2, $1)
ON CONFLICT (product_id, identical_product_id) DO NOTHING 
RETURNING *;

-- name: GetProductRelationsByProductID :many
SELECT * FROM product_relations WHERE product_id = $1;


-- name: GetIdenticalProductsWithDetailsByProductId :many
SELECT 
    pr.product_id,
    pr.identical_product_id,
    pn1.name as product_name,
    pn2.name as identical_product_name,
    p1.price_per_unit as product_price,
    p2.price_per_unit as identical_price,
    p1.amount_or_weight as product_amount,
    p2.amount_or_weight as identical_amount,
    c1.check_id as product_check_id,
    c2.check_id as identical_check_id
FROM product_relations pr
JOIN products p1 ON pr.product_id = p1.id
JOIN products p2 ON pr.identical_product_id = p2.id
JOIN product_names pn1 ON p1.product_id = pn1.id
JOIN product_names pn2 ON p2.product_id = pn2.id
JOIN checks c1 ON p1.check_id = c1.id
JOIN checks c2 ON p2.check_id = c2.id
WHERE pr.product_id = $1;

-- name: DeleteProductRelation :exec
DELETE FROM product_relations 
WHERE product_id = $1 AND identical_product_id = $2;