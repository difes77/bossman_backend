const express = require("express");
const router = express.Router();
const {
  getKehadiranBulanan,
  getDetailKehadiranBulanan,
  getKehadiranSemuaKaryawan,
  getStatistikPerShift,
  exportKehadiranPenggajian,
} = require("../controllers/kehadiranController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// PENTING: Route spesifik HARUS di atas route dengan parameter dinamis
// Kehadiran semua karyawan (Admin/HRD) - PINDAH KE ATAS
router.get("/semua", authenticateToken, getKehadiranSemuaKaryawan);
router.get("/statistik-shift", authenticateToken, getStatistikPerShift);
router.get("/export-penggajian", authenticateToken, exportKehadiranPenggajian);

// Kehadiran karyawan individu - Route dengan parameter di bawah
router.get("/:id_karyawan/bulanan", authenticateToken, getKehadiranBulanan);
router.get(
  "/:id_karyawan/detail",
  authenticateToken,
  getDetailKehadiranBulanan
);

module.exports = router;
