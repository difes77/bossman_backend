const db = require("../config/db");

const getConsoleById = (id_ps) => {
  const sql = `SELECT * FROM ps WHERE id_ps = ?`;
  return db.query(sql, [id_ps]);
};

const getActiveRentalByConsole = (id_ps) => {
  return db.query(
    `
    SELECT id_sewa_ditempat AS id_sewa,
           nama_penyewa,
           waktu_selesai_estimasi,
           NULL AS tanggal_kembali
    FROM sewa_ditempat
    WHERE id_ps = ? AND status_sewa = 'active'
    
    UNION

    SELECT id_sewa_bawa_pulang AS id_sewa,
           nama_penyewa,
           NULL AS waktu_selesai_estimasi,
           tanggal_kembali
    FROM sewa_dibawa_pulang
    WHERE id_ps = ? AND status_sewa = 'disetujui'
    LIMIT 1
    `,
    [id_ps, id_ps]
  );
};

const updateConsoleStatus = (id_ps, status_fisik) => {
  const sql = `UPDATE ps SET status_fisik = ? WHERE id_ps = ?`;
  return db.query(sql, [status_fisik, id_ps]);
};
const getConsolesByBranch = (id_cabang) => {
  const query = `
    SELECT 
      ps.id_ps,
      ps.nomor_ps AS label,
      ps.status_fisik,
      ps.id_cabang,
      jp.harga_per_jam,
      jp.nama_jenis,
      ps.id_jenis_ps
    FROM ps ps
    JOIN jenis_ps jp ON ps.id_jenis_ps = jp.id_jenis_ps
    WHERE ps.id_cabang = ?
    ORDER BY ps.id_ps ASC;
  `;
  return db.execute(query, [id_cabang]);
};

module.exports = {
  getConsoleById,
  getActiveRentalByConsole,
  updateConsoleStatus,
  getConsolesByBranch,
};
