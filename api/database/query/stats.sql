-- name: GetStats :one
SELECT 
    (SELECT COUNT(*) FROM checks) as total_checks,
    (SELECT COUNT(*) FROM product_names) as total_unique_products,
    (SELECT COUNT(*) FROM products) as total_product_entries;

-- name: GetCategoryStats :one
SELECT 
    cat.id,
    cat.name,
    COUNT(p.id) as product_count,
    COUNT(DISTINCT p.check_id) as check_count,
    AVG(p.price_per_unit) as avg_price
FROM categories cat
LEFT JOIN products p ON cat.id = p.category_id
WHERE cat.id = $1
GROUP BY cat.id, cat.name;