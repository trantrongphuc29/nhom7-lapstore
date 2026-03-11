-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Mar 09, 2026 at 07:12 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `labstore_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
CREATE TABLE IF NOT EXISTS `banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `title`, `image_url`, `is_active`, `created_at`) VALUES
(1, 'Banner Khuyến Mãi', 'images/banners/banner1.jpg', 1, '2026-03-09 07:00:24'),
(2, 'Banner Bảo hành', 'images/banners/banner2.jpg', 1, '2026-03-09 07:05:43');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `brand` varchar(100) NOT NULL,
  `cpu` varchar(100) DEFAULT NULL,
  `ram` varchar(50) DEFAULT NULL,
  `storage` varchar(50) DEFAULT NULL,
  `screen` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `discount` int DEFAULT '0',
  `image` varchar(255) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT '0.0',
  `reviews` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `brand`, `cpu`, `ram`, `storage`, `screen`, `price`, `original_price`, `discount`, `image`, `rating`, `reviews`, `created_at`) VALUES
(1, 'Dell XPS 13 Plus', 'Dell', 'Intel Core i7-1360P', '16GB', '512GB SSD', '13.3 inch', 32990000.00, 36990000.00, 11, 'http://localhost/BackendWeb/images/dell-xps-13.jpg', 4.8, 245, '2026-03-06 17:27:59'),
(2, 'MacBook Air M4', 'Apple', 'Apple M4', '8GB', '256GB SSD', '13.3 inch', 28990000.00, 32990000.00, 12, 'http://localhost/BackendWeb/images/macbook-air-m4.jpg', 4.9, 512, '2026-03-06 17:27:59'),
(3, 'Asus ROG STRIX G16', 'Asus', 'Intel Core i7-14650HX', '32GB', '512GB SSD', '16 inch', 41590000.00, 43990000.00, 15, 'http://localhost/BackendWeb/images/asus-rog-strix-g16.jpg', 4.5, 189, '2026-03-06 17:27:59'),
(4, 'Lenovo ThinkPad X1', 'Lenovo', 'Intel Core i7-1260P', '16GB', '1TB SSD', '14 inch', 42990000.00, 48990000.00, 12, 'http://localhost/BackendWeb/images/lenovo-thinkpad-x1.jpg', 4.7, 321, '2026-03-06 17:27:59'),
(5, 'ASUS ROG Strix G15', 'Asus', 'AMD Ryzen 9 5900HX', '16GB', '1TB SSD', '15.6 inch', 38990000.00, 44990000.00, 13, 'http://localhost/BackendWeb/images/asus-rog-strix.jpg', 4.8, 456, '2026-03-06 17:27:59'),
(6, 'Acer Aspire 5', 'Acer', 'Intel Core i5-1135G7', '8GB', '512GB SSD', '15.6 inch', 14990000.00, 17990000.00, 17, 'http://localhost/BackendWeb/images/acer-aspire-5.jpg', 4.3, 167, '2026-03-06 17:27:59'),
(7, 'MSI GF63 Thin', 'MSI', 'Intel Core i5-11400H', '8GB', '512GB SSD', '15.6 inch', 18990000.00, 21990000.00, 14, 'http://localhost/BackendWeb/images/msi-gf63.jpg', 4.4, 203, '2026-03-06 17:27:59'),
(8, 'Dell Inspiron 15', 'Dell', 'Intel Core i7-1165G7', '16GB', '512GB SSD', '15.6 inch', 21990000.00, 24990000.00, 12, 'http://localhost/BackendWeb/images/dell-inspiron-15.jpg', 4.6, 278, '2026-03-06 17:27:59'),
(9, 'HP Spectre x360 14', 'HP', 'Intel Core i7-1355U', '16GB', '1TB SSD', '13.5 inch', 35990000.00, 39990000.00, 10, 'http://localhost/BackendWeb/images/hp-spectre-x360.jpg', 4.7, 198, '2026-03-06 17:59:55'),
(10, 'MacBook Pro M3 14', 'Apple', 'Apple M3', '16GB', '512GB SSD', '14 inch', 45990000.00, 49990000.00, 8, 'http://localhost/BackendWeb/images/macbook-pro-m3.jpg', 4.9, 340, '2026-03-06 17:59:55'),
(11, 'Lenovo Legion 5 Pro', 'Lenovo', 'AMD Ryzen 7 7745HX', '16GB', '1TB SSD', '16 inch', 37990000.00, 41990000.00, 10, 'http://localhost/BackendWeb/images/lenovo-legion-5-pro.jpg', 4.6, 287, '2026-03-06 17:59:55'),
(12, 'Asus Zenbook 14 OLED', 'Asus', 'Intel Core i7-13700H', '16GB', '512GB SSD', '14 inch', 30990000.00, 34990000.00, 11, 'http://localhost/BackendWeb/images/asus-zenbook-14.jpg', 4.8, 215, '2026-03-06 17:59:55'),
(13, 'Acer Nitro 5', 'Acer', 'Intel Core i7-12700H', '16GB', '1TB SSD', '15.6 inch', 27990000.00, 31990000.00, 13, 'http://localhost/BackendWeb/images/acer-nitro-5.jpg', 4.5, 302, '2026-03-06 17:59:55'),
(14, 'MSI Katana 15', 'MSI', 'Intel Core i7-13620H', '16GB', '1TB SSD', '15.6 inch', 32990000.00, 36990000.00, 11, 'http://localhost/BackendWeb/images/msi-katana-15.jpg', 4.4, 156, '2026-03-06 17:59:55'),
(15, 'HP Pavilion 15', 'HP', 'Intel Core i5-1240P', '8GB', '512GB SSD', '15.6 inch', 17990000.00, 20990000.00, 14, 'http://localhost/BackendWeb/images/hp-pavilion-15.jpg', 4.3, 189, '2026-03-06 17:59:55'),
(16, 'Dell Latitude 7440', 'Dell', 'Intel Core i7-1365U', '16GB', '512GB SSD', '14 inch', 38990000.00, 42990000.00, 9, 'http://localhost/BackendWeb/images/dell-latitude-7440.jpg', 4.6, 144, '2026-03-06 17:59:55'),
(17, 'Razer Blade 15', 'Razer', 'Intel Core i7-13800H', '16GB', '1TB SSD', '15.6 inch', 55990000.00, 59990000.00, 7, 'http://localhost/BackendWeb/images/razer-blade-15.jpg', 4.7, 120, '2026-03-06 17:59:55'),
(18, 'Samsung Galaxy Book3 Pro', 'Samsung', 'Intel Core i7-1360P', '16GB', '512GB SSD', '14 inch', 34990000.00, 38990000.00, 10, 'http://localhost/BackendWeb/images/samsung-galaxy-book3.jpg', 4.5, 98, '2026-03-06 17:59:55');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
