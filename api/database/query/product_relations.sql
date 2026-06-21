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
WITH canonical AS (
    SELECT 
        COALESCE(pr.product_name_id, pn.id) as canonical_id,
        pn.id as name_id
    FROM product_names pn
    LEFT JOIN product_relations pr ON pn.id = pr.identical_product_name_id
),
counts AS (
    SELECT canonical_id, COUNT(*) as total_purchases
    FROM canonical c
    JOIN products p ON c.name_id = p.product_id
    GROUP BY canonical_id
)
SELECT 
    p.id,
    pn.id as product_name_id,
    p.price_per_unit,
    p.amount_or_weight,
    pn.name as product_name,
    c.check_id as check_id,
    cat.name as category_name,
    COALESCE(cnt.total_purchases, 0) as total_purchases
FROM products p
JOIN product_names pn ON p.product_id = pn.id
JOIN checks c ON p.check_id = c.id
JOIN categories cat ON p.category_id = cat.id
LEFT JOIN counts cnt ON pn.id = cnt.canonical_id
WHERE pn.id NOT IN (
    SELECT identical_product_name_id FROM product_relations
)
ORDER BY p.id;