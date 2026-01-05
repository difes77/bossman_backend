const mysql = require("mysql2/promise"); // ✅ ganti ini
require("dotenv").config();

const connection = mysql.createPool({
  // ✅ pakai createPool lebih baik
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bossman_ps_db2",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00",
});

module.exports = connection;
