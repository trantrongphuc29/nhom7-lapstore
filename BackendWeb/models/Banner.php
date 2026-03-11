<?php
class Banner {
    private $conn;
    private $table_name = "banners";

    public $id;
    public $title;
    public $image_url;
    public $is_active;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE is_active = 1 ORDER BY id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }
}
?>
