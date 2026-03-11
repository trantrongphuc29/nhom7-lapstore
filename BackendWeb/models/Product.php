<?php
class Product {
    private $conn;
    private $table_name = "products";

    public $id;
    public $name;
    public $brand;
    public $cpu;
    public $ram;
    public $storage;
    public $screen;
    public $price;
    public $original_price;
    public $discount;
    public $image;
    public $rating;
    public $reviews;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }


    public function search($keyword, $brands = null, $cpu = null, $ram = null, $minPrice = null, $maxPrice = null) {
        $where = [];
        $values = [];
        
        if (!empty($keyword)) {
            $where[] = "name LIKE ?";
            $values[] = "%{$keyword}%";
        }
        
        if (!empty($brands)) {
            $brandArray = array_map('trim', explode(',', $brands));
            $marks = implode(',', array_fill(0, count($brandArray), '?'));
            $where[] = "brand IN ({$marks})";
            foreach ($brandArray as $b) {
                $values[] = $b;
            }
        }
        
        if (!empty($cpu)) {
            $where[] = "cpu LIKE ?";
            $values[] = "%{$cpu}%";
        }
        
        if (!empty($ram)) {
            $where[] = "ram = ?";
            $values[] = $ram;
        }
        
        if (!empty($minPrice)) {
            $where[] = "price >= ?";
            $values[] = $minPrice;
        }
        
        if (!empty($maxPrice)) {
            $where[] = "price <= ?";
            $values[] = $maxPrice;
        }
        
        $sql = "SELECT * FROM " . $this->table_name;
        if (count($where) > 0) {
            $sql .= " WHERE " . implode(' AND ', $where);
        }
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($values);
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                SET name=:name, brand=:brand, cpu=:cpu, ram=:ram, storage=:storage, 
                    screen=:screen, price=:price, original_price=:original_price, 
                    discount=:discount, image=:image, rating=:rating, reviews=:reviews";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":brand", $this->brand);
        $stmt->bindParam(":cpu", $this->cpu);
        $stmt->bindParam(":ram", $this->ram);
        $stmt->bindParam(":storage", $this->storage);
        $stmt->bindParam(":screen", $this->screen);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":original_price", $this->original_price);
        $stmt->bindParam(":discount", $this->discount);
        $stmt->bindParam(":image", $this->image);
        $stmt->bindParam(":rating", $this->rating);
        $stmt->bindParam(":reviews", $this->reviews);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function update() {
        $query = "UPDATE " . $this->table_name . " 
                SET name=:name, brand=:brand, cpu=:cpu, ram=:ram, storage=:storage, 
                    screen=:screen, price=:price, original_price=:original_price, 
                    discount=:discount, image=:image, rating=:rating, reviews=:reviews
                WHERE id=:id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":brand", $this->brand);
        $stmt->bindParam(":cpu", $this->cpu);
        $stmt->bindParam(":ram", $this->ram);
        $stmt->bindParam(":storage", $this->storage);
        $stmt->bindParam(":screen", $this->screen);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":original_price", $this->original_price);
        $stmt->bindParam(":discount", $this->discount);
        $stmt->bindParam(":image", $this->image);
        $stmt->bindParam(":rating", $this->rating);
        $stmt->bindParam(":reviews", $this->reviews);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->id);
        
        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
