const db = require("../config/db");

const getSewaHarian = async (req, res) => {
  const { tanggal, id_cabang } = req.query;

  if (!tanggal || !id_cabang) {
    return res
      .status(400)
      .json({ message: "Tanggal dan id_cabang wajib diisi" });
  }

  try {
    // Sewa Di Tempat
    const [ditempat] = await db.execute(
      `
      SELECT 
        sdt.id_sewa_ditempat AS id,
        sdt.waktu_mulai,
        sdt.durasi_menit,
        sdt.status_sewa,
        k.nama_karyawan,
        ps.nomor_ps,
        ROUND((sdt.durasi_menit / 60.0) * jp.harga_per_jam, 0) AS total_harga
      FROM sewa_ditempat sdt
      JOIN karyawan k ON sdt.id_karyawan = k.id_karyawan
      JOIN ps ps ON sdt.id_ps = ps.id_ps
      JOIN jenis_ps jp ON ps.id_jenis_ps = jp.id_jenis_ps
      WHERE DATE(sdt.waktu_mulai) = ?
        AND sdt.id_cabang = ?
      ORDER BY sdt.waktu_mulai DESC
    `,
      [tanggal, id_cabang]
    );

    // Sewa Dibawa Pulang
    const [dibawa] = await db.execute(
      `
      SELECT 
        sdp.id_sewa_bawa_pulang AS id,
        sdp.created_at,
        sdp.status_sewa,
        sdp.total_harga_sewa,
        sdp.nama_penyewa,
        k.nama_karyawan,
        ps.nomor_ps
      FROM sewa_dibawa_pulang sdp
      JOIN karyawan k ON sdp.id_karyawan = k.id_karyawan
      JOIN ps ps ON sdp.id_ps = ps.id_ps
      WHERE DATE(sdp.created_at) = ?
        AND sdp.id_cabang = ?
      ORDER BY sdp.created_at DESC
    `,
      [tanggal, id_cabang]
    );

    res.json({
      sewa_ditempat: ditempat,
      sewa_dibawa: dibawa,
    });
  } catch (err) {
    console.error("❌ Gagal ambil data sewa harian:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getSewaHarian };
