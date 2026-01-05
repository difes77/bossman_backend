const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// 📊 Ringkasan statistik dashboard (jumlah sewa, pendapatan, dll)
router.get("/summary", authenticateToken, dashboardController.getSummary);

// 📄 Export PDF dengan range tanggal
router.get("/export-pdf", authenticateToken, dashboardController.exportPDF);

// 📈 Grafik pendapatan harian (default: 7 hari terakhir atau filter tanggal)
router.get(
  "/pendapatan-harian",
  authenticateToken,
  dashboardController.getPendapatanHarian
);

// 📈 ✅ BARU: Grafik pendapatan berdasarkan RANGE TANGGAL (tanggal_awal → tanggal_akhir)
router.get(
  "/pendapatan-by-range",
  authenticateToken,
  dashboardController.getPendapatanByDateRange
);

// 📅 Grafik pendapatan mingguan (default: 8 minggu atau filter tahun)
router.get(
  "/pendapatan-mingguan",
  authenticateToken,
  dashboardController.getPendapatanMingguan
);

// 📆 Grafik pendapatan bulanan (default: 12 bulan atau filter tahun)
router.get(
  "/pendapatan-bulanan",
  authenticateToken,
  dashboardController.getPendapatanBulanan
);

// 📆 Grafik pendapatan tahunan (berdasarkan tahun)
router.get(
  "/pendapatan-tahunan",
  authenticateToken,
  dashboardController.getPendapatanTahunan
);

module.exports = router;
