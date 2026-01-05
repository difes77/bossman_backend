const db = require("../config/db");

exports.getAllUsers = async () => {
  const [rows] = await db.execute(`
    SELECT u.user_id, u.email, u.role, k.nama_karyawan
    FROM user u
    LEFT JOIN karyawan k ON u.id_karyawan = k.id_karyawan
  `);
  return rows;
};

exports.deleteUser = async (id) => {
  await db.execute(`DELETE FROM user WHERE user_id = ?`, [id]);
};

exports.updateUser = async (id, { email, password }) => {
  if (password) {
    await db.execute(
      `UPDATE user SET email = ?, password = ?, updated_at = NOW() WHERE user_id = ?`,
      [email, password, id]
    );
  } else {
    await db.execute(
      `UPDATE user SET email = ?, updated_at = NOW() WHERE user_id = ?`,
      [email, id]
    );
  }
};
