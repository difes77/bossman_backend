const db = require("../config/db");
const path = require("path");
const fs = require("fs");
const { isInShiftTime, getShiftDate } = require("./shiftController");

// ✅ Helper function untuk mendapatkan waktu Jakarta yang benar
const getJakartaTime = () => {
  const now = new Date();
  // Convert ke Jakarta timezone menggunakan offset +7
  const jakartaOffset = 7 * 60; // 7 hours in minutes
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const jakartaTime = new Date(utcTime + jakartaOffset * 60000);

  console.log("⏰ Time Debug:");
  console.log("  - Server time (UTC):", now.toISOString());
  console.log("  - Jakarta time:", jakartaTime.toISOString());
  console.log("  - Timezone offset:", now.getTimezoneOffset());

  return jakartaTime;
};

const createAbsensi = async (req, res) => {
  try {
    const data = req.body;
    const files = req.files;

    const id_karyawan = data.id_karyawan;
    const id_cabang = data.id_cabang;
    const tipe_absensi = data.tipe_absensi; // 'masuk' atau 'pulang'
    const foto = files?.foto_absensi?.[0]?.filename;

    if (!id_karyawan || !id_cabang || !tipe_absensi || !foto) {
      return res.status(400).json({ message: "Field tidak boleh kosong." });
    }

    // Validasi tipe_absensi
    if (!["masuk", "pulang"].includes(tipe_absensi)) {
      return res.status(400).json({ message: "Tipe absensi tidak valid." });
    }

    // ✅ PERBAIKAN: Gunakan helper function
    const jakartaTime = getJakartaTime();
    const currentDate = jakartaTime.toISOString().slice(0, 10);
    const currentTime = jakartaTime.toTimeString().slice(0, 5); // HH:MM

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 CREATE ABSENSI - DEBUG INFO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👤 ID Karyawan:", id_karyawan);
    console.log("📅 Current Date:", currentDate);
    console.log("🕐 Current Time:", currentTime);
    console.log("📸 Tipe:", tipe_absensi);

    // Cari jadwal shift karyawan yang aktif
    const yesterday = new Date(jakartaTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().slice(0, 10);

    console.log("📅 Checking dates:", currentDate, yesterdayDate);

    // ✅ PERBAIKAN: Prioritaskan jadwal hari ini dengan ORDER BY
    const [jadwalList] = await db.execute(
      `SELECT 
        js.*,
        sc.nama_shift,
        sc.jam_mulai,
        sc.jam_selesai
       FROM jadwal_shift js
       JOIN shift_config sc ON js.id_shift_config = sc.id_shift_config
       WHERE js.id_karyawan = ? 
       AND js.tanggal IN (?, ?)
       AND js.status_jadwal = 'terjadwal'
       ORDER BY 
         CASE WHEN js.tanggal = ? THEN 0 ELSE 1 END,
         js.tanggal DESC`,
      [id_karyawan, currentDate, yesterdayDate, currentDate]
    );

    console.log(`📋 Found ${jadwalList.length} jadwal(s)`);
    jadwalList.forEach((j, i) => {
      console.log(
        `  [${i}] ${j.tanggal} - ${j.nama_shift} (${j.jam_mulai}-${j.jam_selesai})`
      );
    });

    // ✅ Cari shift yang sedang aktif
    const activeShift = jadwalList.find((j) => {
      const shiftStart = j.jam_mulai.slice(0, 5);
      const shiftEnd = j.jam_selesai.slice(0, 5);
      const isActive = isInShiftTime(currentTime, shiftStart, shiftEnd);
      console.log(
        `  🔍 Checking ${j.nama_shift}: ${shiftStart}-${shiftEnd} = ${isActive}`
      );
      return isActive;
    });

    if (!activeShift) {
      console.log("❌ No active shift found!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return res.status(400).json({
        message:
          "Anda tidak memiliki jadwal shift aktif saat ini. Hubungi admin untuk informasi jadwal Anda.",
        debug: {
          current_time: currentTime,
          current_date: currentDate,
          jadwal_found: jadwalList.length,
        },
      });
    }

    console.log("✅ Active shift found:", activeShift.nama_shift);
    console.log("  - ID:", activeShift.id_jadwal_shift);
    console.log("  - Date:", activeShift.tanggal);
    console.log(
      "  - Time:",
      activeShift.jam_mulai,
      "-",
      activeShift.jam_selesai
    );

    // Cek apakah sudah absen untuk shift ini
    const [existing] = await db.execute(
      `SELECT 
        a.*,
        CONVERT_TZ(a.created_at, '+00:00', '+07:00') as created_at_jakarta
       FROM absensi a
       WHERE a.id_karyawan = ? 
       AND a.tipe_absensi = ?
       AND a.id_jadwal_shift = ?`,
      [id_karyawan, tipe_absensi, activeShift.id_jadwal_shift]
    );

    if (existing.length > 0) {
      const existingTime = new Date(
        existing[0].created_at_jakarta
      ).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      console.log("⚠️  Already absent:", tipe_absensi, "at", existingTime);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return res.status(400).json({
        message: `Anda sudah absen ${tipe_absensi} untuk shift ${activeShift.nama_shift} pada jam ${existingTime}.`,
      });
    }

    // Validasi: Tidak bisa absen pulang sebelum absen masuk
    if (tipe_absensi === "pulang") {
      const [absenMasuk] = await db.execute(
        `SELECT id_absensi FROM absensi 
         WHERE id_karyawan = ? 
         AND tipe_absensi = 'masuk' 
         AND id_jadwal_shift = ?`,
        [id_karyawan, activeShift.id_jadwal_shift]
      );

      if (absenMasuk.length === 0) {
        console.log("⚠️  No masuk record found");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        return res.status(400).json({
          message:
            "Anda harus absen masuk terlebih dahulu sebelum absen pulang.",
        });
      }
    }

    // Simpan ke database dengan id_jadwal_shift
    await db.execute(
      `INSERT INTO absensi (id_karyawan, foto_absensi, tipe_absensi, id_cabang, id_jadwal_shift) 
       VALUES (?, ?, ?, ?, ?)`,
      [id_karyawan, foto, tipe_absensi, id_cabang, activeShift.id_jadwal_shift]
    );

    console.log("✅ Absensi saved successfully");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ✅ Response lebih informatif
    res.status(201).json({
      message: `Absensi ${tipe_absensi} berhasil disimpan untuk shift ${activeShift.nama_shift}.`,
      shift: {
        tanggal: activeShift.tanggal,
        nama_shift: activeShift.nama_shift,
        jam_mulai: activeShift.jam_mulai,
        jam_selesai: activeShift.jam_selesai,
      },
      debug: {
        id_jadwal_shift: activeShift.id_jadwal_shift,
        tanggal_absensi: currentDate,
        waktu_absensi: currentTime,
      },
    });
  } catch (err) {
    console.error("❌ Gagal menyimpan absensi:", err);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    res.status(500).json({
      message: "Gagal menyimpan absensi.",
      error: err.message,
    });
  }
};

// Ambil data absensi untuk shift saat ini
// Ambil data absensi untuk shift saat ini
const getAbsensiHariIni = async (req, res) => {
  try {
    const { id_karyawan } = req.params;

    // ✅ PERBAIKAN: Gunakan helper function
    const jakartaTime = getJakartaTime();
    const currentDate = jakartaTime.toISOString().slice(0, 10);
    const currentTime = jakartaTime.toTimeString().slice(0, 5);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 GET ABSENSI HARI INI - DEBUG INFO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👤 ID Karyawan:", id_karyawan);
    console.log("📅 Current Date:", currentDate);
    console.log("🕐 Current Time:", currentTime);

    const yesterday = new Date(jakartaTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().slice(0, 10);

    console.log("📅 Checking dates:", currentDate, yesterdayDate);

    // Cari shift aktif
    const [jadwalList] = await db.execute(
      `SELECT js.*, sc.nama_shift, sc.jam_mulai, sc.jam_selesai
       FROM jadwal_shift js
       JOIN shift_config sc ON js.id_shift_config = sc.id_shift_config
       WHERE js.id_karyawan = ? 
       AND js.tanggal IN (?, ?)
       AND js.status_jadwal = 'terjadwal'
       ORDER BY 
         CASE WHEN js.tanggal = ? THEN 0 ELSE 1 END,
         js.tanggal DESC`,
      [id_karyawan, currentDate, yesterdayDate, currentDate]
    );

    console.log(`📋 Found ${jadwalList.length} jadwal(s):`);
    jadwalList.forEach((j, i) => {
      console.log(
        `  [${i}] ${j.tanggal} - ${j.nama_shift} (${j.jam_mulai}-${j.jam_selesai})`
      );
    });

    const activeShift = jadwalList.find((j) => {
      const shiftStart = j.jam_mulai.slice(0, 5);
      const shiftEnd = j.jam_selesai.slice(0, 5);
      const isActive = isInShiftTime(currentTime, shiftStart, shiftEnd);
      console.log(
        `  🔍 Checking ${j.nama_shift}: ${shiftStart}-${shiftEnd} = ${isActive}`
      );
      return isActive;
    });

    if (!activeShift) {
      console.log("❌ No active shift found");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      // ✅ PERBAIKAN: Return object dengan info tidak ada shift
      return res.json({
        hasActiveShift: false,
        shiftInfo: null,
        absensiRecords: [],
      });
    }

    console.log("✅ Active shift:", activeShift.nama_shift);
    console.log("  - ID:", activeShift.id_jadwal_shift);

    // Ambil absensi untuk shift aktif
    const [result] = await db.execute(
      `SELECT 
        a.id_absensi,
        a.id_karyawan,
        a.foto_absensi,
        a.tipe_absensi,
        a.id_cabang,
        CONVERT_TZ(a.created_at, '+00:00', '+07:00') as created_at,
        js.tanggal,
        sc.nama_shift,
        sc.jam_mulai,
        sc.jam_selesai
       FROM absensi a
       JOIN jadwal_shift js ON a.id_jadwal_shift = js.id_jadwal_shift
       JOIN shift_config sc ON js.id_shift_config = sc.id_shift_config
       WHERE a.id_jadwal_shift = ?`,
      [activeShift.id_jadwal_shift]
    );

    console.log(`✅ Found ${result.length} absensi record(s)`);
    result.forEach((r, i) => {
      console.log(`  [${i}] ${r.tipe_absensi} at ${r.created_at}`);
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // ✅ PERBAIKAN: Return structured response dengan info shift
    res.json({
      hasActiveShift: true,
      shiftInfo: {
        id_jadwal_shift: activeShift.id_jadwal_shift,
        tanggal: activeShift.tanggal,
        nama_shift: activeShift.nama_shift,
        jam_mulai: activeShift.jam_mulai,
        jam_selesai: activeShift.jam_selesai,
      },
      absensiRecords: result,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    res.status(500).json({
      message: "Gagal mengambil data absensi",
      error: err.message,
    });
  }
};
// ✅ Untuk Admin: Get All Absensi dengan Filter
const getAllAbsensi = async (req, res) => {
  try {
    let { tanggal, id_cabang, tipe_absensi, id_shift_config, id_karyawan } =
      req.query;

    // Default tanggal hari ini menggunakan Jakarta time
    if (!tanggal) {
      const jakartaTime = getJakartaTime();
      tanggal = jakartaTime.toISOString().slice(0, 10);
    }

    const params = [tanggal];
    let whereClause = "WHERE js.tanggal = ?";

    // Filter by karyawan
    if (id_karyawan) {
      whereClause += " AND a.id_karyawan = ?";
      params.push(id_karyawan);
    }

    // Filter by cabang
    if (id_cabang) {
      whereClause += " AND a.id_cabang = ?";
      params.push(id_cabang);
    }

    // Filter by tipe (masuk/pulang)
    if (tipe_absensi && ["masuk", "pulang"].includes(tipe_absensi)) {
      whereClause += " AND a.tipe_absensi = ?";
      params.push(tipe_absensi);
    }

    // Filter by shift
    if (id_shift_config) {
      whereClause += " AND js.id_shift_config = ?";
      params.push(id_shift_config);
    }

    const [result] = await db.execute(
      `SELECT 
        a.id_absensi,
        a.id_karyawan,
        k.nama_karyawan,
        a.foto_absensi,
        a.tipe_absensi,
        CONVERT_TZ(a.created_at, '+00:00', '+07:00') as waktu_absensi,
        a.id_cabang,
        c.nama_cabang,
        js.tanggal as tanggal_shift,
        sc.nama_shift,
        sc.jam_mulai,
        sc.jam_selesai
       FROM absensi a
       JOIN karyawan k ON a.id_karyawan = k.id_karyawan
       JOIN cabang c ON a.id_cabang = c.id_cabang
       JOIN jadwal_shift js ON a.id_jadwal_shift = js.id_jadwal_shift
       JOIN shift_config sc ON js.id_shift_config = sc.id_shift_config
       ${whereClause}
       ORDER BY a.created_at DESC`,
      params
    );

    res.json(result);
  } catch (err) {
    console.error("❌ Error getAllAbsensi:", err);
    res.status(500).json({
      message: "Gagal mengambil data absensi",
      error: err.message,
    });
  }
};

// ✅ Get Summary Absensi dengan shift logic
const getAbsensiSummary = async (req, res) => {
  try {
    let { tanggal, id_cabang, id_shift_config } = req.query;

    if (!tanggal) {
      const jakartaTime = getJakartaTime();
      tanggal = jakartaTime.toISOString().slice(0, 10);
    }

    const params = [tanggal];
    let whereClause = "WHERE js.tanggal = ?";

    if (id_cabang) {
      whereClause += " AND a.id_cabang = ?";
      params.push(id_cabang);
    }

    if (id_shift_config) {
      whereClause += " AND js.id_shift_config = ?";
      params.push(id_shift_config);
    }

    const [summary] = await db.execute(
      `SELECT 
        COUNT(DISTINCT CASE WHEN a.tipe_absensi = 'masuk' THEN a.id_karyawan END) as total_masuk,
        COUNT(DISTINCT CASE WHEN a.tipe_absensi = 'pulang' THEN a.id_karyawan END) as total_pulang,
        COUNT(DISTINCT a.id_karyawan) as total_karyawan_absen,
        COUNT(DISTINCT js.id_jadwal_shift) as total_shift_terjadwal
       FROM jadwal_shift js
       LEFT JOIN absensi a ON js.id_jadwal_shift = a.id_jadwal_shift
       ${whereClause}`,
      params
    );

    res.json(
      summary[0] || {
        total_masuk: 0,
        total_pulang: 0,
        total_karyawan_absen: 0,
        total_shift_terjadwal: 0,
      }
    );
  } catch (err) {
    console.error("❌ Error getAbsensiSummary:", err);
    res.status(500).json({
      message: "Gagal mengambil summary absensi",
      error: err.message,
    });
  }
};

// ✅ Delete absensi (untuk koreksi data)
const deleteAbsensi = async (req, res) => {
  try {
    const { id_absensi } = req.params;

    // Get foto path before delete
    const [absensi] = await db.execute(
      `SELECT foto_absensi FROM absensi WHERE id_absensi = ?`,
      [id_absensi]
    );

    if (absensi.length === 0) {
      return res.status(404).json({ message: "Data absensi tidak ditemukan" });
    }

    // Delete from database
    await db.execute(`DELETE FROM absensi WHERE id_absensi = ?`, [id_absensi]);

    // Delete foto file if exists
    const fotoPath = path.join(
      __dirname,
      "../uploads/absensi",
      absensi[0].foto_absensi
    );
    if (fs.existsSync(fotoPath)) {
      fs.unlinkSync(fotoPath);
    }

    res.json({ message: "Absensi berhasil dihapus" });
  } catch (err) {
    console.error("❌ Error deleteAbsensi:", err);
    res.status(500).json({
      message: "Gagal menghapus absensi",
      error: err.message,
    });
  }
};

module.exports = {
  createAbsensi,
  getAbsensiHariIni,
  getAllAbsensi,
  getAbsensiSummary,
  deleteAbsensi,
};
