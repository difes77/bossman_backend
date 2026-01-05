const db = require("../config/db");

const createTransaksi = async ({ id_karyawan, id_cabang, total_harga }) => {
  const [result] = await db.execute(
    `INSERT INTO transaksi_makanan (id_karyawan, id_cabang, total_harga) VALUES (?, ?, ?)`,
    [id_karyawan, id_cabang, total_harga]
  );
  return result.insertId;
};

const createDetail = async (idTransaksi, items) => {
  for (const item of items) {
    const { id_makanan, jumlah, harga_satuan, subtotal } = item;
    await db.execute(
      `INSERT INTO detail_transaksi_makanan 
      (id_transaksi_makanan, id_makanan, jumlah, harga_satuan, subtotal)
      VALUES (?, ?, ?, ?, ?)`,
      [idTransaksi, id_makanan, jumlah, harga_satuan, subtotal]
    );
  }
};

const getAll = async ({ tanggal_awal, tanggal_akhir, id_cabang }) => {
  let query = `SELECT * FROM transaksi_makanan WHERE 1`;
  const params = [];

  if (tanggal_awal) {
    query += ` AND DATE(created_at) >= ?`;
    params.push(tanggal_awal);
  }
  if (tanggal_akhir) {
    query += ` AND DATE(created_at) <= ?`;
    params.push(tanggal_akhir);
  }
  if (id_cabang) {
    query += ` AND id_cabang = ?`;
    params.push(id_cabang);
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await db.execute(query, params);
  return rows;
};

const getDetail = async (idTransaksi) => {
  const [rows] = await db.execute(
    `SELECT dm.*, m.nama_makanan 
     FROM detail_transaksi_makanan dm
     JOIN makanan m ON dm.id_makanan = m.id_makanan
     WHERE dm.id_transaksi_makanan = ?`,
    [idTransaksi]
  );
  return rows;
};

const getByTanggal = async ({ tanggal, id_cabang }) => {
  const query = `
    SELECT 
      tm.id_transaksi_makanan,
      tm.created_at,
      tm.total_harga,
      k.nama_karyawan,
      m.nama_makanan,
      dm.jumlah,
      dm.harga_satuan,
      dm.subtotal
    FROM transaksi_makanan tm
    JOIN karyawan k ON tm.id_karyawan = k.id_karyawan
    JOIN detail_transaksi_makanan dm ON tm.id_transaksi_makanan = dm.id_transaksi_makanan
    JOIN makanan m ON dm.id_makanan = m.id_makanan
    WHERE DATE(tm.created_at) = ?
      AND tm.id_cabang = ?
    ORDER BY tm.created_at DESC
  `;

  const [rows] = await db.execute(query, [tanggal, id_cabang]);

  const grouped = {};
  for (const row of rows) {
    const id = row.id_transaksi_makanan;
    if (!grouped[id]) {
      grouped[id] = {
        id,
        waktu: row.created_at,
        total_harga: row.total_harga,
        nama_karyawan: row.nama_karyawan,
        items: [],
      };
    }

    grouped[id].items.push({
      nama_makanan: row.nama_makanan,
      jumlah: row.jumlah,
      harga_satuan: row.harga_satuan,
      subtotal: row.subtotal,
    });
  }

  return Object.values(grouped);
};

module.exports = {
  createTransaksi,
  createDetail,
  getAll,
  getDetail,
  getByTanggal,
};
