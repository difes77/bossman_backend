const db = require("../config/db");

const createSewaDitempat = async (data) => {
  const sql = `
    INSERT INTO Sewa_Ditempat 
    (id_ps, id_karyawan, nama_penyewa, waktu_mulai, durasi_menit, waktu_selesai_estimasi, total_harga, diskon_persen, nominal_diskon, total_biaya, id_cabang)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    data.id_ps,
    data.id_karyawan,
    data.nama_penyewa,
    data.waktu_mulai,
    data.durasi_menit,
    data.waktu_selesai_estimasi,
    data.total_harga,
    data.diskon_persen || 0,
    data.nominal_diskon || 0,
    data.total_biaya || 0,
    data.id_cabang,
  ];

  try {
    const [result] = await db.execute(sql, values);
    console.log("✅ Sewa ditempat berhasil dibuat:", result);
    return result;
  } catch (error) {
    console.error("❌ Gagal membuat sewa ditempat:", error);
    throw error;
  }
};

const completeSewaDitempat = async (id_sewa_ditempat) => {
  const sql = `
    UPDATE Sewa_Ditempat 
    SET status_sewa = 'completed',
        waktu_selesai_aktual = NOW()
    WHERE id_sewa_ditempat = ? AND status_sewa = 'active'
  `;

  try {
    const [result] = await db.execute(sql, [id_sewa_ditempat]);
    console.log("✅ Sewa ditempat berhasil diselesaikan:", result);
    return result;
  } catch (error) {
    console.error("❌ Gagal menyelesaikan sewa ditempat:", error);
    throw error;
  }
};

const getActiveSewaByPs = async (id_ps) => {
  const sql = `
    SELECT 
      id_sewa_ditempat, id_ps, id_karyawan, nama_penyewa,
      waktu_mulai, durasi_menit, waktu_selesai_estimasi, 
      total_harga, status_sewa, id_cabang
    FROM Sewa_Ditempat
    WHERE id_ps = ? AND status_sewa = 'active'
    LIMIT 1
  `;

  try {
    const [rows] = await db.execute(sql, [id_ps]);
    return rows[0] || null;
  } catch (error) {
    console.error("❌ Gagal mengambil sewa aktif:", error);
    throw error;
  }
};

module.exports = {
  createSewaDitempat,
  completeSewaDitempat,
  getActiveSewaByPs,
};
