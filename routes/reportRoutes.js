const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const uploadReport = require("../middlewares/uploadReportMiddleware");

router.post("/", uploadReport.array("fotos", 5), reportController.createReport);
router.get("/", reportController.getAllReports);
router.get("/:id", reportController.getReportById);
router.put("/:id/status", reportController.updateStatus);

module.exports = router;
