// routes/shift.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/shiftController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get(
  "/shift-config/:id_cabang",
  authenticateToken,
  controller.getShiftConfig
);
router.post("/shift-config", authenticateToken, controller.createShiftConfig);
router.put(
  "/shift-config/:id_shift_config",
  authenticateToken,
  controller.updateShiftConfig
);

router.get(
  "/jadwal/:id_karyawan",
  authenticateToken,
  controller.getJadwalKaryawan
);
router.get(
  "/jadwal/:id_karyawan/hari-ini",
  authenticateToken,
  controller.getJadwalHariIni
);
router.post("/jadwal", authenticateToken, controller.createJadwalShift);
router.post(
  "/jadwal/bulk",
  authenticateToken,
  controller.createBulkJadwalShift
);
router.put(
  "/jadwal/:id_jadwal_shift",
  authenticateToken,
  controller.updateJadwalShift
);
router.delete(
  "/jadwal/:id_jadwal_shift",
  authenticateToken,
  controller.deleteJadwalShift
);

module.exports = router;
