// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ═══════════════════════════════════════════════════════════
// SOCKET.IO SETUP
// ═══════════════════════════════════════════════════════════
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// ✅ Initialize Socket Handler (Single import)
const { initializeSocket } = require("./websocket/socketHandler");
initializeSocket(io);

// Make io accessible via app
app.set("io", io);

// Inject io ke request (untuk backward compatibility)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════
const authRoutes = require("./routes/authRoutes");
const floorPlanRoutes = require("./routes/floorPlanRoutes");
const rentalDitempatRoutes = require("./routes/rentalDitempatRoutes");
const rentalDibawaPulangRoutes = require("./routes/rentalBawaPulangRoutes");
const deviceTokenRoutes = require("./routes/deviceTokenRoutes");
const psRoutes = require("./routes/psRoutes");
const cabangRoutes = require("./routes/cabangRoutes");
const karyawanRoutes = require("./routes/karyawanRoutes");
const jenisPsRoutes = require("./routes/jenisPsRoutes");
const gameRoutes = require("./routes/gameRoutes");
const makananRoutes = require("./routes/makananRoutes");
const transaksiMakananRoutes = require("./routes/transaksiMakananRoutes");
const bahanBakuRoutes = require("./routes/bahanBakuRoutes");
const penggunaanBahanRoutes = require("./routes/penggunaanBahanRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const sewaHarianRoute = require("./routes/sewaHarianRoutes");
const absensiRoutes = require("./routes/absensi");
const shiftRoutes = require("./routes/shiftRoutes");
const kehadiranRoutes = require("./routes/kehadiranRoutes");
const resepRoutes = require("./routes/resepMakanan");

app.use("/api/resep", resepRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/sewa/harian", sewaHarianRoute);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/bahan-baku", bahanBakuRoutes);
app.use("/api/penggunaan-bahan", penggunaanBahanRoutes);
app.use("/api/transaksi-makanan", transaksiMakananRoutes);
app.use("/api/jenis-ps", jenisPsRoutes);
app.use("/api/makanan", makananRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/floorplan", floorPlanRoutes);
app.use("/api/rental-ditempat", rentalDitempatRoutes);
app.use("/api/rental-dibawa-pulang", rentalDibawaPulangRoutes);
app.use("/api/device-token", deviceTokenRoutes);
app.use("/api/ps", psRoutes);
app.use("/api/cabang", cabangRoutes);
app.use("/api/karyawan", karyawanRoutes);
app.use("/api/shift", shiftRoutes);
app.use("/api/kehadiran", kehadiranRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "Bossmen PlayStation API is running...",
    websocket: "enabled",
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
});
