const express = require("express");
const router = express.Router();
const bahanBakuController = require("../controllers/bahanBakuController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");

// GET semua bahan baku
router.get("/", authenticateToken, bahanBakuController.getAll);

// POST tambah bahan baku
router.post("/", authenticateToken, verifyOwner, bahanBakuController.create);
// GET bahan baku berdasarkan id cabang (akses untuk karyawan)
router.get("/cabang/:id", authenticateToken, bahanBakuController.getByCabang);

// PUT update bahan baku
router.put("/:id", authenticateToken, verifyOwner, bahanBakuController.update);

// DELETE hapus bahan baku
router.delete(
  "/:id",
  authenticateToken,
  verifyOwner,
  bahanBakuController.remove
);

module.exports = router;
