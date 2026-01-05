const model = require("../models/transaksiMakananModel");
const db = require("../config/db");

const create = async (req, res) => {
  const { id_karyawan, id_cabang, total_harga, items } = req.body;

  console.log("📥 New Transaksi Request:", req.body); // Debugging

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Insert Header
    // ⚠️ Pastikan nama tabel di database 'transaksi_makanan' (huruf kecil)
    const [resultHeader] = await conn.execute(
      `INSERT INTO transaksi_makanan (id_karyawan, id_cabang, total_harga)
       VALUES (?, ?, ?)`,
      [id_karyawan, id_cabang, total_harga]
    );

    const idTransaksi = resultHeader.insertId;
    console.log("✅ Header Created ID:", idTransaksi);

    // 2. Insert Detail
    for (const item of items) {
      // ⚠️ Cek validasi data item
      if (!item.id_makanan || !item.harga_satuan) {
         throw new Error(`Data item tidak lengkap: ${JSON.stringify(item)}`);
      }

      await conn.execute(
        `INSERT INTO detail_transaksi_makanan 
         (id_transaksi_makanan, id_makanan, jumlah, harga_satuan, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [
          idTransaksi,
          item.id_makanan,
          item.jumlah,
          item.harga_satuan,
          item.subtotal,
        ]
      );

      // ... (kode resep auto-deduct lanjut disini) ...
    }

    await conn.commit();
    res.status(201).json({
      message: "Transaksi berhasil",
      id: idTransaksi,
    });
  } catch (err) {
    await conn.rollback();
    
    // 🔥 PENTING: Log error ke terminal agar kelihatan di Railway Logs
    console.error("❌ ERROR TRANSAKSI MAKANAN:", err);
    
    res.status(500).json({ 
        message: "Server error", 
        error: err.message, // Kirim pesan error ke Flutter
        sqlMessage: err.sqlMessage // Kirim detail SQL jika ada
    });
  } finally {
    conn.release();
  }
};

const getAll = async (req, res) => {
  const { tanggal_awal, tanggal_akhir, id_cabang } = req.query;

  try {
    const data = await model.getAll({ tanggal_awal, tanggal_akhir, id_cabang });
    res.json(data);
  } catch (err) {
    console.error("Gagal mengambil transaksi:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const detail = await model.getDetail(id);
    res.json(detail);
  } catch (err) {
    console.error("Gagal ambil detail:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getByTanggal = async (req, res) => {
  let { tanggal, id_cabang } = req.query;

  if (!tanggal) {
    const now = new Date();
    tanggal = now.toISOString().split("T")[0]; // default ke hari ini
  }

  try {
    const data = await model.getByTanggal({ tanggal, id_cabang });
    res.json(data);
  } catch (err) {
    console.error("Gagal ambil transaksi berdasarkan tanggal:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  create,
  getAll,
  getDetail,
  getByTanggal,
};
