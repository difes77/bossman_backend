const express = require("express");
const router = express.Router();
const resepController = require("../controllers/resepMakananController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/:id", authenticateToken, resepController.getResepByMakanan);
router.put("/:id", authenticateToken, resepController.upsertResep);
router.delete("/item/:id", authenticateToken, resepController.deleteResepItem);
router.get(
  "/:id/check-stok",
  authenticateToken,
  resepController.checkStokCukup
);

module.exports = router;
