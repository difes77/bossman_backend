const db = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT b.*, c.nama_cabang 
       FROM bahan_baku b
       LEFT JOIN cabang c ON b.id_cabang = c.id_cabang
       ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error getting bahan baku:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getByCabang = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM bahan_baku WHERE id_cabang = ? ORDER BY created_at DESC",
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil bahan baku per cabang" });
  }
};
exports.create = async (req, res) => {
  const { nama_bahan_baku, jumlah_stok, unit_satuan, id_cabang } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO bahan_baku (nama_bahan_baku, jumlah_stok, unit_satuan, id_cabang)
       VALUES (?, ?, ?, ?)`,
      [nama_bahan_baku, jumlah_stok, unit_satuan, id_cabang]
    );
    res
      .status(201)
      .json({ message: "Bahan baku ditambahkan", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Gagal menambahkan bahan baku" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nama_bahan_baku, jumlah_stok, unit_satuan, id_cabang } = req.body;
  try {
    await db.execute(
      `UPDATE bahan_baku SET nama_bahan_baku = ?, jumlah_stok = ?, unit_satuan = ?, id_cabang = ? WHERE id_bahan_baku = ?`,
      [nama_bahan_baku, jumlah_stok, unit_satuan, id_cabang, id]
    );
    res.json({ message: "Bahan baku diupdate" });
  } catch (err) {
    res.status(500).json({ message: "Gagal update bahan baku" });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute(`DELETE FROM Bahan_Baku WHERE id_bahan_baku = ?`, [id]);
    res.json({ message: "Bahan baku dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal hapus bahan baku" });
  }
};
