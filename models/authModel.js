const db = require("../config/db");

exports.findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    `
    SELECT 
      u.user_id, u.email, u.password, u.role,
      k.id_karyawan, k.nama_karyawan, k.id_cabang, k.no_wa,
      c.nama_cabang
    FROM User u
    JOIN Karyawan k ON u.id_karyawan = k.id_karyawan
    JOIN Cabang c ON k.id_cabang = c.id_cabang
    WHERE u.email = ?
  `,
    [email]
  );
  return rows[0];
};

exports.saveDeviceToken = async (user_id, token) => {
  await db.execute(
    `
    INSERT INTO DeviceToken (user_id, token)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE token = VALUES(token)
  `,
    [user_id, token]
  );
};

exports.findOwnerByEmail = async (email) => {
  const [rows] = await db.execute(
    `
    SELECT 
      user_id, email, password, role
    FROM User
    WHERE email = ? AND role = 'owner'
  `,
    [email]
  );
  return rows[0];
};

exports.createUser = async ({ email, password, role, id_karyawan }) => {
  await db.execute(
    `INSERT INTO User (email, password, role, id_karyawan)
     VALUES (?, ?, ?, ?)`,
    [email, password, role, id_karyawan]
  );
};

exports.findUserByKaryawanId = async (id_karyawan) => {
  const [rows] = await db.execute(`SELECT * FROM User WHERE id_karyawan = ?`, [
    id_karyawan,
  ]);
  return rows[0];
};
