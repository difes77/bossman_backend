const express = require("express");
const router = express.Router();
const makananController = require("../controllers/makananController");
const { authenticateToken } = require("../middlewares/authMiddleware");
// ✅ MAKANAN ROUTES
router.get("/", authenticateToken, makananController.getAll);
router.get("/menu", authenticateToken, makananController.getMenu);
router.get("/:id", authenticateToken, makananController.getById); // ✅ NEW
router.get("/:id/resep", authenticateToken, makananController.getResep); // ✅ NEW
router.post("/", authenticateToken, makananController.create);
router.put("/:id", authenticateToken, makananController.update);
router.delete("/:id", authenticateToken, makananController.remove);

// ✅ TRANSAKSI ROUTES
router.get(
  "/transaksi/all",
  authenticateToken,
  makananController.getTransaksiMakanan
);
router.get(
  "/transaksi/:id/detail",
  authenticateToken,
  makananController.getDetailTransaksi
);

module.exports = router;
