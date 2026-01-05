const mysql = require("mysql2/promise");
require("dotenv").config();

// Railway menyediakan satu string lengkap dalam variabel DATABASE_URL
const connection = mysql.createPool(process.env.DATABASE_URL || {
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
