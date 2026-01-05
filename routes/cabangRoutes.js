const express = require("express");
const router = express.Router();
const cabangController = require("../controllers/cabangController");
const {
  authenticateToken,
  verifyOwner,
} = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, verifyOwner, cabangController.getAllCabang);
router.post("/", authenticateToken, verifyOwner, cabangController.createCabang);
router.put(
  "/:id",
  authenticateToken,
  verifyOwner,
  cabangController.updateCabang
);
router.delete(
  "/:id",
  authenticateToken,
  verifyOwner,
  cabangController.deleteCabang
);
router.put(
  "/:id/restore",
  authenticateToken,
  verifyOwner,
  cabangController.restoreCabang
); // ✅ New

module.exports = router;
