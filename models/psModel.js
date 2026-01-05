const db = require("../config/db");

// --- Jenis PS ---
exports.getAllJenisPS = async () => {
  const [rows] = await db.execute(`SELECT * FROM jenis_ps ORDER BY nama_jenis`);
  return rows;
};

exports.createJenisPS = async ({ nama_jenis, harga_per_jam }) => {
  const [result] = await db.execute(
    `INSERT INTO jenis_ps (nama_jenis, harga_per_jam) VALUES (?, ?)`,
    [nama_jenis, harga_per_jam]
  );
  return result;
};

// --- Game ---
exports.getAllGames = async () => {
  const [rows] = await db.execute(`SELECT * FROM game ORDER BY nama_game`);
  return rows;
};

exports.createGame = async ({ nama_game, deskripsi }) => {
  const [result] = await db.execute(
    `INSERT INTO game (nama_game, deskripsi) VALUES (?, ?)`,
    [nama_game, deskripsi]
  );
  return result;
};

// --- Unit PS ---
exports.getAllPS = async () => {
  const [rows] = await db.execute(`
    SELECT ps.*, j.nama_jenis, j.harga_per_jam, c.nama_cabang
    FROM ps ps
    JOIN jenis_ps j ON ps.id_jenis_ps = j.id_jenis_ps
    JOIN cabang c ON ps.id_cabang = c.id_cabang
    ORDER BY ps.created_at DESC
  `);
  return rows;
};

exports.createPS = async ({ nomor_ps, id_jenis_ps, id_cabang }) => {
  const [result] = await db.execute(
    `INSERT INTO ps (nomor_ps, id_jenis_ps, id_cabang) VALUES (?, ?, ?)`,
    [nomor_ps, id_jenis_ps, id_cabang]
  );
  return result;
};

exports.updateStatusPS = async (id_ps, status_fisik) => {
  await db.execute(`UPDATE ps SET status_fisik = ? WHERE id_ps = ?`, [
    status_fisik,
    id_ps,
  ]);
};

exports.deletePS = async (id_ps) => {
  await db.execute(`DELETE FROM ps WHERE id_ps = ?`, [id_ps]);
};
