const db = require("../config/db");

// ✅ GET ALL MAKANAN
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT m.*, c.nama_cabang 
       FROM Makanan m
       LEFT JOIN Cabang c ON m.id_cabang = c.id_cabang
       ORDER BY m.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error getting makanan:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET MENU (untuk POS)
exports.getMenu = async (req, res) => {
  const { id_cabang } = req.query;
  let query = `SELECT id_makanan, nama_makanan, harga_jual FROM Makanan WHERE 1=1`;
  const params = [];

  if (id_cabang) {
    query += ` AND id_cabang = ?`;
    params.push(id_cabang);
  }

  query += ` ORDER BY created_at DESC`;

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error getting menu:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET MAKANAN BY ID (include resep)
exports.getById = async (req, res) => {
  const { id } = req.params;

  try {
    // Get makanan
    const [makanan] = await db.execute(
      `SELECT m.*, c.nama_cabang 
       FROM Makanan m
       LEFT JOIN Cabang c ON m.id_cabang = c.id_cabang
       WHERE m.id_makanan = ?`,
      [id]
    );

    if (makanan.length === 0) {
      return res.status(404).json({ message: "Makanan tidak ditemukan" });
    }

    // Get resep
    const [resep] = await db.execute(
      `SELECT r.*, b.nama_bahan_baku, b.unit_satuan, b.jumlah_stok
       FROM Resep r
       JOIN Bahan_Baku b ON r.id_bahan_baku = b.id_bahan_baku
       WHERE r.id_makanan = ?`,
      [id]
    );

    res.json({
      ...makanan[0],
      resep: resep,
    });
  } catch (err) {
    console.error("❌ Error getting makanan detail:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET RESEP MAKANAN (untuk edit)
exports.getResep = async (req, res) => {
  const { id } = req.params;

  try {
    const [resep] = await db.execute(
      `SELECT r.*, b.nama_bahan_baku, b.unit_satuan, b.jumlah_stok
       FROM Resep r
       JOIN Bahan_Baku b ON r.id_bahan_baku = b.id_bahan_baku
       WHERE r.id_makanan = ?`,
      [id]
    );

    res.json(resep);
  } catch (err) {
    console.error("❌ Error getting resep:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ CREATE MAKANAN + RESEP
exports.create = async (req, res) => {
  const { nama_makanan, harga_jual, id_cabang, resep } = req.body;

  // Validasi input
  if (!nama_makanan || !harga_jual || !id_cabang) {
    return res.status(400).json({
      message: "nama_makanan, harga_jual, dan id_cabang harus diisi",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert Makanan (tanpa jumlah_stok, akan di-calculate)
    const [result] = await connection.execute(
      `INSERT INTO Makanan (nama_makanan, harga_jual, jumlah_stok, id_cabang) 
       VALUES (?, ?, 0, ?)`,
      [nama_makanan, harga_jual, id_cabang]
    );

    const idMakanan = result.insertId;

    // 2. Insert Resep (jika ada)
    if (resep && Array.isArray(resep) && resep.length > 0) {
      for (const item of resep) {
        const { id_bahan_baku, jumlah_dibutuhkan } = item;

        if (!id_bahan_baku || !jumlah_dibutuhkan) {
          throw new Error("Resep tidak lengkap");
        }

        await connection.execute(
          `INSERT INTO Resep_makanan (id_makanan, id_bahan_baku, jumlah_dibutuhkan)
           VALUES (?, ?, ?)`,
          [idMakanan, id_bahan_baku, jumlah_dibutuhkan]
        );
      }

      // 3. Calculate & Update Stok Makanan
      await updateStokMakanan(connection, idMakanan);
    }

    await connection.commit();

    res.status(201).json({
      message: "Makanan berhasil ditambahkan",
      id: idMakanan,
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error create makanan:", err);
    res.status(500).json({
      message: "Gagal menambahkan makanan",
      error: err.message,
    });
  } finally {
    connection.release();
  }
};

// ✅ UPDATE MAKANAN + RESEP
exports.update = async (req, res) => {
  const { id } = req.params;
  const { nama_makanan, harga_jual, id_cabang, resep } = req.body;

  // Validasi input
  if (!nama_makanan || !harga_jual || !id_cabang) {
    return res.status(400).json({
      message: "nama_makanan, harga_jual, dan id_cabang harus diisi",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Update Makanan
    await connection.execute(
      `UPDATE Makanan 
       SET nama_makanan = ?, harga_jual = ?, id_cabang = ?
       WHERE id_makanan = ?`,
      [nama_makanan, harga_jual, id_cabang, id]
    );

    // 2. Delete existing resep
    await connection.execute(`DELETE FROM Resep WHERE id_makanan = ?`, [id]);

    // 3. Insert new resep
    if (resep && Array.isArray(resep) && resep.length > 0) {
      for (const item of resep) {
        const { id_bahan_baku, jumlah_dibutuhkan } = item;

        if (!id_bahan_baku || !jumlah_dibutuhkan) {
          throw new Error("Resep tidak lengkap");
        }

        await connection.execute(
          `INSERT INTO Resep (id_makanan, id_bahan_baku, jumlah_dibutuhkan)
           VALUES (?, ?, ?)`,
          [id, id_bahan_baku, jumlah_dibutuhkan]
        );
      }

      // 4. Recalculate stok
      await updateStokMakanan(connection, id);
    } else {
      // Jika tidak ada resep, set stok = 0
      await connection.execute(
        `UPDATE Makanan SET jumlah_stok = 0 WHERE id_makanan = ?`,
        [id]
      );
    }

    await connection.commit();

    res.json({ message: "Makanan berhasil diupdate" });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error update makanan:", err);
    res.status(500).json({
      message: "Gagal mengupdate makanan",
      error: err.message,
    });
  } finally {
    connection.release();
  }
};

// ✅ DELETE MAKANAN (CASCADE delete resep)
exports.remove = async (req, res) => {
  const { id } = req.params;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Delete resep first (jika tidak pakai ON DELETE CASCADE)
    await connection.execute(`DELETE FROM Resep_Makanan WHERE id_makanan = ?`, [
      id,
    ]);

    // 2. Delete makanan
    await connection.execute(`DELETE FROM Makanan WHERE id_makanan = ?`, [id]);

    await connection.commit();

    res.json({ message: "Makanan berhasil dihapus" });
  } catch (err) {
    await connection.rollback();
    console.error("❌ Error delete makanan:", err);
    res.status(500).json({ message: "Gagal menghapus makanan" });
  } finally {
    connection.release();
  }
};

// ============================================
// HELPER FUNCTION: UPDATE STOK MAKANAN
// ============================================
async function updateStokMakanan(connection, idMakanan) {
  try {
    // Get all resep for this makanan
    const [resep] = await connection.execute(
      `SELECT r.id_bahan_baku, r.jumlah_dibutuhkan, b.jumlah_stok
       FROM Resep_makanan r
       JOIN Bahan_Baku b ON r.id_bahan_baku = b.id_bahan_baku
       WHERE r.id_makanan = ?`,
      [idMakanan]
    );

    if (resep.length === 0) {
      // Tidak ada resep, set stok = 0
      await connection.execute(
        `UPDATE Makanan SET jumlah_stok = 0 WHERE id_makanan = ?`,
        [idMakanan]
      );
      return;
    }

    // Calculate minimum possible stock
    let minStok = Infinity;

    for (const item of resep) {
      const stokBahan = parseFloat(item.jumlah_stok);
      const butuh = parseFloat(item.jumlah_dibutuhkan);

      if (butuh <= 0) continue;

      const maxBisa = Math.floor(stokBahan / butuh);
      minStok = Math.min(minStok, maxBisa);
    }

    // Update stok makanan
    const finalStok = minStok === Infinity ? 0 : minStok;
    await connection.execute(
      `UPDATE Makanan SET jumlah_stok = ? WHERE id_makanan = ?`,
      [finalStok, idMakanan]
    );

    console.log(`✅ Stok makanan ID ${idMakanan} updated to ${finalStok}`);
  } catch (err) {
    console.error("❌ Error updating stok makanan:", err);
    throw err;
  }
}

// ============================================
// TRANSAKSI MAKANAN
// ============================================

// ✅ GET TRANSAKSI dengan filter
exports.getTransaksiMakanan = async (req, res) => {
  const { id_cabang, tanggal_awal, tanggal_akhir } = req.query;
  let query = `
    SELECT tm.*, c.nama_cabang 
    FROM Transaksi_Makanan tm
    LEFT JOIN Cabang c ON tm.id_cabang = c.id_cabang
    WHERE 1=1
  `;
  const params = [];

  if (id_cabang) {
    query += ` AND tm.id_cabang = ?`;
    params.push(id_cabang);
  }

  if (tanggal_awal && tanggal_akhir) {
    query += ` AND DATE(tm.created_at) BETWEEN ? AND ?`;
    params.push(tanggal_awal, tanggal_akhir);
  }

  query += ` ORDER BY tm.created_at DESC`;

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error getting transaksi:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET DETAIL TRANSAKSI
exports.getDetailTransaksi = async (req, res) => {
  const { id } = req.params;

  try {
    const [details] = await db.execute(
      `SELECT dtm.*, m.nama_makanan
       FROM Detail_Transaksi_Makanan dtm
       JOIN Makanan m ON dtm.id_makanan = m.id_makanan
       WHERE dtm.id_transaksi_makanan = ?`,
      [id]
    );

    res.json(details);
  } catch (err) {
    console.error("❌ Error getting detail transaksi:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ EXPORT HELPER (untuk dipanggil dari transaksi)
exports.updateStokMakananHelper = async (idMakanan) => {
  const connection = await db.getConnection();
  try {
    await updateStokMakanan(connection, idMakanan);
  } finally {
    connection.release();
  }
};
