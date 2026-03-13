-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url VARCHAR(500) NOT NULL,
    link VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    cpu VARCHAR(100),
    ram VARCHAR(50),
    storage VARCHAR(50),
    screen VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    discount INTEGER DEFAULT 0,
    image VARCHAR(255),
    rating DECIMAL(2,1) DEFAULT 0.0,
    reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample banners
INSERT INTO banners (title, image, is_active) VALUES
('Banner Khuyến Mãi', 'images/banners/banner1.jpg', true),
('Banner Bảo hành', 'images/banners/banner2.jpg', true)
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, brand, cpu, ram, storage, screen, price, original_price, discount, image, rating, reviews) VALUES
('Dell XPS 13 Plus', 'Dell', 'Intel Core i7-1360P', '16GB', '512GB SSD', '13.3 inch', 32990000.00, 36990000.00, 11, 'images/laptop/dell-xps-13/dell-xps-13.jpg', 4.8, 245),
('MacBook Air M4', 'Apple', 'Apple M4', '8GB', '256GB SSD', '13.3 inch', 28990000.00, 32990000.00, 12, 'images/laptop/macbook-air-m4/macbook-air-m4.jpg', 4.9, 512),
('Asus ROG STRIX G16', 'Asus', 'Intel Core i7-14650HX', '32GB', '512GB SSD', '16 inch', 41590000.00, 43990000.00, 15, 'images/laptop/asus-rog-strix-g16/asus-rog-strix-g16.jpg', 4.5, 189),
('Dell Latitude 7440', 'Dell', 'Intel Core i7-1365U', '16GB', '512GB SSD', '14 inch', 38990000.00, 42990000.00, 9, 'images/laptop/dell-latitude-7440/dell-latitude-7440.jpg', 4.6, 144),
('Razer Blade 15', 'Razer', 'Intel Core i7-13800H', '16GB', '1TB SSD', '15.6 inch', 55990000.00, 59990000.00, 7, 'images/laptop/razer-blade-15/razer-blade-15.jpg', 4.7, 120),
('Samsung Galaxy Book3 Pro', 'Samsung', 'Intel Core i7-1360P', '16GB', '512GB SSD', '14 inch', 34990000.00, 38990000.00, 10, 'images/laptop/samsung-galaxy-book3/samsung-galaxy-book3.jpg', 4.5, 98)
ON CONFLICT DO NOTHING;

-- Insert sample users
INSERT INTO users (id, name) VALUES
('1', 'Trần Trọng Phúc'),
('2', 'Đỗ Văn Hin')
ON CONFLICT DO NOTHING;