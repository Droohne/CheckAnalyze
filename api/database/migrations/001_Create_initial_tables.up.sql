-- Migration file: 001_create_products_tables.sql

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    address text UNIQUE NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
);

-- Create checks table
CREATE TABLE IF NOT EXISTS checks (
    id SERIAL PRIMARY KEY,
    check_id VARCHAR(50) UNIQUE NOT NULL,
    shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create product_names table
CREATE TABLE IF NOT EXISTS product_names (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);



-- Create products table (junction between checks and product_names)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES product_names(id) ON DELETE CASCADE,
    check_id INTEGER NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    price_per_unit DOUBLE PRECISION NOT NULL,
    amount_or_weight DOUBLE PRECISION NOT NULL,
    UNIQUE(product_id, check_id)
);

-- Create product_relations table (self-referencing many-to-many for identical products)
CREATE TABLE IF NOT EXISTS product_relations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    identical_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, identical_product_id),
    CHECK (product_id != identical_product_id)
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create template_products table (junction between templates and product_names)
CREATE TABLE IF NOT EXISTS template_products (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    product_name_id INTEGER NOT NULL REFERENCES product_names(id) ON DELETE CASCADE,
    UNIQUE(template_id, product_name_id)
);


-- Add indexes for better performance
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_check_id ON products(check_id);
CREATE INDEX idx_product_relations_product_id ON product_relations(product_id);
CREATE INDEX idx_product_relations_identical_product_id ON product_relations(identical_product_id);
CREATE INDEX idx_checks_check_id ON checks(check_id);
CREATE INDEX idx_product_names_name ON product_names(name);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_template_products_template_id ON template_products(template_id);
CREATE INDEX idx_template_products_product_name_id ON template_products(product_name_id);

-- Populate tables
INSERT INTO categories (name) VALUES ('Uncategorized') ON CONFLICT (name) DO NOTHING;

-- Insert default templates
INSERT INTO templates (name, is_default) VALUES 
    ('Еженедельный', TRUE),
    ('Праздничный', TRUE),
    ('Спортивный', TRUE)
ON CONFLICT DO NOTHING;
