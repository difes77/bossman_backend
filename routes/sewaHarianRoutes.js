const express = require("express");
const router = express.Router();
const controller = require("../controllers/sewaHarianController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, controller.getSewaHarian);

module.exports = router;
