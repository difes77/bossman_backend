-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 01, 2025 at 10:50 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bossman_ps_db2`
--

-- --------------------------------------------------------

--
-- Table structure for table `absensi`
--

CREATE TABLE `absensi` (
  `id_absensi` int(11) NOT NULL,
  `id_karyawan` int(11) NOT NULL,
  `foto_absensi` varchar(255) NOT NULL,
  `tipe_absensi` enum('masuk','pulang') NOT NULL,
  `id_cabang` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bahan_baku`
--

CREATE TABLE `bahan_baku` (
  `id_bahan_baku` int(11) NOT NULL,
  `nama_bahan_baku` varchar(100) NOT NULL,
  `jumlah_stok` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unit_satuan` varchar(20) NOT NULL,
  `id_cabang` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bahan_baku`
--

INSERT INTO `bahan_baku` (`id_bahan_baku`, `nama_bahan_baku`, `jumlah_stok`, `unit_satuan`, `id_cabang`, `created_at`, `updated_at`) VALUES
(1, 'galon aqua', 3.00, 'pcs', 10, '2025-06-20 09:40:35', '2025-06-20 09:40:35');

-- --------------------------------------------------------

--
-- Table structure for table `cabang`
--

CREATE TABLE `cabang` (
  `id_cabang` int(11) NOT NULL,
  `nama_cabang` varchar(100) NOT NULL,
  `alamat` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cabang`
--

INSERT INTO `cabang` (`id_cabang`, `nama_cabang`, `alamat`, `created_at`, `updated_at`) VALUES
(1, 'bossman1', 'samping uny', '2025-06-11 21:05:18', '2025-06-11 21:05:18'),
(2, 'Bossman PS Jakarta Pusat', 'Jl. Sudirman No. 1, Jakarta Pusat', '2025-06-12 01:50:17', '2025-06-12 01:50:17'),
(7, 'Bossman PS Bandung Kota', 'Jl. Asia Afrika No. 10, Bandung', '2025-06-12 01:51:24', '2025-06-12 01:51:24'),
(10, 'Bossmen Jogja', 'Jalan Malioboro No. 1', '2025-06-19 23:16:09', '2025-06-19 23:16:09');

-- --------------------------------------------------------

--
-- Table structure for table `detail_transaksi_makanan`
--

CREATE TABLE `detail_transaksi_makanan` (
  `id_detail_transaksi` int(11) NOT NULL,
  `id_transaksi_makanan` int(11) NOT NULL,
  `id_makanan` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `harga_satuan` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `detail_transaksi_makanan`
--
DELIMITER $$
CREATE TRIGGER `update_stok_makanan_after_transaksi` AFTER INSERT ON `detail_transaksi_makanan` FOR EACH ROW BEGIN
    UPDATE Makanan 
    SET jumlah_stok = jumlah_stok - NEW.jumlah,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_makanan = NEW.id_makanan;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `devicetoken`
--

CREATE TABLE `devicetoken` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `devicetoken`
--

INSERT INTO `devicetoken` (`id`, `user_id`, `token`, `created_at`, `updated_at`) VALUES
(1, 1, 'cLLUju1d2FMEv2NREV5SuK:APA91bF2CnPPW6nn3QpO1rKjg1oAiQnO4zwDJsTDgOqiCAaQqFsRvaxgVdWUVG1JlpryC6RtthxIXaOyzgTrlEMt-TT1dr9jPmATFC2QpRNBJslfFBuvErc', '2025-06-12 00:40:38', '2025-06-22 23:29:13');

-- --------------------------------------------------------

--
-- Table structure for table `game`
--

CREATE TABLE `game` (
  `id_game` int(11) NOT NULL,
  `nama_game` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `game`
--

INSERT INTO `game` (`id_game`, `nama_game`, `deskripsi`, `created_at`, `updated_at`) VALUES
(1, 'EA FC 25', 'Game sepak bola terbaru dari EA Sports.', '2025-06-12 01:50:17', '2025-06-12 01:50:17'),
(2, 'God of War: Ragnarok', 'Petualangan Kratos dan Atreus di mitologi Nordik.', '2025-06-12 01:50:17', '2025-06-12 01:50:17'),
(3, 'Marvel\'s Spider-Man 2', 'Aksi ayunan jaring dengan Peter Parker dan Miles Morales.', '2025-06-12 01:50:17', '2025-06-12 01:50:17'),
(4, 'Grand Theft Auto V', 'Open world action-adventure game.', '2025-06-12 01:50:17', '2025-06-12 01:50:17'),
(6, 'POU', 'main pou', '2025-06-20 08:21:20', '2025-06-20 08:21:20'),
(7, 'fifa 25', 'game bola', '2025-06-21 23:27:26', '2025-06-21 23:27:26');

-- --------------------------------------------------------

--
-- Table structure for table `jenis_ps`
--

CREATE TABLE `jenis_ps` (
  `id_jenis_ps` int(11) NOT NULL,
  `nama_jenis` varchar(50) NOT NULL,
  `harga_per_jam` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `jenis_ps`
--

INSERT INTO `jenis_ps` (`id_jenis_ps`, `nama_jenis`, `harga_per_jam`, `created_at`, `updated_at`) VALUES
(1, 'PlayStation 4', 7000.00, '2025-06-12 01:50:17', '2025-06-12 01:50:17'),
(2, 'PlayStation 5', 12000.00, '2025-06-12 01:50:17', '2025-06-12 01:50:17');

-- --------------------------------------------------------

--
-- Table structure for table `karyawan`
--

CREATE TABLE `karyawan` (
  `id_karyawan` int(11) NOT NULL,
  `nama_karyawan` varchar(100) NOT NULL,
  `no_wa` varchar(20) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `foto_ktp` varchar(255) DEFAULT NULL,
  `id_cabang` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `karyawan`
--

INSERT INTO `karyawan` (`id_karyawan`, `nama_karyawan`, `no_wa`, `alamat`, `foto_ktp`, `id_cabang`, `created_at`, `updated_at`) VALUES
(307, 'dian', '6288888888', 'tembok', 'null', 1, '2025-06-11 21:05:59', '2025-06-11 21:05:59'),
(308, 'Admin Utama', '08110000001', 'Kantor Pusat', NULL, 1, '2025-06-12 01:50:17', '2025-06-21 15:55:54'),
(309, 'Budi Santoso', '08123456789', 'Jl. Mawar No. 5, Jakarta', NULL, 7, '2025-06-12 01:50:17', '2025-06-21 16:00:42'),
(310, 'Citra Lestari', '08134567890', 'Jl. Melati No. 8, Bandung', NULL, 2, '2025-06-12 01:50:17', '2025-06-21 16:00:14'),
(311, 'farid', '088888888', 'cilacap', NULL, 7, '2025-06-21 16:14:02', '2025-06-21 16:14:02'),
(312, 'resnu', '0856666666666', 'sleman', NULL, 2, '2025-07-01 01:24:56', '2025-07-01 01:24:56');

-- --------------------------------------------------------

--
-- Table structure for table `log_owner`
--

CREATE TABLE `log_owner` (
  `id_log_owner` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `tindakan` varchar(255) NOT NULL,
  `detail_tindakan` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detail_tindakan`)),
  `id_cabang` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `log_owner`
--

INSERT INTO `log_owner` (`id_log_owner`, `user_id`, `tindakan`, `detail_tindakan`, `id_cabang`, `created_at`) VALUES
(1, 1, 'CREATE_KARYAWAN', '{\"info\": \"Menambahkan karyawan baru: Citra Lestari\", \"id_karyawan_baru\": 3}', 2, '2025-06-12 01:52:40');

-- --------------------------------------------------------

--
-- Table structure for table `makanan`
--

CREATE TABLE `makanan` (
  `id_makanan` int(11) NOT NULL,
  `nama_makanan` varchar(100) NOT NULL,
  `harga_jual` decimal(10,2) NOT NULL,
  `jumlah_stok` int(11) NOT NULL DEFAULT 0,
  `id_cabang` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `makanan`
--

INSERT INTO `makanan` (`id_makanan`, `nama_makanan`, `harga_jual`, `jumlah_stok`, `id_cabang`, `created_at`, `updated_at`) VALUES
(1, 'Kopi Hitam', 5000.00, 100, 1, '2025-06-12 01:52:22', '2025-06-12 01:52:22'),
(2, 'Mie Goreng Spesial', 12000.00, 50, 1, '2025-06-12 01:52:22', '2025-06-12 01:52:22'),
(3, 'Teh Botol', 4000.00, 100, 2, '2025-06-12 01:52:22', '2025-06-12 01:52:22');

-- --------------------------------------------------------

--
-- Table structure for table `penggunaan_bahan_baku`
--

CREATE TABLE `penggunaan_bahan_baku` (
  `id_penggunaan_bahan` int(11) NOT NULL,
  `id_karyawan` int(11) NOT NULL,
  `id_bahan_baku` int(11) NOT NULL,
  `jumlah_digunakan` decimal(10,2) NOT NULL,
  `keterangan` text DEFAULT NULL,
  `id_cabang` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `penggunaan_bahan_baku`
--
DELIMITER $$
CREATE TRIGGER `update_stok_bahan_baku_after_penggunaan` AFTER INSERT ON `penggunaan_bahan_baku` FOR EACH ROW BEGIN
    UPDATE Bahan_Baku 
    SET jumlah_stok = jumlah_stok - NEW.jumlah_digunakan,
        updated_at = CURRENT_TIMESTAMP
    WHERE id_bahan_baku = NEW.id_bahan_baku;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `ps`
--

CREATE TABLE `ps` (
  `id_ps` int(11) NOT NULL,
  `nomor_ps` varchar(10) NOT NULL,
  `id_jenis_ps` int(11) NOT NULL,
  `id_cabang` int(11) NOT NULL,
  `status_fisik` enum('available','in_use','borrowed_out','maintenance') DEFAULT 'available',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ps`
--

INSERT INTO `ps` (`id_ps`, `nomor_ps`, `id_jenis_ps`, `id_cabang`, `status_fisik`, `created_at`, `updated_at`) VALUES
(1, 'JPS-01', 2, 1, 'available', '2025-06-12 01:54:20', '2025-07-01 14:03:36'),
(2, 'JPS-02', 1, 1, 'available', '2025-06-12 01:54:20', '2025-07-01 14:01:26'),
(3, 'BPS-01', 2, 1, 'available', '2025-06-12 01:54:20', '2025-07-01 14:01:29'),
(4, 'BPS-02', 1, 2, 'available', '2025-06-12 01:54:20', '2025-07-01 01:28:32'),
(5, 'JPS-04', 2, 1, 'available', '2025-06-12 12:05:38', '2025-07-01 14:34:11'),
(6, 'JPS-03', 1, 1, 'available', '2025-06-12 12:05:38', '2025-07-01 12:44:48'),
(8, 'JPS-08', 1, 1, 'available', '2025-06-12 13:47:28', '2025-07-01 14:09:03');

-- --------------------------------------------------------

--
-- Table structure for table `ps_game`
--

CREATE TABLE `ps_game` (
  `id_ps_game` int(11) NOT NULL,
  `id_ps` int(11) NOT NULL,
  `id_game` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ps_game`
--

INSERT INTO `ps_game` (`id_ps_game`, `id_ps`, `id_game`, `created_at`) VALUES
(1, 1, 1, '2025-06-12 01:54:47'),
(2, 1, 2, '2025-06-12 01:54:47'),
(3, 1, 3, '2025-06-12 01:54:47'),
(4, 2, 1, '2025-06-12 01:54:47'),
(5, 2, 4, '2025-06-12 01:54:47'),
(6, 3, 1, '2025-06-12 01:54:47'),
(7, 3, 2, '2025-06-12 01:54:47'),
(8, 3, 3, '2025-06-12 01:54:47'),
(9, 3, 4, '2025-06-12 01:54:47'),
(15, 8, 1, '2025-06-20 08:32:01'),
(16, 8, 2, '2025-06-20 08:32:01'),
(17, 8, 6, '2025-06-20 08:32:01'),
(18, 6, 1, '2025-06-21 23:27:44'),
(19, 6, 2, '2025-06-21 23:27:44'),
(20, 6, 4, '2025-06-21 23:27:44');

-- --------------------------------------------------------

--
-- Table structure for table `report`
--

CREATE TABLE `report` (
  `id_report` int(11) NOT NULL,
  `id_karyawan` int(11) NOT NULL,
  `deskripsi_report` text NOT NULL,
  `foto_report_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`foto_report_urls`)),
  `status_report` enum('unread','read') DEFAULT 'unread',
  `id_cabang` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sewa_dibawa_pulang`
--

CREATE TABLE `sewa_dibawa_pulang` (
  `id_sewa_bawa_pulang` int(11) NOT NULL,
  `id_ps` int(11) NOT NULL,
  `id_karyawan` int(11) NOT NULL,
  `nama_penyewa` varchar(100) NOT NULL,
  `alamat_penyewa` text NOT NULL,
  `no_telp_penyewa` varchar(20) NOT NULL,
  `foto_orang` varchar(255) DEFAULT NULL,
  `foto_identitas_jaminan` varchar(255) DEFAULT NULL,
  `total_harga_sewa` decimal(10,2) NOT NULL,
  `status_sewa` enum('menunggu persetujuan admin','disetujui','dikembalikan','ditolak') DEFAULT 'menunggu persetujuan admin',
  `tanggal_kembali` datetime DEFAULT NULL,
  `id_cabang` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sewa_dibawa_pulang`
--

INSERT INTO `sewa_dibawa_pulang` (`id_sewa_bawa_pulang`, `id_ps`, `id_karyawan`, `nama_penyewa`, `alamat_penyewa`, `no_telp_penyewa`, `foto_orang`, `foto_identitas_jaminan`, `total_harga_sewa`, `status_sewa`, `tanggal_kembali`, `id_cabang`, `created_at`, `updated_at`) VALUES
(6, 1, 307, 'Budi Santoso', 'Jl. Merdeka No.10, Jakarta', '081234567890', 'foto_budi.jpg', 'ktp_budi.jpg', 50000.00, 'dikembalikan', '2025-06-20 15:00:00', 1, '2025-06-21 20:38:44', '2025-06-30 23:31:49'),
(7, 2, 307, 'Siti Aminah', 'Jl. Mawar No.12, Bandung', '089876543210', 'foto_siti.jpg', 'ktp_siti.jpg', 75000.00, 'dikembalikan', '2025-06-19 19:30:00', 2, '2025-06-21 20:38:44', '2025-06-21 20:38:44'),
(8, 3, 307, 'Andi Pratama', 'Jl. Kenanga No.5, Surabaya', '087812345678', 'foto_andi.jpg', 'ktp_andi.jpg', 60000.00, 'dikembalikan', NULL, 1, '2025-06-21 20:38:44', '2025-07-01 00:21:53'),
(9, 4, 307, 'Dewi Kartika', 'Jl. Melati No.7, Yogyakarta', '085632145789', 'foto_dewi.jpg', 'ktp_dewi.jpg', 65000.00, 'dikembalikan', NULL, 1, '2025-06-21 20:38:44', '2025-07-01 00:21:57'),
(10, 3, 307, 'dian', 'sleman', '0888888888888', '1750787938896-474866277.jpg', '1750787938922-867170483.jpg', 50000.00, 'dikembalikan', '2025-06-27 00:58:00', 1, '2025-06-25 00:58:58', '2025-06-30 23:34:30'),
(11, 2, 307, 'resnu', 'sleman utara', '08987654321', '1750788260637-547595114.jpg', '1750788260672-167384443.jpg', 70000.00, 'dikembalikan', '2025-06-28 01:04:00', 1, '2025-06-25 01:04:20', '2025-06-30 23:31:41'),
(12, 2, 307, 'dian', 'tembok', '0813425768', '1750788500317-727391742.jpg', '1750788500338-91744646.jpg', 60000.00, 'dikembalikan', '2025-06-27 01:08:00', 1, '2025-06-25 01:08:20', '2025-06-30 23:31:30'),
(13, 2, 307, 'jendra', 'kacangan', '085742094207', '1751177012848-81249135.jpg', '1751177012894-198729927.jpg', 60000.00, 'dikembalikan', '2025-07-01 13:03:00', 1, '2025-06-29 13:03:32', '2025-06-29 16:34:04'),
(14, 2, 307, 'joko', 'gadelan', '088888888888888', '1751303298694-589462861.jpg', '1751303298706-690957224.jpg', 50000.00, 'dikembalikan', '2025-07-03 03:20:00', 1, '2025-07-01 00:08:18', '2025-07-01 00:21:45');

-- --------------------------------------------------------

--
-- Table structure for table `sewa_ditempat`
--

CREATE TABLE `sewa_ditempat` (
  `id_sewa_ditempat` int(11) NOT NULL,
  `id_ps` int(11) NOT NULL,
  `id_karyawan` int(11) NOT NULL,
  `nama_penyewa` varchar(100) DEFAULT NULL,
  `waktu_mulai` datetime NOT NULL,
  `durasi_menit` int(11) NOT NULL,
  `waktu_selesai_estimasi` datetime NOT NULL,
  `waktu_selesai_aktual` datetime DEFAULT NULL,
  `total_harga` decimal(10,2) DEFAULT NULL,
  `status_sewa` enum('active','completed','cancelled') DEFAULT 'active',
  `id_cabang` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sewa_ditempat`
--

INSERT INTO `sewa_ditempat` (`id_sewa_ditempat`, `id_ps`, `id_karyawan`, `nama_penyewa`, `waktu_mulai`, `durasi_menit`, `waktu_selesai_estimasi`, `waktu_selesai_aktual`, `total_harga`, `status_sewa`, `id_cabang`, `created_at`, `updated_at`) VALUES
(5, 3, 307, 'Dewi', '2025-06-11 14:00:00', 60, '2025-06-11 15:00:00', '2025-06-11 15:02:00', 12000.00, 'completed', 2, '2025-06-12 14:33:54', '2025-06-12 14:33:54'),
(11, 1, 307, 'dian', '2025-06-12 17:06:59', 2, '2025-06-12 17:08:59', '2025-06-13 02:47:44', 400.00, 'completed', 1, '2025-06-12 17:06:59', '2025-06-13 02:47:44'),
(12, 2, 307, 'jefry', '2025-06-12 17:42:41', 3, '2025-06-12 17:45:41', '2025-06-13 02:32:08', 350.00, 'completed', 1, '2025-06-12 17:42:41', '2025-06-13 02:32:08'),
(13, 3, 307, 'resnu', '2025-06-13 01:25:57', 5, '2025-06-13 01:30:57', '2025-06-13 02:02:14', 1000.00, 'completed', 1, '2025-06-13 01:25:57', '2025-06-13 02:02:14'),
(14, 6, 307, 'resnu', '2025-06-13 02:57:48', 5, '2025-06-13 03:02:48', '2025-06-13 03:04:01', 583.00, 'completed', 1, '2025-06-13 02:57:48', '2025-06-13 03:04:01'),
(15, 6, 307, 'ahren', '2025-06-13 03:14:34', 15, '2025-06-13 03:29:34', '2025-06-27 14:52:16', 1750.00, 'completed', 1, '2025-06-13 03:14:34', '2025-06-27 14:52:16'),
(16, 1, 307, 'dika', '2025-06-13 11:23:28', 60, '2025-06-13 12:23:28', '2025-06-13 11:35:00', 12000.00, 'completed', 1, '2025-06-13 11:23:28', '2025-06-13 11:35:00'),
(17, 1, 307, 'jean', '2025-06-13 11:41:40', 60, '2025-06-13 12:41:40', '2025-06-21 23:45:07', 12000.00, 'completed', 1, '2025-06-13 11:41:40', '2025-06-21 23:45:07'),
(18, 2, 307, 'restyandito', '2025-06-21 23:37:02', 180, '2025-06-22 02:37:02', '2025-06-21 23:39:53', 21000.00, 'completed', 1, '2025-06-21 23:37:02', '2025-06-21 23:39:53'),
(19, 2, 307, 'dian', '2025-06-24 19:44:13', 60, '2025-06-24 20:44:13', '2025-06-24 23:55:22', 7000.00, 'completed', 1, '2025-06-24 19:44:13', '2025-06-24 23:55:22'),
(20, 3, 307, 'resnu', '2025-06-24 20:45:19', 32, '2025-06-24 21:17:19', '2025-06-24 23:55:42', 6400.00, 'completed', 1, '2025-06-24 20:45:19', '2025-06-24 23:55:42'),
(21, 5, 307, 'joko', '2025-06-24 20:47:11', 60, '2025-06-24 21:47:11', '2025-06-27 14:54:39', 12000.00, 'completed', 1, '2025-06-24 20:47:11', '2025-06-27 14:54:39'),
(22, 6, 307, 'farid', '2025-06-27 14:56:45', 5, '2025-06-27 15:01:45', '2025-06-27 15:02:04', 583.00, 'completed', 1, '2025-06-27 14:56:45', '2025-06-27 15:02:04'),
(23, 5, 307, 'rendy', '2025-06-27 14:58:23', 10, '2025-06-27 15:08:23', '2025-06-27 15:02:12', 2000.00, 'completed', 1, '2025-06-27 14:58:23', '2025-06-27 15:02:12'),
(24, 5, 307, 'yudi', '2025-06-27 15:02:23', 10, '2025-06-27 15:12:23', '2025-06-29 12:51:22', 2000.00, 'completed', 1, '2025-06-27 15:02:23', '2025-06-29 12:51:22'),
(25, 6, 307, 'joko', '2025-06-29 12:36:08', 60, '2025-06-29 13:36:08', '2025-06-30 22:12:14', 7000.00, 'completed', 1, '2025-06-29 12:36:08', '2025-06-30 22:12:14'),
(26, 3, 307, 'jean', '2025-06-29 12:39:17', 60, '2025-06-29 13:39:17', '2025-06-30 23:30:28', 12000.00, 'completed', 1, '2025-06-29 12:39:17', '2025-06-30 23:30:28'),
(27, 2, 307, 'sona', '2025-06-29 12:50:23', 45, '2025-06-29 13:35:23', '2025-06-29 13:02:59', 5250.00, 'completed', 1, '2025-06-29 12:50:23', '2025-06-29 13:02:59'),
(28, 5, 307, 'febry', '2025-06-29 12:55:28', 120, '2025-06-29 14:55:28', '2025-06-29 12:58:45', 24000.00, 'completed', 1, '2025-06-29 12:55:28', '2025-06-29 12:58:45'),
(29, 5, 307, 'yuli', '2025-06-29 12:58:55', 40, '2025-06-29 13:38:55', '2025-06-30 22:12:18', 8000.00, 'completed', 1, '2025-06-29 12:58:55', '2025-06-30 22:12:18'),
(30, 6, 307, 'firza', '2025-06-30 22:12:42', 2, '2025-06-30 22:14:42', '2025-06-30 22:15:43', 233.00, 'completed', 1, '2025-06-30 22:12:42', '2025-06-30 22:15:43'),
(31, 6, 307, 'jojo', '2025-06-30 22:15:53', 5, '2025-06-30 22:20:53', '2025-06-30 22:38:25', 583.00, 'completed', 1, '2025-06-30 22:15:53', '2025-06-30 22:38:25'),
(32, 6, 307, 'firee', '2025-06-30 22:38:39', 1, '2025-06-30 22:39:39', '2025-06-30 22:48:01', 117.00, 'completed', 1, '2025-06-30 22:38:39', '2025-06-30 22:48:01'),
(33, 6, 307, 'koko', '2025-06-30 22:48:15', 5, '2025-06-30 22:53:15', '2025-06-30 23:11:15', 583.00, 'completed', 1, '2025-06-30 22:48:15', '2025-06-30 23:11:15'),
(34, 6, 307, 'lolo', '2025-06-30 23:27:02', 7, '2025-06-30 23:34:02', '2025-06-30 23:32:59', 817.00, 'completed', 1, '2025-06-30 23:27:02', '2025-06-30 23:32:59'),
(35, 8, 307, 'cece', '2025-06-30 23:35:03', 2, '2025-06-30 23:37:03', '2025-06-30 23:37:25', 233.00, 'completed', 1, '2025-06-30 23:35:03', '2025-06-30 23:37:25'),
(36, 5, 307, 'jeje', '2025-06-30 23:35:15', 3, '2025-06-30 23:38:15', '2025-07-01 00:00:46', 600.00, 'completed', 1, '2025-06-30 23:35:15', '2025-07-01 00:00:46'),
(37, 6, 307, 'paijo', '2025-06-30 23:36:40', 5, '2025-06-30 23:41:40', '2025-06-30 23:54:35', 583.00, 'completed', 1, '2025-06-30 23:36:40', '2025-06-30 23:54:35'),
(38, 1, 307, 'keke', '2025-06-30 23:38:28', 4, '2025-06-30 23:42:28', '2025-06-30 23:54:19', 800.00, 'completed', 1, '2025-06-30 23:38:28', '2025-06-30 23:54:19'),
(39, 8, 307, 'yoni', '2025-06-30 23:54:30', 2, '2025-06-30 23:56:30', '2025-07-01 00:00:51', 233.00, 'completed', 1, '2025-06-30 23:54:30', '2025-07-01 00:00:51'),
(40, 3, 307, 'welo', '2025-06-30 23:57:27', 5, '2025-07-01 00:02:27', '2025-06-30 23:59:46', 1000.00, 'completed', 1, '2025-06-30 23:57:27', '2025-06-30 23:59:46'),
(41, 3, 307, 'bbbb', '2025-06-30 23:59:54', 2, '2025-07-01 00:01:54', '2025-07-01 00:00:40', 400.00, 'completed', 1, '2025-06-30 23:59:54', '2025-07-01 00:00:40'),
(42, 6, 307, 'reee', '2025-07-01 00:00:07', 4, '2025-07-01 00:04:07', '2025-07-01 00:00:53', 467.00, 'completed', 1, '2025-07-01 00:00:07', '2025-07-01 00:00:53'),
(43, 3, 307, 'ren', '2025-07-01 00:01:17', 2, '2025-07-01 00:03:17', '2025-07-01 00:05:16', 400.00, 'completed', 1, '2025-07-01 00:01:17', '2025-07-01 00:05:16'),
(44, 6, 307, 'joo', '2025-07-01 00:01:24', 2, '2025-07-01 00:03:24', '2025-07-01 00:05:19', 233.00, 'completed', 1, '2025-07-01 00:01:24', '2025-07-01 00:05:19'),
(45, 6, 307, 'resnu', '2025-07-01 00:05:26', 1, '2025-07-01 00:06:26', '2025-07-01 01:08:30', 117.00, 'completed', 1, '2025-07-01 00:05:26', '2025-07-01 01:08:30'),
(46, 3, 307, 'paijo', '2025-07-01 00:05:34', 1, '2025-07-01 00:06:34', '2025-07-01 00:31:43', 200.00, 'completed', 1, '2025-07-01 00:05:34', '2025-07-01 00:31:43'),
(47, 8, 307, 'haikal', '2025-07-01 00:05:45', 1, '2025-07-01 00:06:45', '2025-07-01 00:07:13', 117.00, 'completed', 1, '2025-07-01 00:05:45', '2025-07-01 00:07:13'),
(48, 5, 307, 'fff', '2025-07-01 00:15:36', 55, '2025-07-01 01:10:36', '2025-07-01 01:51:19', 11000.00, 'completed', 1, '2025-07-01 00:15:36', '2025-07-01 01:51:19'),
(49, 2, 307, 'divan', '2025-07-01 00:32:33', 1, '2025-07-01 00:33:33', '2025-07-01 00:56:47', 117.00, 'completed', 1, '2025-07-01 00:32:33', '2025-07-01 00:56:47'),
(50, 3, 307, 'paijo', '2025-07-01 00:55:03', 1, '2025-07-01 00:56:03', '2025-07-01 00:56:30', 200.00, 'completed', 1, '2025-07-01 00:55:03', '2025-07-01 00:56:30'),
(51, 3, 307, 'jeje', '2025-07-01 00:56:36', 1, '2025-07-01 00:57:36', '2025-07-01 01:03:27', 200.00, 'completed', 1, '2025-07-01 00:56:36', '2025-07-01 01:03:27'),
(52, 3, 307, 'jeri', '2025-07-01 01:03:36', 1, '2025-07-01 01:04:36', '2025-07-01 01:08:17', 200.00, 'completed', 1, '2025-07-01 01:03:36', '2025-07-01 01:08:17'),
(53, 3, 307, 'kere', '2025-07-01 01:08:26', 1, '2025-07-01 01:09:26', '2025-07-01 01:51:13', 200.00, 'completed', 1, '2025-07-01 01:08:26', '2025-07-01 01:51:13'),
(54, 1, 307, 'weyu', '2025-07-01 01:11:54', 1, '2025-07-01 01:12:54', '2025-07-01 01:13:31', 200.00, 'completed', 1, '2025-07-01 01:11:54', '2025-07-01 01:13:31'),
(55, 1, 307, 'ko', '2025-07-01 01:13:39', 50, '2025-07-01 02:03:39', '2025-07-01 01:13:44', 10000.00, 'completed', 1, '2025-07-01 01:13:39', '2025-07-01 01:13:44'),
(56, 1, 307, 'yu', '2025-07-01 01:13:50', 20, '2025-07-01 01:33:50', '2025-07-01 01:51:16', 4000.00, 'completed', 1, '2025-07-01 01:13:50', '2025-07-01 01:51:16'),
(57, 8, 307, 'wer', '2025-07-01 01:14:07', 1, '2025-07-01 01:15:07', '2025-07-01 01:18:59', 117.00, 'completed', 1, '2025-07-01 01:14:07', '2025-07-01 01:18:59'),
(58, 4, 312, 're', '2025-07-01 01:28:07', 50, '2025-07-01 02:18:07', '2025-07-01 01:28:32', 5833.00, 'completed', 2, '2025-07-01 01:28:07', '2025-07-01 01:28:32'),
(59, 2, 307, 'frrr', '2025-07-01 01:35:10', 1, '2025-07-01 01:36:10', '2025-07-01 01:51:08', 117.00, 'completed', 1, '2025-07-01 01:35:10', '2025-07-01 01:51:08'),
(60, 6, 307, 'koli', '2025-07-01 01:46:44', 1, '2025-07-01 01:47:44', '2025-07-01 01:51:10', 117.00, 'completed', 1, '2025-07-01 01:46:44', '2025-07-01 01:51:10'),
(61, 8, 307, 'paijo', '2025-07-01 01:51:25', 1, '2025-07-01 01:52:25', '2025-07-01 02:03:50', 117.00, 'completed', 1, '2025-07-01 01:51:25', '2025-07-01 02:03:50'),
(62, 3, 307, 'errrrr', '2025-07-01 02:00:49', 1, '2025-07-01 02:01:49', '2025-07-01 02:02:13', 200.00, 'completed', 1, '2025-07-01 02:00:49', '2025-07-01 02:02:13'),
(63, 2, 307, 'd', '2025-07-01 02:03:59', 1, '2025-07-01 02:04:59', '2025-07-01 02:23:25', 117.00, 'completed', 1, '2025-07-01 02:03:59', '2025-07-01 02:23:25'),
(64, 3, 307, 'weee', '2025-07-01 02:07:41', 1, '2025-07-01 02:08:41', '2025-07-01 02:23:28', 200.00, 'completed', 1, '2025-07-01 02:07:41', '2025-07-01 02:23:28'),
(65, 1, 307, 'rety', '2025-07-01 02:22:44', 1, '2025-07-01 02:23:44', '2025-07-01 12:44:44', 200.00, 'completed', 1, '2025-07-01 02:22:44', '2025-07-01 12:44:44'),
(66, 2, 307, 'treee', '2025-07-01 02:30:07', 1, '2025-07-01 02:31:07', '2025-07-01 12:44:39', 117.00, 'completed', 1, '2025-07-01 02:30:07', '2025-07-01 12:44:39'),
(67, 3, 307, 'yui', '2025-07-01 02:33:58', 1, '2025-07-01 02:34:58', '2025-07-01 12:40:58', 200.00, 'completed', 1, '2025-07-01 02:33:58', '2025-07-01 12:40:58'),
(68, 8, 307, 'qew', '2025-07-01 02:39:03', 1, '2025-07-01 02:40:03', '2025-07-01 03:03:16', 117.00, 'completed', 1, '2025-07-01 02:39:03', '2025-07-01 03:03:16'),
(69, 8, 307, 'lol', '2025-07-01 03:03:26', 1, '2025-07-01 03:04:26', '2025-07-01 12:35:20', 117.00, 'completed', 1, '2025-07-01 03:03:26', '2025-07-01 12:35:20'),
(70, 6, 307, 'plo', '2025-07-01 03:03:40', 1, '2025-07-01 03:04:40', '2025-07-01 12:43:02', 117.00, 'completed', 1, '2025-07-01 03:03:40', '2025-07-01 12:43:02'),
(71, 5, 307, 'jefry', '2025-07-01 12:27:55', 1, '2025-07-01 12:28:55', '2025-07-01 12:44:46', 200.00, 'completed', 1, '2025-07-01 12:27:55', '2025-07-01 12:44:46'),
(72, 8, 307, 'jeki', '2025-07-01 12:35:26', 1, '2025-07-01 12:36:26', '2025-07-01 12:40:46', 117.00, 'completed', 1, '2025-07-01 12:35:26', '2025-07-01 12:40:46'),
(73, 8, 307, 'jefry', '2025-07-01 12:40:54', 16, '2025-07-01 12:56:54', '2025-07-01 12:44:50', 1867.00, 'completed', 1, '2025-07-01 12:40:54', '2025-07-01 12:44:50'),
(74, 3, 307, 'weru', '2025-07-01 12:41:04', 1, '2025-07-01 12:42:04', '2025-07-01 12:44:41', 200.00, 'completed', 1, '2025-07-01 12:41:04', '2025-07-01 12:44:41'),
(75, 6, 307, 'qer', '2025-07-01 12:43:07', 1, '2025-07-01 12:44:07', '2025-07-01 12:44:48', 117.00, 'completed', 1, '2025-07-01 12:43:07', '2025-07-01 12:44:48'),
(76, 1, 307, 'febry', '2025-07-01 12:52:34', 1, '2025-07-01 12:53:34', '2025-07-01 13:12:40', 200.00, 'completed', 1, '2025-07-01 12:52:34', '2025-07-01 13:12:40'),
(77, 2, 307, 'dew', '2025-07-01 13:00:25', 1, '2025-07-01 13:01:25', '2025-07-01 13:12:37', 117.00, 'completed', 1, '2025-07-01 13:00:25', '2025-07-01 13:12:37'),
(78, 3, 307, 'jk', '2025-07-01 13:11:03', 1, '2025-07-01 13:12:03', '2025-07-01 13:12:34', 200.00, 'completed', 1, '2025-07-01 13:11:03', '2025-07-01 13:12:34'),
(79, 2, 307, 'jeny', '2025-07-01 13:19:01', 1, '2025-07-01 13:20:01', '2025-07-01 13:31:49', 117.00, 'completed', 1, '2025-07-01 13:19:01', '2025-07-01 13:31:49'),
(80, 1, 307, 'jery', '2025-07-01 13:24:40', 2, '2025-07-01 13:26:40', '2025-07-01 13:31:54', 400.00, 'completed', 1, '2025-07-01 13:24:40', '2025-07-01 13:31:54'),
(81, 3, 307, 'paijo', '2025-07-01 13:24:46', 1, '2025-07-01 13:25:46', '2025-07-01 13:32:33', 200.00, 'completed', 1, '2025-07-01 13:24:46', '2025-07-01 13:32:33'),
(82, 3, 307, 'feee', '2025-07-01 13:32:49', 1, '2025-07-01 13:33:49', '2025-07-01 14:01:29', 200.00, 'completed', 1, '2025-07-01 13:32:49', '2025-07-01 14:01:29'),
(83, 2, 307, 'resnu', '2025-07-01 13:36:58', 1, '2025-07-01 13:37:58', '2025-07-01 14:01:26', 117.00, 'completed', 1, '2025-07-01 13:36:58', '2025-07-01 14:01:26'),
(84, 1, 307, 'dimas', '2025-07-01 13:48:06', 1, '2025-07-01 13:49:06', '2025-07-01 13:48:45', 200.00, 'completed', 1, '2025-07-01 13:48:06', '2025-07-01 13:48:45'),
(85, 1, 307, 'fansya', '2025-07-01 13:52:15', 1, '2025-07-01 13:53:15', '2025-07-01 14:01:23', 200.00, 'completed', 1, '2025-07-01 13:52:15', '2025-07-01 14:01:23'),
(86, 1, 307, 'jendra', '2025-07-01 14:02:22', 1, '2025-07-01 14:03:22', '2025-07-01 14:03:36', 200.00, 'completed', 1, '2025-07-01 14:02:22', '2025-07-01 14:03:36'),
(87, 8, 307, 'resnu', '2025-07-01 14:03:51', 1, '2025-07-01 14:04:51', '2025-07-01 14:09:03', 117.00, 'completed', 1, '2025-07-01 14:03:51', '2025-07-01 14:09:03'),
(88, 5, 307, 'jeno', '2025-07-01 14:09:14', 1, '2025-07-01 14:10:14', '2025-07-01 14:10:23', 200.00, 'completed', 1, '2025-07-01 14:09:14', '2025-07-01 14:10:23'),
(89, 5, 307, 'jiki', '2025-07-01 14:10:29', 1, '2025-07-01 14:11:29', '2025-07-01 14:11:38', 200.00, 'completed', 1, '2025-07-01 14:10:29', '2025-07-01 14:11:38'),
(90, 5, 307, 'kl', '2025-07-01 14:31:37', 1, '2025-07-01 14:32:37', '2025-07-01 14:32:48', 200.00, 'completed', 1, '2025-07-01 14:31:37', '2025-07-01 14:32:48'),
(91, 5, 307, 'ree', '2025-07-01 14:32:55', 1, '2025-07-01 14:33:55', '2025-07-01 14:34:10', 200.00, 'completed', 1, '2025-07-01 14:32:55', '2025-07-01 14:34:10');

--
-- Triggers `sewa_ditempat`
--
DELIMITER $$
CREATE TRIGGER `update_ps_status_after_sewa_mulai` AFTER INSERT ON `sewa_ditempat` FOR EACH ROW BEGIN
    IF NEW.status_sewa = 'active' THEN
        UPDATE PS 
        SET status_fisik = 'in_use',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_ps = NEW.id_ps;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_ps_status_after_sewa_selesai` AFTER UPDATE ON `sewa_ditempat` FOR EACH ROW BEGIN
    IF NEW.status_sewa IN ('completed', 'cancelled') AND OLD.status_sewa = 'active' THEN
        UPDATE PS 
        SET status_fisik = 'available',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_ps = NEW.id_ps;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `transaksi_makanan`
--

CREATE TABLE `transaksi_makanan` (
  `id_transaksi_makanan` int(11) NOT NULL,
  `id_karyawan` int(11) NOT NULL,
  `total_harga` decimal(10,2) NOT NULL,
  `id_cabang` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('owner','karyawan') NOT NULL,
  `id_karyawan` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `email`, `password`, `role`, `id_karyawan`, `created_at`, `updated_at`) VALUES
(1, 'dian@gmail.com', '$2a$12$8w/4vRZ9lqn3nR5a7OPa3uHuCQu57kbuLUBleBDw5gBUnGMmUu1Aa', 'karyawan', 307, '2025-06-11 21:06:25', '2025-06-12 00:40:23'),
(3, 'owner1@bossmen.com', '$2b$10$PnlUpAyjQxHJsSQke8KG4ODe4enlcDQM0YrLvX0GZxKTFGU0Zd47q', 'owner', NULL, '2025-06-19 22:53:14', '2025-06-19 22:53:14'),
(6, 'febry@gmail.com', '$2b$10$uBwGKOrwA7GEP21Wsvv6tOU2CTIW5Sj3yKSmSsVJfET5ADcQP2jb6', 'owner', NULL, '2025-06-21 16:42:12', '2025-06-21 16:42:12'),
(7, 'citra@gmail.com', '$2b$10$PItauWBILjmae.XzZ5IAS.ACBRwW3Ur/7kXLUFszYgKW0ekxm3JR.', 'karyawan', 310, '2025-06-21 16:42:57', '2025-06-21 16:42:57'),
(8, 'resnu@gmail.com', '$2b$10$DSczyxLXi1zsxdUUrN7F1uxrshxW2Q2hRbiNgCSvbhUfAzLC7SlIq', 'karyawan', 312, '2025-07-01 01:25:33', '2025-07-01 01:25:33');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `absensi`
--
ALTER TABLE `absensi`
  ADD PRIMARY KEY (`id_absensi`),
  ADD KEY `id_karyawan` (`id_karyawan`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `bahan_baku`
--
ALTER TABLE `bahan_baku`
  ADD PRIMARY KEY (`id_bahan_baku`),
  ADD UNIQUE KEY `nama_bahan_baku` (`nama_bahan_baku`,`id_cabang`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `cabang`
--
ALTER TABLE `cabang`
  ADD PRIMARY KEY (`id_cabang`);

--
-- Indexes for table `detail_transaksi_makanan`
--
ALTER TABLE `detail_transaksi_makanan`
  ADD PRIMARY KEY (`id_detail_transaksi`),
  ADD KEY `id_transaksi_makanan` (`id_transaksi_makanan`),
  ADD KEY `id_makanan` (`id_makanan`);

--
-- Indexes for table `devicetoken`
--
ALTER TABLE `devicetoken`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user` (`user_id`);

--
-- Indexes for table `game`
--
ALTER TABLE `game`
  ADD PRIMARY KEY (`id_game`),
  ADD UNIQUE KEY `nama_game` (`nama_game`);

--
-- Indexes for table `jenis_ps`
--
ALTER TABLE `jenis_ps`
  ADD PRIMARY KEY (`id_jenis_ps`),
  ADD UNIQUE KEY `nama_jenis` (`nama_jenis`);

--
-- Indexes for table `karyawan`
--
ALTER TABLE `karyawan`
  ADD PRIMARY KEY (`id_karyawan`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `log_owner`
--
ALTER TABLE `log_owner`
  ADD PRIMARY KEY (`id_log_owner`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `makanan`
--
ALTER TABLE `makanan`
  ADD PRIMARY KEY (`id_makanan`),
  ADD UNIQUE KEY `nama_makanan` (`nama_makanan`,`id_cabang`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `penggunaan_bahan_baku`
--
ALTER TABLE `penggunaan_bahan_baku`
  ADD PRIMARY KEY (`id_penggunaan_bahan`),
  ADD KEY `id_karyawan` (`id_karyawan`),
  ADD KEY `id_bahan_baku` (`id_bahan_baku`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `ps`
--
ALTER TABLE `ps`
  ADD PRIMARY KEY (`id_ps`),
  ADD KEY `id_jenis_ps` (`id_jenis_ps`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `ps_game`
--
ALTER TABLE `ps_game`
  ADD PRIMARY KEY (`id_ps_game`),
  ADD UNIQUE KEY `id_ps` (`id_ps`,`id_game`),
  ADD KEY `id_game` (`id_game`);

--
-- Indexes for table `report`
--
ALTER TABLE `report`
  ADD PRIMARY KEY (`id_report`),
  ADD KEY `id_karyawan` (`id_karyawan`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `sewa_dibawa_pulang`
--
ALTER TABLE `sewa_dibawa_pulang`
  ADD PRIMARY KEY (`id_sewa_bawa_pulang`),
  ADD KEY `id_ps` (`id_ps`),
  ADD KEY `id_karyawan` (`id_karyawan`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `sewa_ditempat`
--
ALTER TABLE `sewa_ditempat`
  ADD PRIMARY KEY (`id_sewa_ditempat`),
  ADD KEY `id_ps` (`id_ps`),
  ADD KEY `id_karyawan` (`id_karyawan`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `transaksi_makanan`
--
ALTER TABLE `transaksi_makanan`
  ADD PRIMARY KEY (`id_transaksi_makanan`),
  ADD KEY `id_karyawan` (`id_karyawan`),
  ADD KEY `id_cabang` (`id_cabang`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `id_karyawan` (`id_karyawan`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `absensi`
--
ALTER TABLE `absensi`
  MODIFY `id_absensi` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bahan_baku`
--
ALTER TABLE `bahan_baku`
  MODIFY `id_bahan_baku` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `cabang`
--
ALTER TABLE `cabang`
  MODIFY `id_cabang` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `detail_transaksi_makanan`
--
ALTER TABLE `detail_transaksi_makanan`
  MODIFY `id_detail_transaksi` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `devicetoken`
--
ALTER TABLE `devicetoken`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;

--
-- AUTO_INCREMENT for table `game`
--
ALTER TABLE `game`
  MODIFY `id_game` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `jenis_ps`
--
ALTER TABLE `jenis_ps`
  MODIFY `id_jenis_ps` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `karyawan`
--
ALTER TABLE `karyawan`
  MODIFY `id_karyawan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=313;

--
-- AUTO_INCREMENT for table `log_owner`
--
ALTER TABLE `log_owner`
  MODIFY `id_log_owner` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `makanan`
--
ALTER TABLE `makanan`
  MODIFY `id_makanan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `penggunaan_bahan_baku`
--
ALTER TABLE `penggunaan_bahan_baku`
  MODIFY `id_penggunaan_bahan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ps`
--
ALTER TABLE `ps`
  MODIFY `id_ps` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `ps_game`
--
ALTER TABLE `ps_game`
  MODIFY `id_ps_game` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `report`
--
ALTER TABLE `report`
  MODIFY `id_report` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sewa_dibawa_pulang`
--
ALTER TABLE `sewa_dibawa_pulang`
  MODIFY `id_sewa_bawa_pulang` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `sewa_ditempat`
--
ALTER TABLE `sewa_ditempat`
  MODIFY `id_sewa_ditempat` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `transaksi_makanan`
--
ALTER TABLE `transaksi_makanan`
  MODIFY `id_transaksi_makanan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `absensi`
--
ALTER TABLE `absensi`
  ADD CONSTRAINT `absensi_ibfk_1` FOREIGN KEY (`id_karyawan`) REFERENCES `karyawan` (`id_karyawan`),
  ADD CONSTRAINT `absensi_ibfk_2` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `bahan_baku`
--
ALTER TABLE `bahan_baku`
  ADD CONSTRAINT `bahan_baku_ibfk_1` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `detail_transaksi_makanan`
--
ALTER TABLE `detail_transaksi_makanan`
  ADD CONSTRAINT `detail_transaksi_makanan_ibfk_1` FOREIGN KEY (`id_transaksi_makanan`) REFERENCES `transaksi_makanan` (`id_transaksi_makanan`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_transaksi_makanan_ibfk_2` FOREIGN KEY (`id_makanan`) REFERENCES `makanan` (`id_makanan`);

--
-- Constraints for table `devicetoken`
--
ALTER TABLE `devicetoken`
  ADD CONSTRAINT `devicetoken_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `karyawan`
--
ALTER TABLE `karyawan`
  ADD CONSTRAINT `karyawan_ibfk_1` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`) ON DELETE CASCADE;

--
-- Constraints for table `log_owner`
--
ALTER TABLE `log_owner`
  ADD CONSTRAINT `log_owner_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `log_owner_ibfk_2` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `makanan`
--
ALTER TABLE `makanan`
  ADD CONSTRAINT `makanan_ibfk_1` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `penggunaan_bahan_baku`
--
ALTER TABLE `penggunaan_bahan_baku`
  ADD CONSTRAINT `penggunaan_bahan_baku_ibfk_1` FOREIGN KEY (`id_karyawan`) REFERENCES `karyawan` (`id_karyawan`),
  ADD CONSTRAINT `penggunaan_bahan_baku_ibfk_2` FOREIGN KEY (`id_bahan_baku`) REFERENCES `bahan_baku` (`id_bahan_baku`),
  ADD CONSTRAINT `penggunaan_bahan_baku_ibfk_3` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `ps`
--
ALTER TABLE `ps`
  ADD CONSTRAINT `ps_ibfk_1` FOREIGN KEY (`id_jenis_ps`) REFERENCES `jenis_ps` (`id_jenis_ps`),
  ADD CONSTRAINT `ps_ibfk_2` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `ps_game`
--
ALTER TABLE `ps_game`
  ADD CONSTRAINT `ps_game_ibfk_1` FOREIGN KEY (`id_ps`) REFERENCES `ps` (`id_ps`) ON DELETE CASCADE,
  ADD CONSTRAINT `ps_game_ibfk_2` FOREIGN KEY (`id_game`) REFERENCES `game` (`id_game`) ON DELETE CASCADE;

--
-- Constraints for table `report`
--
ALTER TABLE `report`
  ADD CONSTRAINT `report_ibfk_1` FOREIGN KEY (`id_karyawan`) REFERENCES `karyawan` (`id_karyawan`),
  ADD CONSTRAINT `report_ibfk_2` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `sewa_dibawa_pulang`
--
ALTER TABLE `sewa_dibawa_pulang`
  ADD CONSTRAINT `sewa_dibawa_pulang_ibfk_1` FOREIGN KEY (`id_ps`) REFERENCES `ps` (`id_ps`),
  ADD CONSTRAINT `sewa_dibawa_pulang_ibfk_2` FOREIGN KEY (`id_karyawan`) REFERENCES `karyawan` (`id_karyawan`),
  ADD CONSTRAINT `sewa_dibawa_pulang_ibfk_3` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `sewa_ditempat`
--
ALTER TABLE `sewa_ditempat`
  ADD CONSTRAINT `sewa_ditempat_ibfk_1` FOREIGN KEY (`id_ps`) REFERENCES `ps` (`id_ps`),
  ADD CONSTRAINT `sewa_ditempat_ibfk_2` FOREIGN KEY (`id_karyawan`) REFERENCES `karyawan` (`id_karyawan`),
  ADD CONSTRAINT `sewa_ditempat_ibfk_3` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `transaksi_makanan`
--
ALTER TABLE `transaksi_makanan`
  ADD CONSTRAINT `transaksi_makanan_ibfk_1` FOREIGN KEY (`id_karyawan`) REFERENCES `karyawan` (`id_karyawan`),
  ADD CONSTRAINT `transaksi_makanan_ibfk_2` FOREIGN KEY (`id_cabang`) REFERENCES `cabang` (`id_cabang`);

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`id_karyawan`) REFERENCES `karyawan` (`id_karyawan`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
