# ThinkPro Backend API

Backend API cho website bán laptop ThinkPro sử dụng PHP và MySQL.

## Cấu trúc dự án

```
BackendWeb/
├── api/
│   └── products/
│       ├── read.php          # GET - Lấy danh sách sản phẩm
│       ├── read_one.php      # GET - Lấy chi tiết sản phẩm
│       ├── create.php        # POST - Tạo sản phẩm mới
│       ├── update.php        # PUT - Cập nhật sản phẩm
│       └── delete.php        # DELETE - Xóa sản phẩm
├── config/
│   └── database.php          # Cấu hình kết nối database
├── models/
│   └── Product.php           # Model Product
└── database.sql              # File SQL tạo database
```

## Cài đặt

1. Import database:
```bash
mysql -u root -p < database.sql
```

2. Cấu hình database trong `config/database.php`:
```php
private $host = "localhost";
private $db_name = "thinkpro_db";
private $username = "root";
private $password = "";
```

3. Chạy server PHP (hoặc sử dụng XAMPP/WAMP):
```bash
php -S localhost:8000
```

## API Endpoints

### 1. Lấy danh sách sản phẩm
**GET** `/api/products/read.php`

Query parameters:
- `brand` - Lọc theo thương hiệu
- `minPrice` - Giá tối thiểu
- `maxPrice` - Giá tối đa
- `keyword` - Tìm kiếm theo tên

Ví dụ:
```
GET /api/products/read.php?brand=Dell&minPrice=10000000&maxPrice=30000000
```

Response:
```json
{
  "records": [
    {
      "id": 1,
      "name": "Dell XPS 13 Plus",
      "brand": "Dell",
      "cpu": "Intel Core i7-1360P",
      "ram": "16GB",
      "storage": "512GB SSD",
      "screen": "13.4 inch",
      "price": "32990000",
      "original_price": "36990000",
      "discount": 11,
      "image": "dell-xps-13.jpg",
      "rating": "4.8",
      "reviews": 245
    }
  ]
}
```

### 2. Lấy chi tiết sản phẩm
**GET** `/api/products/read_one.php?id=1`

### 3. Tạo sản phẩm mới
**POST** `/api/products/create.php`

Body:
```json
{
  "name": "Laptop Name",
  "brand": "Brand",
  "cpu": "CPU",
  "ram": "RAM",
  "storage": "Storage",
  "screen": "Screen",
  "price": 20000000,
  "original_price": 25000000,
  "discount": 20,
  "image": "image.jpg",
  "rating": 4.5,
  "reviews": 100
}
```

### 4. Cập nhật sản phẩm
**PUT** `/api/products/update.php`

Body: (bao gồm id và các trường cần cập nhật)

### 5. Xóa sản phẩm
**DELETE** `/api/products/delete.php`

Body:
```json
{
  "id": 1
}
```

## CORS

API đã được cấu hình CORS để cho phép Frontend gọi từ domain khác.

## Kết nối từ Frontend

Trong React app, gọi API như sau:

```javascript
// Lấy danh sách sản phẩm
fetch('http://localhost:8000/api/products/read.php')
  .then(response => response.json())
  .then(data => console.log(data.records));

// Lọc sản phẩm
fetch('http://localhost:8000/api/products/read.php?brand=Dell&minPrice=10000000')
  .then(response => response.json())
  .then(data => console.log(data.records));
```
