const db = require("../config/db");

// Helper: Cek apakah waktu sekarang ada dalam shift tertentu
const isInShiftTime = (currentTime, shiftStart, shiftEnd) => {
  const [currentHour, currentMinute] = currentTime.split(":").map(Number);
  const [startHour, startMinute] = shiftStart.split(":").map(Number);
  const [endHour, endMinute] = shiftEnd.split(":").map(Number);

  const currentMinutes = currentHour * 60 + currentMinute;
  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;

  // Handle cross-midnight shift (misal: 22:00 - 06:00)
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Tambah 24 jam
    // Jika current time sebelum midnight, tambahkan 24 jam juga
    const adjustedCurrentMinutes =
      currentMinutes < startMinutes ? currentMinutes + 24 * 60 : currentMinutes;
    return (
      adjustedCurrentMinutes >= startMinutes &&
      adjustedCurrentMinutes < endMinutes
    );
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// Helper: Dapatkan tanggal shift (untuk cross-midnight)
const getShiftDate = (datetime, shiftStart) => {
  const date = new Date(datetime);
  const hours = date.getHours();
  const [startHour] = shiftStart.split(":").map(Number);

  // Jika waktu sekarang sebelum jam mulai shift, berarti masih shift kemarin
  if (hours < startHour) {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString().slice(0, 10);
};

// ==================== SHIFT CONFIG ====================

// Get semua shift config per cabang
const getShiftConfig = async (req, res) => {
  try {
    const { id_cabang } = req.params;

    const [shifts] = await db.execute(
      `SELECT * FROM shift_config 
       WHERE id_cabang = ? AND status = 'aktif'
       ORDER BY jam_mulai`,
      [id_cabang]
    );

    res.json(shifts);
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil konfigurasi shift",
      error: err.message,
    });
  }
};

// Create shift config baru
const createShiftConfig = async (req, res) => {
  try {
    const { id_cabang, nama_shift, jam_mulai, jam_selesai, durasi_jam } =
      req.body;

    if (
      !id_cabang ||
      !nama_shift ||
      !jam_mulai ||
      !jam_selesai ||
      !durasi_jam
    ) {
      return res.status(400).json({ message: "Field tidak boleh kosong" });
    }

    await db.execute(
      `INSERT INTO shift_config (id_cabang, nama_shift, jam_mulai, jam_selesai, durasi_jam) 
       VALUES (?, ?, ?, ?, ?)`,
      [id_cabang, nama_shift, jam_mulai, jam_selesai, durasi_jam]
    );

    res.status(201).json({ message: "Shift config berhasil dibuat" });
  } catch (err) {
    res.status(500).json({
      message: "Gagal membuat shift config",
      error: err.message,
    });
  }
};

// Update shift config
const updateShiftConfig = async (req, res) => {
  try {
    const { id_shift_config } = req.params;
    const { nama_shift, jam_mulai, jam_selesai, durasi_jam, status } = req.body;

    await db.execute(
      `UPDATE shift_config 
       SET nama_shift = ?, jam_mulai = ?, jam_selesai = ?, durasi_jam = ?, status = ?
       WHERE id_shift_config = ?`,
      [nama_shift, jam_mulai, jam_selesai, durasi_jam, status, id_shift_config]
    );

    res.json({ message: "Shift config berhasil diupdate" });
  } catch (err) {
    res.status(500).json({
      message: "Gagal update shift config",
      error: err.message,
    });
  }
};

// ==================== JADWAL SHIFT ====================

// Get jadwal shift karyawan (untuk mobile app)
const getJadwalKaryawan = async (req, res) => {
  try {
    const { id_karyawan } = req.params;
    const { tanggal_mulai, tanggal_selesai } = req.query;

    let query = `SELECT * FROM v_jadwal_shift_detail WHERE id_karyawan = ?`;
    let params = [id_karyawan];

    if (tanggal_mulai && tanggal_selesai) {
      query += ` AND tanggal BETWEEN ? AND ?`;
      params.push(tanggal_mulai, tanggal_selesai);
    }

    query += ` ORDER BY tanggal ASC`;

    const [jadwal] = await db.execute(query, params);
    res.json(jadwal);
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil jadwal karyawan",
      error: err.message,
    });
  }
};

// Get jadwal shift hari ini untuk karyawan tertentu
const getJadwalHariIni = async (req, res) => {
  try {
    const { id_karyawan } = req.params;

    const now = new Date();
    const jakartaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );
    const currentDate = jakartaTime.toISOString().slice(0, 10);
    const currentTime = jakartaTime.toTimeString().slice(0, 5); // HH:MM

    // Cari jadwal hari ini atau kemarin (untuk shift cross-midnight)
    const yesterday = new Date(jakartaTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().slice(0, 10);

    const [jadwal] = await db.execute(
      `SELECT * FROM v_jadwal_shift_detail 
       WHERE id_karyawan = ? 
       AND tanggal IN (?, ?)
       AND status_jadwal = 'terjadwal'`,
      [id_karyawan, currentDate, yesterdayDate]
    );

    // Filter jadwal yang sedang aktif berdasarkan waktu
    const activeShift = jadwal.find((j) => {
      const shiftStart = j.jam_mulai.slice(0, 5);
      const shiftEnd = j.jam_selesai.slice(0, 5);
      return isInShiftTime(currentTime, shiftStart, shiftEnd);
    });

    res.json(activeShift || null);
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil jadwal hari ini",
      error: err.message,
    });
  }
};

// Create jadwal shift (untuk admin)
const createJadwalShift = async (req, res) => {
  try {
    const { id_karyawan, id_shift_config, tanggal } = req.body;

    if (!id_karyawan || !id_shift_config || !tanggal) {
      return res.status(400).json({ message: "Field tidak boleh kosong" });
    }

    // Cek apakah karyawan sudah punya jadwal di tanggal tersebut
    const [existing] = await db.execute(
      `SELECT * FROM jadwal_shift WHERE id_karyawan = ? AND tanggal = ?`,
      [id_karyawan, tanggal]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Karyawan sudah memiliki jadwal shift di tanggal ini",
      });
    }

    await db.execute(
      `INSERT INTO jadwal_shift (id_karyawan, id_shift_config, tanggal) 
       VALUES (?, ?, ?)`,
      [id_karyawan, id_shift_config, tanggal]
    );

    res.status(201).json({ message: "Jadwal shift berhasil dibuat" });
  } catch (err) {
    res.status(500).json({
      message: "Gagal membuat jadwal shift",
      error: err.message,
    });
  }
};

// Bulk create jadwal shift (untuk scheduling mingguan/bulanan)
const createBulkJadwalShift = async (req, res) => {
  try {
    const { jadwal_list } = req.body; // Array of {id_karyawan, id_shift_config, tanggal}

    if (!jadwal_list || !Array.isArray(jadwal_list)) {
      return res.status(400).json({ message: "Format data tidak valid" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      for (const jadwal of jadwal_list) {
        const { id_karyawan, id_shift_config, tanggal } = jadwal;

        // Skip jika ada duplikat
        const [existing] = await connection.execute(
          `SELECT id_jadwal_shift FROM jadwal_shift 
           WHERE id_karyawan = ? AND tanggal = ?`,
          [id_karyawan, tanggal]
        );

        if (existing.length === 0) {
          await connection.execute(
            `INSERT INTO jadwal_shift (id_karyawan, id_shift_config, tanggal) 
             VALUES (?, ?, ?)`,
            [id_karyawan, id_shift_config, tanggal]
          );
        }
      }

      await connection.commit();
      res.status(201).json({ message: "Jadwal shift bulk berhasil dibuat" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    res.status(500).json({
      message: "Gagal membuat bulk jadwal shift",
      error: err.message,
    });
  }
};

// Update status jadwal shift
const updateJadwalShift = async (req, res) => {
  try {
    const { id_jadwal_shift } = req.params;
    const { status_jadwal, id_shift_config } = req.body;

    let query = "UPDATE jadwal_shift SET ";
    let params = [];

    if (status_jadwal) {
      query += "status_jadwal = ?";
      params.push(status_jadwal);
    }

    if (id_shift_config) {
      if (params.length > 0) query += ", ";
      query += "id_shift_config = ?";
      params.push(id_shift_config);
    }

    query += " WHERE id_jadwal_shift = ?";
    params.push(id_jadwal_shift);

    await db.execute(query, params);
    res.json({ message: "Jadwal shift berhasil diupdate" });
  } catch (err) {
    res.status(500).json({
      message: "Gagal update jadwal shift",
      error: err.message,
    });
  }
};

// Delete jadwal shift
const deleteJadwalShift = async (req, res) => {
  try {
    const { id_jadwal_shift } = req.params;

    await db.execute(`DELETE FROM jadwal_shift WHERE id_jadwal_shift = ?`, [
      id_jadwal_shift,
    ]);

    res.json({ message: "Jadwal shift berhasil dihapus" });
  } catch (err) {
    res.status(500).json({
      message: "Gagal menghapus jadwal shift",
      error: err.message,
    });
  }
};

module.exports = {
  // Shift Config
  getShiftConfig,
  createShiftConfig,
  updateShiftConfig,

  // Jadwal Shift
  getJadwalKaryawan,
  getJadwalHariIni,
  createJadwalShift,
  createBulkJadwalShift,
  updateJadwalShift,
  deleteJadwalShift,

  // Helper exports
  isInShiftTime,
  getShiftDate,
};
