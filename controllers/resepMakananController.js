// controllers/resepMakananController.js
const db = require("../config/db");

/**
 * Get resep untuk makanan tertentu
 */
exports.getResepByMakanan = async (req, res) => {
  const { id } = req.params; // id_makanan

  try {
    // Get makanan dengan bahan_terkait
    const [makanan] = await db.query(
      `SELECT 
        m.id_makanan,
        m.nama_makanan,
        m.bahan_terkait,
        m.id_cabang,
        c.nama_cabang
      FROM makanan m
      JOIN cabang c ON m.id_cabang = c.id_cabang
      WHERE m.id_makanan = ?`,
      [id]
    );

    if (makanan.length === 0) {
      return res.status(404).json({
        error: "Makanan tidak ditemukan",
      });
    }

    let resep = [];

    // Parse bahan_terkait jika ada
    if (makanan[0].bahan_terkait) {
      try {
        const bahanTerkait =
          typeof makanan[0].bahan_terkait === "string"
            ? JSON.parse(makanan[0].bahan_terkait)
            : makanan[0].bahan_terkait;

        // Get detail bahan baku untuk setiap resep
        for (const bahan of bahanTerkait) {
          const [bahanDetail] = await db.query(
            `SELECT 
              id_bahan_baku,
              nama_bahan_baku,
              jumlah_stok,
              unit_satuan,
              jenis_bahan
            FROM bahan_baku
            WHERE id_bahan_baku = ?`,
            [bahan.id_bahan_baku]
          );

          if (bahanDetail.length > 0) {
            resep.push({
              id_bahan_baku: bahan.id_bahan_baku,
              nama_bahan_baku: bahanDetail[0].nama_bahan_baku,
              jumlah: parseFloat(bahan.jumlah),
              unit_satuan: bahanDetail[0].unit_satuan,
              jenis_bahan: bahanDetail[0].jenis_bahan,
              stok_tersedia: parseFloat(bahanDetail[0].jumlah_stok),
            });
          }
        }
      } catch (error) {
        console.error("Error parsing bahan_terkait:", error);
      }
    }

    res.json({
      id_makanan: makanan[0].id_makanan,
      nama_makanan: makanan[0].nama_makanan,
      id_cabang: makanan[0].id_cabang,
      nama_cabang: makanan[0].nama_cabang,
      resep: resep,
    });
  } catch (error) {
    console.error("Error getting resep:", error);
    res.status(500).json({
      error: "Gagal mengambil resep",
      details: error.message,
    });
  }
};

/**
 * Simpan/update resep untuk makanan
 */
exports.upsertResep = async (req, res) => {
  const { id } = req.params; // id_makanan
  const { resep } = req.body; // Array of {id_bahan_baku, jumlah}

  try {
    // Validasi input
    if (!resep || !Array.isArray(resep)) {
      return res.status(400).json({
        error: "Data resep tidak valid",
      });
    }

    // Validasi makanan exist
    const [makanan] = await db.query(
      "SELECT * FROM makanan WHERE id_makanan = ?",
      [id]
    );

    if (makanan.length === 0) {
      return res.status(404).json({
        error: "Makanan tidak ditemukan",
      });
    }

    const idCabang = makanan[0].id_cabang;

    // Validasi dan format resep
    const validResep = [];
    for (const item of resep) {
      // Skip jika tidak ada id_bahan_baku atau jumlah <= 0
      if (!item.id_bahan_baku || !item.jumlah || parseFloat(item.jumlah) <= 0) {
        continue;
      }

      // Validasi bahan baku exist dan dari cabang yang sama
      const [bahan] = await db.query(
        `SELECT * FROM bahan_baku 
         WHERE id_bahan_baku = ? AND id_cabang = ?`,
        [item.id_bahan_baku, idCabang]
      );

      if (bahan.length === 0) {
        return res.status(400).json({
          error: `Bahan baku ID ${item.id_bahan_baku} tidak ditemukan atau tidak dari cabang yang sama`,
        });
      }

      // Validasi jenis bahan harus "makanan"
      if (bahan[0].jenis_bahan !== "makanan") {
        return res.status(400).json({
          error: `Bahan "${bahan[0].nama_bahan_baku}" bukan jenis untuk makanan. Gunakan bahan dengan jenis "makanan".`,
        });
      }

      validResep.push({
        id_bahan_baku: parseInt(item.id_bahan_baku),
        jumlah: parseFloat(item.jumlah),
      });
    }

    // Simpan resep sebagai JSON di kolom bahan_terkait
    const bahanTerkaitJSON =
      validResep.length > 0 ? JSON.stringify(validResep) : null;

    await db.query(
      "UPDATE makanan SET bahan_terkait = ? WHERE id_makanan = ?",
      [bahanTerkaitJSON, id]
    );

    res.json({
      success: true,
      message: "Resep berhasil disimpan",
      resep: validResep,
    });
  } catch (error) {
    console.error("Error saving resep:", error);
    res.status(500).json({
      error: "Gagal menyimpan resep",
      details: error.message,
    });
  }
};

/**
 * Hapus satu item dari resep
 */
exports.deleteResepItem = async (req, res) => {
  const { id } = req.params; // id_makanan
  const { id_bahan_baku } = req.body;

  try {
    if (!id_bahan_baku) {
      return res.status(400).json({
        error: "id_bahan_baku required",
      });
    }

    // Get current resep
    const [makanan] = await db.query(
      "SELECT bahan_terkait FROM makanan WHERE id_makanan = ?",
      [id]
    );

    if (makanan.length === 0) {
      return res.status(404).json({
        error: "Makanan tidak ditemukan",
      });
    }

    if (!makanan[0].bahan_terkait) {
      return res.status(404).json({
        error: "Tidak ada resep untuk dihapus",
      });
    }

    // Parse dan filter
    let bahanTerkait =
      typeof makanan[0].bahan_terkait === "string"
        ? JSON.parse(makanan[0].bahan_terkait)
        : makanan[0].bahan_terkait;

    // Remove item dengan id_bahan_baku tertentu
    const filteredResep = bahanTerkait.filter(
      (item) => item.id_bahan_baku !== parseInt(id_bahan_baku)
    );

    // Update
    const newBahanTerkait =
      filteredResep.length > 0 ? JSON.stringify(filteredResep) : null;

    await db.query(
      "UPDATE makanan SET bahan_terkait = ? WHERE id_makanan = ?",
      [newBahanTerkait, id]
    );

    res.json({
      success: true,
      message: "Item resep berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting resep item:", error);
    res.status(500).json({
      error: "Gagal menghapus item resep",
      details: error.message,
    });
  }
};

/**
 * Cek apakah stok bahan baku cukup untuk membuat makanan
 */
exports.checkStokCukup = async (req, res) => {
  const { id } = req.params; // id_makanan
  const { jumlah_porsi = 1 } = req.query;

  try {
    // Get makanan dengan resep
    const [makanan] = await db.query(
      "SELECT * FROM makanan WHERE id_makanan = ?",
      [id]
    );

    if (makanan.length === 0) {
      return res.status(404).json({
        error: "Makanan tidak ditemukan",
      });
    }

    // Jika tidak ada resep, anggap selalu cukup
    if (!makanan[0].bahan_terkait) {
      return res.json({
        status: true,
        message: "Makanan tidak memerlukan bahan baku",
        details: [],
      });
    }

    // Parse resep
    const bahanTerkait =
      typeof makanan[0].bahan_terkait === "string"
        ? JSON.parse(makanan[0].bahan_terkait)
        : makanan[0].bahan_terkait;

    const details = [];
    let semuaCukup = true;

    // Cek setiap bahan
    for (const bahan of bahanTerkait) {
      const [stokBahan] = await db.query(
        "SELECT * FROM bahan_baku WHERE id_bahan_baku = ?",
        [bahan.id_bahan_baku]
      );

      if (stokBahan.length > 0) {
        const dibutuhkan = parseFloat(bahan.jumlah) * parseInt(jumlah_porsi);
        const tersedia = parseFloat(stokBahan[0].jumlah_stok);
        const cukup = tersedia >= dibutuhkan;

        if (!cukup) {
          semuaCukup = false;
        }

        details.push({
          nama_bahan: stokBahan[0].nama_bahan_baku,
          dibutuhkan: dibutuhkan,
          tersedia: tersedia,
          satuan: stokBahan[0].unit_satuan,
          cukup: cukup,
          kekurangan: cukup ? 0 : dibutuhkan - tersedia,
        });
      }
    }

    res.json({
      status: semuaCukup,
      message: semuaCukup
        ? "Semua bahan tersedia"
        : "Beberapa bahan tidak mencukupi",
      jumlah_porsi: parseInt(jumlah_porsi),
      details: details,
    });
  } catch (error) {
    console.error("Error checking stok:", error);
    res.status(500).json({
      error: "Gagal memeriksa stok",
      details: error.message,
    });
  }
};

/**
 * Get bahan baku yang tersedia untuk resep (jenis makanan)
 */
exports.getBahanForResep = async (req, res) => {
  const { id_cabang } = req.query;

  try {
    if (!id_cabang) {
      return res.status(400).json({
        error: "id_cabang required",
      });
    }

    // Get bahan baku dengan jenis "makanan" di cabang tertentu
    const [bahan] = await db.query(
      `SELECT 
        id_bahan_baku,
        nama_bahan_baku,
        jumlah_stok,
        unit_satuan,
        jenis_bahan
      FROM bahan_baku
      WHERE id_cabang = ? AND jenis_bahan = 'makanan'
      ORDER BY nama_bahan_baku`,
      [id_cabang]
    );

    res.json(bahan);
  } catch (error) {
    console.error("Error getting bahan for resep:", error);
    res.status(500).json({
      error: "Gagal mengambil bahan baku",
      details: error.message,
    });
  }
};

/**
 * Duplicate resep dari makanan lain
 */
exports.duplicateResep = async (req, res) => {
  const { id } = req.params; // id_makanan target
  const { source_id } = req.body; // id_makanan source

  try {
    if (!source_id) {
      return res.status(400).json({
        error: "source_id required",
      });
    }

    // Get resep dari makanan source
    const [sourceMakanan] = await db.query(
      "SELECT bahan_terkait, id_cabang FROM makanan WHERE id_makanan = ?",
      [source_id]
    );

    if (sourceMakanan.length === 0) {
      return res.status(404).json({
        error: "Makanan source tidak ditemukan",
      });
    }

    if (!sourceMakanan[0].bahan_terkait) {
      return res.status(400).json({
        error: "Makanan source tidak memiliki resep",
      });
    }

    // Get makanan target
    const [targetMakanan] = await db.query(
      "SELECT id_cabang FROM makanan WHERE id_makanan = ?",
      [id]
    );

    if (targetMakanan.length === 0) {
      return res.status(404).json({
        error: "Makanan target tidak ditemukan",
      });
    }

    // Validasi cabang harus sama
    if (sourceMakanan[0].id_cabang !== targetMakanan[0].id_cabang) {
      return res.status(400).json({
        error: "Makanan harus dari cabang yang sama",
      });
    }

    // Copy resep
    await db.query(
      "UPDATE makanan SET bahan_terkait = ? WHERE id_makanan = ?",
      [sourceMakanan[0].bahan_terkait, id]
    );

    res.json({
      success: true,
      message: "Resep berhasil diduplikasi",
    });
  } catch (error) {
    console.error("Error duplicating resep:", error);
    res.status(500).json({
      error: "Gagal menduplikasi resep",
      details: error.message,
    });
  }
};
