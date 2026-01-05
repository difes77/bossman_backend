const model = require("../models/transaksiMakananModel");
const db = require("../config/db");

const create = async (req, res) => {
  const { id_karyawan, id_cabang, total_harga, items } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Insert header transaksi
    const [resultHeader] = await conn.execute(
      `INSERT INTO Transaksi_Makanan (id_karyawan, id_cabang, total_harga)
       VALUES (?, ?, ?)`,
      [id_karyawan, id_cabang, total_harga]
    );

    const idTransaksi = resultHeader.insertId;

    // 2. Insert detail & auto-deduct stok
    for (const item of items) {
      await conn.execute(
        `INSERT INTO Detail_Transaksi_Makanan 
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

      // 🔥 AUTO-DEDUCT: Ambil resep
      const [resep] = await conn.execute(
        `SELECT r.id_bahan_baku, r.jumlah_dibutuhkan, b.nama_bahan_baku
         FROM Resep_Makanan r
         JOIN Bahan_Baku b ON r.id_bahan_baku = b.id_bahan_baku
         WHERE r.id_makanan = ? AND b.id_cabang = ?`,
        [item.id_makanan, id_cabang]
      );

      // Kurangi stok bahan baku
      for (const bahan of resep) {
        const jumlahDikurangi = bahan.jumlah_dibutuhkan * item.jumlah;

        await conn.execute(
          `UPDATE Bahan_Baku SET jumlah_stok = jumlah_stok - ?
           WHERE id_bahan_baku = ?`,
          [jumlahDikurangi, bahan.id_bahan_baku]
        );

        // Catat ke riwayat penggunaan
        await conn.execute(
          `INSERT INTO Penggunaan_Bahan_Baku 
           (id_karyawan, id_bahan_baku, jumlah_digunakan, keterangan, id_cabang)
           VALUES (?, ?, ?, ?, ?)`,
          [
            id_karyawan,
            bahan.id_bahan_baku,
            jumlahDikurangi,
            `Auto-deduct dari transaksi #${idTransaksi} - ${item.jumlah}x porsi`,
            id_cabang,
          ]
        );
      }
    }

    await conn.commit();
    res.status(201).json({
      message: "Transaksi berhasil dan stok bahan baku telah dikurangi",
      id: idTransaksi,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Server error", error: err.message });
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
