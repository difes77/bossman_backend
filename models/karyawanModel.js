const db = require("../config/db");

const getAll = async () => {
  const [rows] = await db.execute(`
    SELECT k.*, c.nama_cabang 
    FROM karyawan k 
    JOIN cabang c ON k.id_cabang = c.id_cabang
    ORDER BY k.created_at DESC
  `);
  return rows;
};

const create = async ({
  nama_karyawan,
  no_wa,
  alamat,
  id_cabang,
  foto_ktp,
}) => {
  const [result] = await db.execute(
    `INSERT INTO karyawan (nama_karyawan, no_wa, alamat, foto_ktp, id_cabang) 
     VALUES (?, ?, ?, ?, ?)`,
    [nama_karyawan, no_wa, alamat, foto_ktp || null, id_cabang]
  );
  return result;
};

const update = async (
  id,
  { nama_karyawan, no_wa, alamat, id_cabang, foto_ktp }
) => {
  await db.execute(
    `UPDATE karyawan 
     SET nama_karyawan = ?, no_wa = ?, alamat = ?, id_cabang = ?, foto_ktp = ? 
     WHERE id_karyawan = ?`,
    [nama_karyawan, no_wa, alamat, id_cabang, foto_ktp || null, id]
  );
};

const deleteKaryawan = async (id) => {
  await db.execute(`DELETE FROM Karyawan WHERE id_karyawan = ?`, [id]);
};

module.exports = {
  getAll,
  create,
  update,
  delete: deleteKaryawan,
};
