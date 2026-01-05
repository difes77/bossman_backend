// middlewares/uploadReportMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Buat folder uploads/report jika belum ada
const reportPath = path.join(__dirname, "..", "uploads", "report");
if (!fs.existsSync(reportPath)) fs.mkdirSync(reportPath, { recursive: true });

// Konfigurasi penyimpanan
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, reportPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Validasi hanya terima gambar jpg/jpeg/png
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Hanya file gambar (jpg, jpeg, png) yang diperbolehkan"),
      false
    );
  }
  cb(null, true);
};

// Inisialisasi multer
const uploadReport = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // maksimal 5MB per gambar
  },
});

module.exports = uploadReport;
