const db = require("../config/db");

//CREATE RENTAL
exports.createRental = async (data) => {
  const {
    id_ps,
    id_karyawan,
    nama_penyewa,
    alamat_penyewa,
    no_telp_penyewa,
    foto_orang,
    foto_identitas_jaminan,
    total_harga_sewa,
    id_cabang,
    tanggal_kembali,
    status_sewa,
    paket_sewa,
    nominal_diskon,
    diskon_persen,
  } = data;

  const query = `
    INSERT INTO Sewa_Dibawa_Pulang
    (
      id_ps, id_karyawan, nama_penyewa, alamat_penyewa, no_telp_penyewa,
      foto_orang, foto_identitas_jaminan, total_harga_sewa, id_cabang,
      tanggal_kembali, status_sewa, paket_sewa, nominal_diskon, diskon_persen
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id_ps,
    id_karyawan,
    nama_penyewa,
    alamat_penyewa,
    no_telp_penyewa,
    foto_orang,
    foto_identitas_jaminan,
    total_harga_sewa,
    id_cabang,
    tanggal_kembali,
    status_sewa,
    paket_sewa || "12_jam",
    nominal_diskon || 0,
    diskon_persen || 0,
  ];

  const [result] = await db.execute(query, values);

  console.log(`✅ Rental created with ID: ${result.insertId}`);
  console.log(`   - Paket: ${paket_sewa || "12_jam"}`);
  console.log(`   - Diskon: ${diskon_persen || 0}%`);
  console.log(`   - Nominal Diskon: Rp ${nominal_diskon || 0}`);
  console.log(`   - Total: Rp ${total_harga_sewa}`);

  return result.insertId;
};

// ✅ UPDATE STATUS
exports.updateStatus = async (id, status) => {
  const query = `
    UPDATE Sewa_Dibawa_Pulang
    SET status_sewa = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id_sewa_bawa_pulang = ?
  `;
  const [result] = await db.execute(query, [status, id]);
  return result;
};

// ✅ GET ACTIVE RENTAL BY CONSOLE ID
exports.getActiveRentalByConsoleId = async (id_ps) => {
  const query = `
    SELECT * FROM Sewa_Dibawa_Pulang
    WHERE id_ps = ? AND status_sewa IN ('menunggu persetujuan admin', 'disetujui')
    ORDER BY created_at DESC LIMIT 1
  `;
  const [rows] = await db.execute(query, [id_ps]);
  return rows[0];
};

// ✅ GET RENTAL BY ID
exports.getRentalById = async (id) => {
  const query = `
    SELECT * FROM Sewa_Dibawa_Pulang
    WHERE id_sewa_bawa_pulang = ?
  `;
  const [rows] = await db.execute(query, [id]);
  return rows[0];
};

// ✅ GET RENTALS BY STATUS AND BRANCH
exports.getRentalsByStatusAndBranch = async (status, id_cabang) => {
  let query = `
    SELECT s.*, ps.nama_ps, k.nama_karyawan, c.nama_cabang
    FROM Sewa_Dibawa_Pulang s
    JOIN PS ps ON s.id_ps = ps.id_ps
    JOIN Karyawan k ON s.id_karyawan = k.id_karyawan
    JOIN Cabang c ON s.id_cabang = c.id_cabang
    WHERE s.status_sewa = ?
  `;
  const params = [status];

  if (id_cabang) {
    query += ` AND s.id_cabang = ?`;
    params.push(id_cabang);
  }

  query += ` ORDER BY s.created_at DESC`;

  const [rows] = await db.execute(query, params);
  return rows;
};

// ✅ GET SEWA BY ID (untuk completeSewa)
exports.getSewaById = async (id) => {
  const query = `
    SELECT * FROM Sewa_Dibawa_Pulang
    WHERE id_sewa_bawa_pulang = ?
  `;
  return await db.execute(query, [id]);
};

// ✅ COMPLETE SEWA
exports.completeSewa = async (
  id_sewa,
  jam_terlambat,
  denda_keterlambatan,
  total_akhir
) => {
  const query = `
    UPDATE Sewa_Dibawa_Pulang
    SET 
      status_sewa = 'dikembalikan',
      tanggal_pengembalian = NOW(),
      jam_terlambat = ?,
      denda_keterlambatan = ?,
      total_akhir = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id_sewa_bawa_pulang = ?
  `;
  return await db.execute(query, [
    jam_terlambat,
    denda_keterlambatan,
    total_akhir,
    id_sewa,
  ]);
};

// ✅ UPDATE FOTO BUKTI
exports.updateFotoBukti = async (id_sewa, foto_bukti_1, foto_bukti_2) => {
  const query = `
    UPDATE Sewa_Dibawa_Pulang
    SET 
      foto_bukti_pengembalian_1 = ?,
      foto_bukti_pengembalian_2 = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id_sewa_bawa_pulang = ?
  `;
  return await db.execute(query, [foto_bukti_1, foto_bukti_2, id_sewa]);
};

// ✅ GET APPROVED RENTALS BY BRANCH
exports.getApprovedRentalsByBranch = async (id_cabang) => {
  const query = `
    SELECT
      sbp.id_sewa_bawa_pulang,
      sbp.nama_penyewa,
      sbp.no_telp_penyewa,
      sbp.alamat_penyewa,
      sbp.tanggal_kembali,
      sbp.total_harga_sewa,
      sbp.paket_sewa,
      sbp.nominal_diskon,
      sbp.diskon_persen,
      sbp.created_at,
      sbp.id_ps,
      ps.nomor_ps,
      jp.nama_jenis,
      jp.harga_per_jam
    FROM Sewa_Dibawa_Pulang sbp
    JOIN PS ps ON sbp.id_ps = ps.id_ps
    JOIN Jenis_PS jp ON ps.id_jenis_ps = jp.id_jenis_ps
    WHERE sbp.id_cabang = ?
      AND sbp.status_sewa = 'disetujui'
    ORDER BY sbp.tanggal_kembali ASC
  `;
  return await db.execute(query, [id_cabang]);
};
