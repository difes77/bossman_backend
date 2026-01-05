// middleware/uploadAbsensi.js
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Buat folder uploads/absensi jika belum ada
const absensiPath = path.join(__dirname, "..", "uploads", "absensi");
if (!fs.existsSync(absensiPath)) fs.mkdirSync(absensiPath, { recursive: true });

// Override destination
const absensiStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, absensiPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadAbsensi = multer({ storage: absensiStorage }).fields([
  { name: "foto_absensi", maxCount: 1 },
]);

module.exports = uploadAbsensi;
