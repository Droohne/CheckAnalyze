-- name: CreateProductRelation :one
WITH target_name AS (
    SELECT pn.id as name_id
    FROM products p
    JOIN product_names pn ON p.product_id = pn.id
    WHERE p.id = $2
),
inherited AS (
    SELECT identical_product_id FROM product_relations WHERE product_id = $2
),
all_ids AS (
    SELECT name_id as id FROM target_name
    UNION ALL
    SELECT identical_product_id FROM inherited
),
inserted AS (
    INSERT INTO product_relations (product_id, identical_product_id) 
    SELECT $1, id FROM all_ids
    ON CONFLICT (product_id, identical_product_id) DO NOTHING 
    RETURNING *
)
SELECT * FROM inserted;

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