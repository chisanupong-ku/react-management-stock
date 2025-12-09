-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 09, 2025 at 04:33 PM
-- Server version: 8.0.43-0ubuntu0.24.04.1
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `it_std6630202155`
--

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `stock` int DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `imageUrl` varchar(255) DEFAULT NULL,
  `lastUpdate` datetime DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `stock`, `category`, `location`, `status`, `imageUrl`, `lastUpdate`, `file_type`, `file_name`, `file_size`, `price`, `image`) VALUES
(1, 'tomato', 12, 'vegetables', '3 stores', 'active', 'http://nindam.sytes.net/std6630202155/inventory/image/tomato.png', '2025-08-21 14:28:47', NULL, NULL, NULL, 35.00, NULL),
(2, 'chilli', 30, 'vegetables', '3 stores', 'active', 'http://nindam.sytes.net/std6630202155/inventory/image/chilli.png', '2025-08-21 14:28:47', NULL, NULL, NULL, 20.00, NULL),
(3, 'carrot', 30, 'vegetables', '3 stores', 'active', 'http://nindam.sytes.net/std6630202155/inventory/image/carrot2.png', '2025-08-21 14:28:47', NULL, NULL, NULL, 15.00, NULL),
(4, 'greenonion', 90, 'vegetables', '2 stores', 'active', 'http://nindam.sytes.net/std6630202155/inventory/image/greenonion.png', '2025-08-21 14:28:47', NULL, NULL, NULL, 25.00, NULL),
(5, 'potato', 50, 'vegetables', '7 stores', 'active', 'http://nindam.sytes.net/std6630202155/inventory/image/potato.png', '2025-08-21 14:28:47', NULL, NULL, NULL, 18.00, NULL),
(6, 'MariGold', 50, 'Flower', '5 stores', 'active', 'http://nindam.sytes.net/std6630202155/inventory/image/Marigold.png', '2025-08-28 15:03:56', NULL, NULL, NULL, 150.00, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
