const floorPlanModel = require("../models/floorPlanModel");
const mapConsoleStatus = require("../helpers/mapConsoleStatus");
const db = require("../config/db");
const getConsoleDetail = async (req, res) => {
  try {
    const { id_ps } = req.params;

    const [consoleRows] = await floorPlanModel.getConsoleById(id_ps);
    if (!consoleRows.length) {
      return res.status(404).json({ message: "Console tidak ditemukan" });
    }

    const consoleData = consoleRows[0];

    // ✅ Get semua harga dari Jenis_PS
    const [jenisRows] = await db.execute(
      `SELECT 
        harga_per_jam,
        harga_per_12_jam,
        harga_1_hari,
        harga_2_hari,
        harga_3_hari,
        harga_4_hari,
        harga_5_hari,
        harga_6_hari,
        harga_7_hari
       FROM Jenis_PS 
       WHERE id_jenis_ps = ?`,
      [consoleData.id_jenis_ps]
    );

    // ✅ Extract semua harga atau set default 0
    const hargaData =
      jenisRows.length > 0
        ? jenisRows[0]
        : {
            harga_per_jam: 0,
            harga_per_12_jam: 0,
            harga_1_hari: 0,
            harga_2_hari: 0,
            harga_3_hari: 0,
            harga_4_hari: 0,
            harga_5_hari: 0,
            harga_6_hari: 0,
            harga_7_hari: 0,
          };

    const [rentalRows] = await floorPlanModel.getActiveRentalByConsole(id_ps);
    const sewaAktif = rentalRows.length > 0;

    // ✅ Fix: rental harus didefinisikan sebelum digunakan
    const rental = sewaAktif ? rentalRows[0] : null;

    const mappedData = mapConsoleStatus(
      consoleData,
      sewaAktif,
      rental?.id_sewa_ditempat || null
    );

    if (!sewaAktif) {
      return res.json({
        status: "available",
        console: {
          ...mappedData,
          // ✅ Include semua harga paket
          harga_per_jam: hargaData.harga_per_jam,
          harga_per_12_jam: hargaData.harga_per_12_jam,
          harga_1_hari: hargaData.harga_1_hari,
          harga_2_hari: hargaData.harga_2_hari,
          harga_3_hari: hargaData.harga_3_hari,
          harga_4_hari: hargaData.harga_4_hari,
          harga_5_hari: hargaData.harga_5_hari,
          harga_6_hari: hargaData.harga_6_hari,
          harga_7_hari: hargaData.harga_7_hari,
        },
      });
    }

    const now = new Date();
    const estimasi = new Date(rental.waktu_selesai_estimasi);
    const sisa = Math.max(0, Math.floor((estimasi - now) / 60000)); // dalam menit

    return res.json({
      status: "in_use",
      console: {
        ...mappedData,
        // ✅ Include semua harga paket
        harga_per_jam: hargaData.harga_per_jam,
        harga_per_12_jam: hargaData.harga_per_12_jam,
        harga_1_hari: hargaData.harga_1_hari,
        harga_2_hari: hargaData.harga_2_hari,
        harga_3_hari: hargaData.harga_3_hari,
        harga_4_hari: hargaData.harga_4_hari,
        harga_5_hari: hargaData.harga_5_hari,
        harga_6_hari: hargaData.harga_6_hari,
        harga_7_hari: hargaData.harga_7_hari,
      },
      rental: {
        id_sewa: rental.id_sewa_ditempat,
        nama_penyewa: rental.nama_penyewa,
        sisa_waktu: `${String(Math.floor(sisa / 60)).padStart(2, "0")}:${String(
          sisa % 60
        ).padStart(2, "0")}`,
        waktu_mulai: rental.waktu_mulai,
        estimasi_selesai: rental.waktu_selesai_estimasi,
      },
    });
  } catch (err) {
    console.error("❌ Error getConsoleDetail:", err);
    res.status(500).json({ message: err.message });
  }
};

const updateConsoleStatus = async (req, res) => {
  try {
    const { id_ps } = req.params;
    const { status_fisik } = req.body;

    const allowedStatuses = ["available", "maintenance"];

    if (!allowedStatuses.includes(status_fisik)) {
      return res.status(400).json({ message: "Status fisik tidak valid" });
    }

    // Update status di DB
    const [result] = await floorPlanModel.updateConsoleStatus(
      id_ps,
      status_fisik
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Console tidak ditemukan" });
    }

    // Ambil data console setelah update untuk keperluan emit
    const [consoleRows] = await floorPlanModel.getConsoleById(id_ps);
    const console = consoleRows[0];

    // Emit ke semua client di cabang ini
    const io = req.app.get("io");
    if (io && console?.id_cabang) {
      io.to(`branch_${console.id_cabang}`).emit("console_status_updated", {
        id_ps,
        status_fisik,
      });
    }

    res.json({
      message: "Status konsol berhasil diperbarui",
      id_ps,
      status_fisik,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getConsolesByBranch = async (req, res) => {
  try {
    const { id_cabang } = req.params;
    const [rows] = await floorPlanModel.getConsolesByBranch(id_cabang);

    const consoles = await Promise.all(
      rows.map(async (ps) => {
        const [rentalRows] = await floorPlanModel.getActiveRentalByConsole(
          ps.id_ps
        );
        const sewaAktif = rentalRows.length > 0;
        const idSewa = sewaAktif ? rentalRows[0].id_sewa_ditempat : null;
        const rentalData = sewaAktif ? rentalRows[0] : null;
        return mapConsoleStatus(ps, sewaAktif, idSewa, rentalData);
      })
    );

    res.json({ consoles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFloorPlanByBranch = async (req, res) => {
  try {
    const { id_cabang } = req.params;

    // Ambil semua PS di cabang
    const [consoleRows] = await floorPlanModel.getConsolesByBranch(id_cabang);

    // Untuk tiap PS, ambil status sewa aktif dan id_sewa
    const consolesWithStatus = await Promise.all(
      consoleRows.map(async (ps) => {
        const [rentalRows] = await floorPlanModel.getActiveRentalByConsole(
          ps.id_ps
        );
        const sewaAktif = rentalRows.length > 0;
        const idSewa = sewaAktif ? rentalRows[0].id_sewa_ditempat : null;
        const rentalData = sewaAktif ? rentalRows[0] : null; // ⬅ tambahkan ini
        return mapConsoleStatus(ps, sewaAktif, idSewa, rentalData); // ⬅ kirim rentalData
      })
    );

    res.json(consolesWithStatus);
  } catch (err) {
    console.error("❌ Error floorPlan:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getConsoleDetail,
  updateConsoleStatus,
  getConsolesByBranch,
  getFloorPlanByBranch,
};
