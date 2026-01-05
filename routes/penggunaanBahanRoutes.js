const express = require("express");
const router = express.Router();
const controller = require("../controllers/penggunaanBahanController");

// POST penggunaan bahan baku
router.post("/", controller.createPenggunaan);

// GET list penggunaan (dengan optional filter tanggal dan cabang)
router.get("/", controller.getPenggunaanFiltered);
router.get("/harian", controller.getByTanggal);
router.get("/export/pdf", controller.exportPDF);
router.get("/export/excel", controller.exportExcel);

module.exports = router;
