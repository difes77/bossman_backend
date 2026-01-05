const express = require("express");
const router = express.Router();
const controller = require("../controllers/rentalBawaPulangController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// ✅ JANGAN DUA KALI router.post("/")
router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "foto_orang", maxCount: 1 },
    { name: "foto_identitas_jaminan", maxCount: 1 },
  ]),
  controller.createRental
);

router.put("/:id/tolak", authenticateToken, controller.tolakSewa);
router.put(
  "/:id/kembali",
  authenticateToken,
  upload.fields([
    { name: "foto_bukti_1", maxCount: 1 },
    { name: "foto_bukti_2", maxCount: 1 },
  ]),
  controller.completeSewa
);
router.get(
  "/approved/:id_cabang",
  authenticateToken,
  controller.getApprovedRentalsByBranch
);
router.put("/:id/setujui", authenticateToken, controller.setujuiSewa);

router.get(
  "/active/:id_ps",
  authenticateToken,
  controller.getActiveRentalByConsoleId
);
router.get("/list", authenticateToken, controller.getSewaList);

module.exports = router;
