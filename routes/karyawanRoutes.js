const express = require("express");
const router = express.Router();
const karyawanController = require("../controllers/karyawanController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, karyawanController.getAllKaryawan);

// ✅ Route baru

router.post(
  "/",
  authenticateToken,
  verifyOwner,
  karyawanController.createKaryawan
);

router.get("/tanpa-akun", karyawanController.getKaryawanTanpaAkun);

router.put(
  "/:id",
  authenticateToken,
  verifyOwner,
  karyawanController.updateKaryawan
);
router.get(
  "/cabang/:idCabang",
  authenticateToken,
  karyawanController.getKaryawanByCabang
);
router.delete(
  "/:id",
  authenticateToken,
  verifyOwner,
  karyawanController.deleteKaryawan
);

module.exports = router;
