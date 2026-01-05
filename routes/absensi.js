const express = require("express");
const router = express.Router();
const absensiController = require("../controllers/absensiController");
const uploadAbsensi = require("../middlewares/uploadAbsensi");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Route yang sudah ada (tidak diubah)
router.post(
  "/",
  authenticateToken,
  uploadAbsensi,
  absensiController.createAbsensi
);
router.get(
  "/hari-ini/:id_karyawan",
  authenticateToken,
  absensiController.getAbsensiHariIni
);

// ✅ Route baru untuk Admin
router.get("/all", authenticateToken, absensiController.getAllAbsensi);

router.get("/summary", authenticateToken, absensiController.getAbsensiSummary);

module.exports = router;
