const db = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM game ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data game" });
  }
};

exports.create = async (req, res) => {
  const { nama_game, deskripsi } = req.body;
  if (!nama_game)
    return res.status(400).json({ message: "Nama game wajib diisi" });

  try {
    const [result] = await db.execute(
      `INSERT INTO game (nama_game, deskripsi) VALUES (?, ?)`,
      [nama_game, deskripsi]
    );
    res.status(201).json({ message: "Game ditambahkan", id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Gagal menambahkan game" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { nama_game, deskripsi } = req.body;

  try {
    await db.execute(
      `UPDATE game SET nama_game = ?, deskripsi = ? WHERE id_game = ?`,
      [nama_game, deskripsi, id]
    );
    res.json({ message: "Game diupdate" });
  } catch (err) {
    res.status(500).json({ message: "Gagal update game" });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute(`DELETE FROM game WHERE id_game = ?`, [id]);
    res.json({ message: "Game dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal hapus game" });
  }
};
