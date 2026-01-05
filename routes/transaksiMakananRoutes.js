const express = require("express");
const router = express.Router();
const controller = require("../controllers/transaksiMakananController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, controller.getAll);
router.post("/", authenticateToken, controller.create);
router.get("/harian", controller.getByTanggal);
router.get("/:id", authenticateToken, controller.getDetail);

module.exports = router;
