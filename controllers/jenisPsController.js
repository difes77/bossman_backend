const db = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM jenis_ps ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data jenis PS" });
  }
};

exports.create = async (req, res) => {
  const { nama_jenis, harga_per_jam } = req.body;
  if (!nama_jenis || !harga_per_jam)
    return res.status(400).json({ message: "Lengkapi semua field" });

  try {
    const [result] = await db.execute(
      `INSERT INTO jenis_ps (nama_jenis, harga_per_jam) VALUES (?, ?)`,
      [nama_jenis, harga_per_jam]
    );
    res
      .status(201)
      .json({ message: "Jenis PS ditambahkan", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Gagal menambahkan jenis PS" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nama_jenis, harga_per_jam } = req.body;

  try {
    await db.execute(
      `UPDATE jenis_ps SET nama_jenis = ?, harga_per_jam = ? WHERE id_jenis_ps = ?`,
      [nama_jenis, harga_per_jam, id]
    );
    res.json({ message: "Jenis PS diupdate" });
  } catch (err) {
    res.status(500).json({ message: "Gagal update jenis PS" });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute(`DELETE FROM jenis_ps WHERE id_jenis_ps = ?`, [id]);
    res.json({ message: "Jenis PS dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal hapus jenis PS" });
  }
};
