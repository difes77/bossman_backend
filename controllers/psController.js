const db = require("../config/db");
const psModel = require("../models/psModel");

// --- ✅ UNTUK FITUR MOBILE ---
const getHargaPerJam = async (req, res) => {
  const { id_ps } = req.params;

  try {
    const [[result]] = await db.execute(
      `SELECT jp.harga_per_jam 
       FROM PS p 
       JOIN Jenis_PS jp ON p.id_jenis_ps = jp.id_jenis_ps 
       WHERE p.id_ps = ?`,
      [id_ps]
    );

    if (!result) {
      return res.status(404).json({ message: "Harga tidak ditemukan" });
    }

    res.json({ harga_per_jam: result.harga_per_jam });
  } catch (err) {
    console.error("Gagal ambil harga:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- ✅ UNTUK ADMIN WEB ---
const getAllPS = async (req, res) => {
  try {
    const data = await psModel.getAllPS();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data PS" });
  }
};

const createPS = async (req, res) => {
  try {
    const {
      nomor_ps,
      id_jenis_ps,
      id_cabang,
      status_fisik = "available",
      game_ids = [],
    } = req.body;
    if (!nomor_ps || !id_jenis_ps || !id_cabang) {
      return res.status(400).json({ message: "Field wajib diisi semua" });
    }

    const result = await psModel.createPS({
      nomor_ps,
      id_jenis_ps,
      id_cabang,
      status_fisik,
      game_ids,
    });
    res
      .status(201)
      .json({ message: "PS berhasil ditambahkan", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambahkan PS" });
  }
};

const updatePS = async (req, res) => {
  const { id_ps } = req.params;
  const {
    nomor_ps,
    id_jenis_ps,
    id_cabang,
    status_fisik = "available",
    game_ids,
  } = req.body;

  if (!nomor_ps || !id_jenis_ps || !id_cabang) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    await conn.execute(
      `UPDATE PS SET nomor_ps = ?, id_jenis_ps = ?, id_cabang = ?, status_fisik = ? WHERE id_ps = ?`,
      [nomor_ps, id_jenis_ps, id_cabang, status_fisik, id_ps]
    );

    if (Array.isArray(game_ids)) {
      await conn.execute(`DELETE FROM PS_Game WHERE id_ps = ?`, [id_ps]);
      for (const id_game of game_ids) {
        await conn.execute(
          `INSERT INTO PS_Game (id_ps, id_game) VALUES (?, ?)`,
          [id_ps, id_game]
        );
      }
    }

    await conn.commit();
    res.json({ message: "PS berhasil diupdate" });
  } catch (err) {
    await conn.rollback();
    console.error("Gagal update PS:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};

const updateStatusPS = async (req, res) => {
  try {
    const { id_ps } = req.params;
    const { status_fisik } = req.body;

    const allowedStatuses = ["available", "maintenance"];
    if (!allowedStatuses.includes(status_fisik)) {
      return res.status(400).json({ message: "Status fisik tidak valid." });
    }

    await psModel.updateStatusPS(id_ps, status_fisik);
    res.json({ message: "Status PS berhasil diupdate" });
  } catch (err) {
    console.error("❌ Gagal update status PS:", err.message);
    res.status(500).json({ message: "Gagal update status PS" });
  }
};

const deletePS = async (req, res) => {
  try {
    const { id_ps } = req.params;
    await psModel.deletePS(id_ps);
    res.json({ message: "PS berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus PS" });
  }
};

const getGamesByPS = async (req, res) => {
  const { id_ps } = req.params;

  try {
    const [games] = await db.execute(
      `SELECT g.id_game, g.nama_game 
       FROM PS_Game pg 
       JOIN Game g ON pg.id_game = g.id_game 
       WHERE pg.id_ps = ?`,
      [id_ps]
    );

    res.json(games);
  } catch (err) {
    console.error("Gagal mengambil game PS:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateGamesOfPS = async (req, res) => {
  const { id_ps } = req.params;
  const { game_ids } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    await conn.execute(`DELETE FROM PS_Game WHERE id_ps = ?`, [id_ps]);
    for (const id_game of game_ids) {
      await conn.execute(`INSERT INTO PS_Game (id_ps, id_game) VALUES (?, ?)`, [
        id_ps,
        id_game,
      ]);
    }

    await conn.commit();
    res.json({ message: "Game untuk PS berhasil diupdate" });
  } catch (err) {
    await conn.rollback();
    console.error("Gagal update game PS:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};

const getAllJenisPS = async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM Jenis_PS");
    res.json(rows);
  } catch (err) {
    console.error("Gagal mengambil Jenis PS:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllGames = async (req, res) => {
  try {
    const [games] = await db.execute("SELECT id_game, nama_game FROM Game");
    res.json(games);
  } catch (err) {
    console.error("Gagal mengambil semua game:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  // fitur mobile
  getHargaPerJam,

  // fitur admin
  getAllPS,
  createPS,
  updateStatusPS,
  deletePS,
  getGamesByPS,
  updateGamesOfPS,
  getAllJenisPS,
  getAllGames,
  updatePS,
};
