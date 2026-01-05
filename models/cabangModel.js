const db = require("../config/db");

// Get only active cabang
const getAll = async (includeInactive = false) => {
  let query = `SELECT * FROM cabang`;

  if (!includeInactive) {
    query += ` WHERE status = 'aktif'`;
  }

  query += ` ORDER BY created_at DESC`;

  const [rows] = await db.execute(query);
  return rows;
};

const create = async ({ nama_cabang, alamat }) => {
  const [result] = await db.execute(
    `INSERT INTO cabang (nama_cabang, alamat, status) VALUES (?, ?, 'aktif')`,
    [nama_cabang, alamat]
  );
  return result;
};

const update = async (id, { nama_cabang, alamat, status }) => {
  let query = "UPDATE cabang SET ";
  let params = [];
  let updates = [];

  if (nama_cabang !== undefined) {
    updates.push("nama_cabang = ?");
    params.push(nama_cabang);
  }
  if (alamat !== undefined) {
    updates.push("alamat = ?");
    params.push(alamat);
  }
  if (status !== undefined) {
    updates.push("status = ?");
    params.push(status);
  }

  if (updates.length === 0) {
    throw new Error("No fields to update");
  }

  query += updates.join(", ") + " WHERE id_cabang = ?";
  params.push(id);

  await db.execute(query, params);
};

// Soft delete - ubah status jadi nonaktif
const softDelete = async (id) => {
  await db.execute(
    `UPDATE cabang SET status = 'nonaktif' WHERE id_cabang = ?`,
    [id]
  );
};

// Hard delete - hanya untuk emergency (cek foreign key dulu)
const hardDelete = async (id) => {
  // Cek apakah ada relasi
  const [logOwner] = await db.execute(
    "SELECT COUNT(*) as count FROM log_owner WHERE id_cabang = ?",
    [id]
  );

  const [karyawan] = await db.execute(
    "SELECT COUNT(*) as count FROM karyawan WHERE id_cabang = ?",
    [id]
  );

  const [shiftConfig] = await db.execute(
    "SELECT COUNT(*) as count FROM shift_config WHERE id_cabang = ?",
    [id]
  );

  if (
    logOwner[0].count > 0 ||
    karyawan[0].count > 0 ||
    shiftConfig[0].count > 0
  ) {
    throw new Error(
      "Cabang masih memiliki data terkait (karyawan/shift/log). Gunakan soft delete."
    );
  }

  await db.execute(`DELETE FROM Cabang WHERE id_cabang = ?`, [id]);
};

module.exports = {
  getAll,
  create,
  update,
  softDelete,
  hardDelete,
};
