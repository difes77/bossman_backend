const db = require("../config/db");
const PDFDocument = require("pdfkit");

// 📊 Summary harian dashboard - FIXED VERSION
const getSummary = async (req, res) => {
  try {
    let { tanggal, id_cabang, id_karyawan } = req.query;

    if (!tanggal) {
      const today = new Date();
      tanggal = today.toISOString().slice(0, 10);
    }

    const params = [tanggal];
    let whereCabang = "";
    if (id_cabang) {
      whereCabang += " AND id_cabang = ?";
      params.push(id_cabang);
    }

    if (id_karyawan) {
      whereCabang += " AND id_karyawan = ?";
      params.push(id_karyawan);
    }

    // Query 1: Sewa Ditempat (tidak berubah)
    const [sewaDitempat] = await db.execute(
      `SELECT 
        COUNT(*) AS jumlah,
        SUM(durasi_menit) AS total_durasi,
        SUM(CASE WHEN status_sewa = 'completed' THEN total_harga ELSE 0 END) AS pendapatan
       FROM Sewa_Ditempat
       WHERE DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) = ? ${whereCabang}`,
      params
    );

    // Query 2: Sewa Bawa Pulang - JUMLAH (disetujui hari ini)
    const [sewaBawaPulangDisetujui] = await db.execute(
      `SELECT COUNT(*) AS jumlah
       FROM Sewa_Dibawa_Pulang
       WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) = ? 
       AND status_sewa = 'disetujui' ${whereCabang}`,
      params
    );

    // Query 3: Sewa Bawa Pulang - JUMLAH (dikembalikan hari ini)
    const [sewaBawaPulangDikembalikan] = await db.execute(
      `SELECT COUNT(*) AS jumlah
       FROM Sewa_Dibawa_Pulang
       WHERE DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) = ? 
       AND status_sewa = 'dikembalikan' ${whereCabang}`,
      params
    );

    // Query 4: Pendapatan Sewa Bawa Pulang (hanya dari yang dikembalikan, gunakan total_akhir)
    const [pendapatanSewaBawaPulang] = await db.execute(
      `SELECT IFNULL(SUM(total_akhir), 0) AS pendapatan
       FROM Sewa_Dibawa_Pulang
       WHERE DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) = ? 
       AND status_sewa = 'dikembalikan' ${whereCabang}`,
      params
    );

    // Query 5: Transaksi Makanan (tidak berubah)
    const [transMakanan] = await db.execute(
      `SELECT COUNT(*) AS jumlah, SUM(total_harga) AS pendapatan
       FROM Transaksi_Makanan
       WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) = ? ${whereCabang}`,
      params
    );

    // Query 6: Permintaan Sewa (tidak berubah)
    const [permintaanSewa] = await db.execute(
      `SELECT COUNT(*) AS jumlah
       FROM Sewa_Dibawa_Pulang
       WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) = ? 
       AND status_sewa = 'menunggu persetujuan admin' ${whereCabang}`,
      params
    );

    // Query 7: Penolakan Sewa (tidak berubah)
    const [penolakanSewa] = await db.execute(
      `SELECT COUNT(*) AS jumlah
       FROM Sewa_Dibawa_Pulang
       WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) = ? 
       AND status_sewa = 'ditolak' ${whereCabang}`,
      params
    );

    // Hitung total
    const jumlahSewaDitempat = Number(sewaDitempat[0].jumlah) || 0;

    // ✅ JUMLAH SEWA BAWA PULANG = disetujui + dikembalikan
    const jumlahSewaBawaPulang =
      Number(sewaBawaPulangDisetujui[0].jumlah) +
        Number(sewaBawaPulangDikembalikan[0].jumlah) || 0;

    const totalDurasi = Number(sewaDitempat[0].total_durasi) || 0;
    const pendapatanSewa = Number(sewaDitempat[0].pendapatan) || 0;
    const jumlahTransMakanan = Number(transMakanan[0].jumlah) || 0;
    const pendapatanMakanan = Number(transMakanan[0].pendapatan) || 0;
    const jumlahPermintaanSewa = Number(permintaanSewa[0].jumlah) || 0;
    const jumlahPenolakanSewa = Number(penolakanSewa[0].jumlah) || 0;

    // ✅ PENGEMBALIAN = hanya yang dikembalikan
    const jumlahPengembalianSewa =
      Number(sewaBawaPulangDikembalikan[0].jumlah) || 0;

    // ✅ PENDAPATAN = hanya dari yang dikembalikan (gunakan total_akhir)
    const pendapatanSewaBawaPulang_ =
      Number(pendapatanSewaBawaPulang[0].pendapatan) || 0;

    res.json({
      jumlah_sewa_ditempat: jumlahSewaDitempat,
      jumlah_sewa_bawa_pulang: jumlahSewaBawaPulang,
      total_jam_sewa: Math.floor(totalDurasi / 60),
      pendapatan_sewa_ditempat: pendapatanSewa,
      pendapatan_sewa_bawa_pulang: pendapatanSewaBawaPulang_,
      jumlah_transaksi_makanan: jumlahTransMakanan,
      pendapatan_makanan: pendapatanMakanan,
      total_pendapatan:
        pendapatanSewa + pendapatanMakanan + pendapatanSewaBawaPulang_,
      jumlah_permintaan_sewa: jumlahPermintaanSewa,
      jumlah_penolakan_sewa: jumlahPenolakanSewa,
      jumlah_pengembalian_sewa: jumlahPengembalianSewa,
    });
  } catch (err) {
    console.error("🔥 Error getSummary:", err);
    res.status(500).json({ message: "Gagal mengambil data dashboard" });
  }
};

// 📈 Grafik pendapatan berdasarkan RANGE TANGGAL - FIXED
const getPendapatanByDateRange = async (req, res) => {
  try {
    const { id_cabang, tanggal_awal, tanggal_akhir } = req.query;

    if (!tanggal_awal || !tanggal_akhir) {
      return res.status(400).json({
        message: "Parameter tanggal_awal dan tanggal_akhir wajib diisi",
      });
    }

    const params = [tanggal_awal, tanggal_akhir];
    let whereCabang = "";

    if (id_cabang) {
      whereCabang = " AND id_cabang = ?";
      params.push(id_cabang);
    }

    // Query gabungan untuk semua pendapatan - DIPERBAIKI
    const [rows] = await db.execute(
      `SELECT 
        tanggal,
        SUM(sewa_ditempat) as sewa,
        SUM(sewa_bawa_pulang) as sewa_pulang,
        SUM(makanan) as makanan,
        SUM(sewa_ditempat + sewa_bawa_pulang + makanan) as total
      FROM (
        -- Sewa Ditempat
        SELECT 
          DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) AS tanggal,
          SUM(CASE WHEN status_sewa = 'completed' THEN total_harga ELSE 0 END) AS sewa_ditempat,
          0 AS sewa_bawa_pulang,
          0 AS makanan
        FROM Sewa_Ditempat
        WHERE DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) BETWEEN ? AND ? ${whereCabang}
        GROUP BY DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00'))
        
        UNION ALL
        
        -- Sewa Bawa Pulang (hanya yang dikembalikan, gunakan total_akhir)
        SELECT 
          DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) AS tanggal,
          0 AS sewa_ditempat,
          SUM(total_akhir) AS sewa_bawa_pulang,
          0 AS makanan
        FROM Sewa_Dibawa_Pulang
        WHERE DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) BETWEEN ? AND ? 
          AND status_sewa = 'dikembalikan' ${whereCabang}
        GROUP BY DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00'))
        
        UNION ALL
        
        -- Transaksi Makanan
        SELECT 
          DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) AS tanggal,
          0 AS sewa_ditempat,
          0 AS sewa_bawa_pulang,
          SUM(total_harga) AS makanan
        FROM Transaksi_Makanan
        WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ? ${whereCabang}
        GROUP BY DATE(CONVERT_TZ(created_at, '+00:00', '+07:00'))
      ) AS combined
      GROUP BY tanggal
      ORDER BY tanggal`,
      id_cabang
        ? [
            tanggal_awal,
            tanggal_akhir,
            id_cabang,
            tanggal_awal,
            tanggal_akhir,
            id_cabang,
            tanggal_awal,
            tanggal_akhir,
            id_cabang,
          ]
        : [
            tanggal_awal,
            tanggal_akhir,
            tanggal_awal,
            tanggal_akhir,
            tanggal_awal,
            tanggal_akhir,
          ]
    );

    const result = rows.map((row) => ({
      label: row.tanggal.toISOString().split("T")[0],
      value: Number(row.total) || 0,
    }));

    res.json(result);
  } catch (err) {
    console.error("🔥 Error getPendapatanByDateRange:", err);
    res.status(500).json({
      message: "Gagal mengambil grafik pendapatan berdasarkan range tanggal",
    });
  }
};

// 📈 Grafik pendapatan harian (7 hari terakhir) - FIXED
const getPendapatanHarian = async (req, res) => {
  try {
    const { id_cabang } = req.query;

    const params = id_cabang ? [id_cabang, id_cabang, id_cabang] : [];

    const [rows] = await db.execute(
      `SELECT 
        tanggal,
        SUM(sewa_ditempat) as sewa,
        SUM(sewa_bawa_pulang) as sewa_pulang,
        SUM(makanan) as makanan
      FROM (
        SELECT 
          DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) AS tanggal,
          SUM(CASE WHEN status_sewa = 'completed' THEN total_harga ELSE 0 END) AS sewa_ditempat,
          0 AS sewa_bawa_pulang,
          0 AS makanan
        FROM Sewa_Ditempat
        WHERE DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) >= CURDATE() - INTERVAL 6 DAY
          ${id_cabang ? "AND id_cabang = ?" : ""}
        GROUP BY DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00'))
        
        UNION ALL
        
        SELECT 
          DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) AS tanggal,
          0 AS sewa_ditempat,
          SUM(total_akhir) AS sewa_bawa_pulang,
          0 AS makanan
        FROM Sewa_Dibawa_Pulang
        WHERE DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) >= CURDATE() - INTERVAL 6 DAY
          AND status_sewa = 'dikembalikan'
          ${id_cabang ? "AND id_cabang = ?" : ""}
        GROUP BY DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00'))
        
        UNION ALL
        
        SELECT 
          DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) AS tanggal,
          0 AS sewa_ditempat,
          0 AS sewa_bawa_pulang,
          SUM(total_harga) AS makanan
        FROM Transaksi_Makanan
        WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) >= CURDATE() - INTERVAL 6 DAY
          ${id_cabang ? "AND id_cabang = ?" : ""}
        GROUP BY DATE(CONVERT_TZ(created_at, '+00:00', '+07:00'))
      ) AS combined
      GROUP BY tanggal
      ORDER BY tanggal`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 Error getPendapatanHarian:", err);
    res
      .status(500)
      .json({ message: "Gagal mengambil grafik pendapatan harian" });
  }
};

// 📅 Grafik pendapatan mingguan - FIXED
const getPendapatanMingguan = async (req, res) => {
  const { id_cabang, tahun } = req.query;

  try {
    const where = [];
    const params = [];

    if (tahun) {
      where.push("YEAR(created_at) = ?");
      params.push(tahun);
    }

    if (id_cabang) {
      where.push("id_cabang = ?");
      params.push(id_cabang);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(DATE_SUB(created_at, INTERVAL (WEEKDAY(created_at)) DAY), '%Y-W%u') AS minggu,
        SUM(CASE WHEN sumber = 'sewa' THEN total ELSE 0 END) AS sewa,
        SUM(CASE WHEN sumber = 'sewa_pulang' THEN total ELSE 0 END) AS sewa_pulang,
        SUM(CASE WHEN sumber = 'makanan' THEN total ELSE 0 END) AS makanan
      FROM (
        SELECT total_harga AS total, 'sewa' AS sumber, waktu_mulai as created_at, id_cabang
        FROM Sewa_Ditempat WHERE status_sewa = 'completed'

        UNION ALL

        SELECT total_akhir AS total, 'sewa_pulang' AS sumber, tanggal_pengembalian as created_at, id_cabang
        FROM Sewa_Dibawa_Pulang WHERE status_sewa = 'dikembalikan'

        UNION ALL

        SELECT total_harga AS total, 'makanan' AS sumber, created_at, id_cabang
        FROM Transaksi_Makanan
      ) AS combined
      ${whereClause}
      GROUP BY minggu
      ORDER BY minggu DESC
      LIMIT 8`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 Error getPendapatanMingguan:", err);
    res.status(500).json({ message: "Gagal ambil data pendapatan mingguan" });
  }
};

// 📆 Grafik pendapatan bulanan - FIXED
const getPendapatanBulanan = async (req, res) => {
  const { id_cabang, tahun } = req.query;

  try {
    const where = [];
    const params = [];

    if (tahun) {
      where.push("YEAR(created_at) = ?");
      params.push(tahun);
    }

    if (id_cabang) {
      where.push("id_cabang = ?");
      params.push(id_cabang);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS bulan,
        SUM(CASE WHEN sumber = 'sewa' THEN total ELSE 0 END) AS sewa,
        SUM(CASE WHEN sumber = 'sewa_pulang' THEN total ELSE 0 END) AS sewa_pulang,
        SUM(CASE WHEN sumber = 'makanan' THEN total ELSE 0 END) AS makanan
      FROM (
        SELECT total_harga AS total, 'sewa' AS sumber, waktu_mulai as created_at, id_cabang
        FROM Sewa_Ditempat WHERE status_sewa = 'completed'

        UNION ALL

        SELECT total_akhir AS total, 'sewa_pulang' AS sumber, tanggal_pengembalian as created_at, id_cabang
        FROM Sewa_Dibawa_Pulang WHERE status_sewa = 'dikembalikan'

        UNION ALL

        SELECT total_harga AS total, 'makanan' AS sumber, created_at, id_cabang
        FROM Transaksi_Makanan
      ) AS combined
      ${whereClause}
      GROUP BY bulan
      ORDER BY bulan DESC
      LIMIT 12`,
      params
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 Error getPendapatanBulanan:", err);
    res.status(500).json({ message: "Gagal ambil data pendapatan bulanan" });
  }
};

// 📆 Grafik pendapatan tahunan - FIXED
const getPendapatanTahunan = async (req, res) => {
  const { id_cabang } = req.query;

  try {
    const [rows] = await db.query(
      `SELECT 
        YEAR(created_at) AS tahun,
        SUM(CASE WHEN sumber = 'sewa' THEN total ELSE 0 END) AS sewa,
        SUM(CASE WHEN sumber = 'sewa_pulang' THEN total ELSE 0 END) AS sewa_pulang,
        SUM(CASE WHEN sumber = 'makanan' THEN total ELSE 0 END) AS makanan
      FROM (
        SELECT total_harga AS total, 'sewa' AS sumber, waktu_mulai as created_at
        FROM Sewa_Ditempat
        WHERE status_sewa = 'completed' ${id_cabang ? "AND id_cabang = ?" : ""}

        UNION ALL

        SELECT total_akhir AS total, 'sewa_pulang' AS sumber, tanggal_pengembalian as created_at
        FROM Sewa_Dibawa_Pulang
        WHERE status_sewa = 'dikembalikan' ${
          id_cabang ? "AND id_cabang = ?" : ""
        }

        UNION ALL

        SELECT total_harga AS total, 'makanan' AS sumber, created_at
        FROM Transaksi_Makanan
        ${id_cabang ? "WHERE id_cabang = ?" : ""}
      ) AS combined
      GROUP BY tahun
      ORDER BY tahun DESC`,
      id_cabang ? [id_cabang, id_cabang, id_cabang] : []
    );

    res.json(rows);
  } catch (err) {
    console.error("🔥 Error getPendapatanTahunan:", err);
    res
      .status(500)
      .json({ message: "Gagal mengambil data pendapatan tahunan" });
  }
};

// 📄 Export PDF dengan RANGE TANGGAL - FIXED
const exportPDF = async (req, res) => {
  console.log("📄 Export PDF Request:", req.query);

  const { tanggal_awal, tanggal_akhir, id_cabang } = req.query;

  if (!tanggal_awal || !tanggal_akhir || !id_cabang) {
    console.error("❌ Missing parameters:", {
      tanggal_awal,
      tanggal_akhir,
      id_cabang,
    });
    return res.status(400).json({
      message:
        "Parameter tanggal_awal, tanggal_akhir, dan id_cabang wajib diisi",
    });
  }

  try {
    console.log("🔍 Fetching cabang info...");

    const [cabangResult] = await db.execute(
      `SELECT nama_cabang, alamat FROM Cabang WHERE id_cabang = ?`,
      [id_cabang]
    );

    if (cabangResult.length === 0) {
      return res.status(404).json({ message: "Cabang tidak ditemukan" });
    }

    const cabang = cabangResult[0];
    console.log("✅ Cabang info:", cabang.nama_cabang);

    console.log("🔍 Fetching summary data...");

    // Query 1: Ringkasan TOTAL - FIXED
    const [summaryResult] = await db.execute(
      `SELECT
        (SELECT COUNT(*) FROM Sewa_Ditempat 
         WHERE DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ?) AS jumlahSewaDitempat,
        
        (SELECT COUNT(*) FROM Sewa_Dibawa_Pulang 
         WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'disetujui') AS jumlahSewaBawaPulangDisetujui,
        
        (SELECT COUNT(*) FROM Sewa_Dibawa_Pulang 
         WHERE DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'dikembalikan') AS jumlahSewaBawaPulangDikembalikan,
        
        (SELECT COUNT(*) FROM Transaksi_Makanan 
         WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ?) AS jumlahTransaksiMakanan,
        
        (SELECT IFNULL(SUM(durasi_menit),0)/60 FROM Sewa_Ditempat 
         WHERE DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ?) AS totalJamSewa,
        
        (SELECT IFNULL(SUM(total_harga),0) FROM Sewa_Ditempat 
         WHERE DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'completed') AS pendapatanSewa,
        
        (SELECT IFNULL(SUM(total_harga),0) FROM Transaksi_Makanan 
         WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ?) AS pendapatanMakanan,
         
        (SELECT COUNT(*) FROM Sewa_Dibawa_Pulang 
         WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'menunggu persetujuan admin') AS jumlahPermintaanSewa,
         
        (SELECT COUNT(*) FROM Sewa_Dibawa_Pulang 
         WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'ditolak') AS jumlahPenolakanSewa,
        
        (SELECT IFNULL(SUM(denda_keterlambatan),0) FROM Sewa_Dibawa_Pulang 
         WHERE DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'dikembalikan') AS totalDendaKeterlambatan,
        
        (SELECT IFNULL(SUM(total_akhir),0) FROM Sewa_Dibawa_Pulang 
         WHERE DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'dikembalikan') AS pendapatanSewaBawaPulang,
        
        (SELECT IFNULL(SUM(nominal_diskon),0) FROM Sewa_Ditempat 
         WHERE DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'completed') AS totalDiskonDitempat,
        
        (SELECT IFNULL(SUM(nominal_diskon),0) FROM Sewa_Dibawa_Pulang 
         WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ?) AS totalDiskonBawaPulang
      `,
      [
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
      ]
    );

    console.log("✅ Summary data fetched");

    const summary = summaryResult[0];

    // ✅ JUMLAH SEWA BAWA PULANG = disetujui + dikembalikan
    summary.jumlahSewaBawaPulang =
      Number(summary.jumlahSewaBawaPulangDisetujui || 0) +
      Number(summary.jumlahSewaBawaPulangDikembalikan || 0);

    // ✅ JUMLAH PENGEMBALIAN = hanya yang dikembalikan
    summary.jumlahPengembalianSewa = Number(
      summary.jumlahSewaBawaPulangDikembalikan || 0
    );

    summary.totalPendapatan =
      Number(summary.pendapatanSewa || 0) +
      Number(summary.pendapatanMakanan || 0) +
      Number(summary.pendapatanSewaBawaPulang || 0);
    summary.totalDiskon =
      Number(summary.totalDiskonDitempat || 0) +
      Number(summary.totalDiskonBawaPulang || 0);

    console.log("🔍 Fetching daily detail...");

    // Query 2: Detail PER HARI - FIXED
    const [dailyDetail] = await db.execute(
      `SELECT 
        DATE(CONVERT_TZ(combined.created_at, '+00:00', '+07:00')) as tanggal,
        SUM(CASE WHEN combined.sumber = 'sewa_ditempat' THEN 1 ELSE 0 END) as sewa_ditempat,
        SUM(CASE WHEN combined.sumber = 'sewa_bawa_pulang_disetujui' THEN 1 ELSE 0 END) + 
        SUM(CASE WHEN combined.sumber = 'sewa_bawa_pulang_return' THEN 1 ELSE 0 END) as sewa_bawa_pulang,
        SUM(CASE WHEN combined.sumber = 'transaksi_makanan' THEN 1 ELSE 0 END) as transaksi_makanan,
        SUM(CASE WHEN combined.sumber = 'sewa_ditempat' THEN combined.total ELSE 0 END) as pendapatan_sewa,
        SUM(CASE WHEN combined.sumber = 'transaksi_makanan' THEN combined.total ELSE 0 END) as pendapatan_makanan,
        SUM(CASE WHEN combined.sumber = 'sewa_bawa_pulang_return' THEN combined.total ELSE 0 END) as pendapatan_bawa_pulang,
        SUM(CASE WHEN combined.sumber IN ('sewa_ditempat', 'sewa_bawa_pulang_return', 'transaksi_makanan') THEN combined.total ELSE 0 END) as total_pendapatan
      FROM (
        SELECT waktu_mulai as created_at, total_harga as total, 'sewa_ditempat' as sumber
        FROM Sewa_Ditempat
        WHERE DATE(CONVERT_TZ(waktu_mulai, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'completed'
        
        UNION ALL
        
        SELECT created_at, 0 as total, 'sewa_bawa_pulang_disetujui' as sumber
        FROM Sewa_Dibawa_Pulang
        WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'disetujui'
        
        UNION ALL
        
        SELECT tanggal_pengembalian as created_at, total_akhir as total, 'sewa_bawa_pulang_return' as sumber
        FROM Sewa_Dibawa_Pulang
        WHERE DATE(CONVERT_TZ(tanggal_pengembalian, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ? AND status_sewa = 'dikembalikan'
        
        UNION ALL
        
        SELECT created_at, total_harga as total, 'transaksi_makanan' as sumber
        FROM Transaksi_Makanan
        WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+07:00')) BETWEEN ? AND ? AND id_cabang = ?
      ) as combined
      GROUP BY DATE(CONVERT_TZ(combined.created_at, '+00:00', '+07:00'))
      ORDER BY tanggal ASC`,
      [
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
        tanggal_awal,
        tanggal_akhir,
        id_cabang,
      ]
    );

    console.log("✅ Daily detail fetched, rows:", dailyDetail.length);

    // Query 3: Top 5 Makanan Terlaris
    const [topMakanan] = await db.execute(
      `SELECT 
        m.nama_makanan,
        SUM(dtm.jumlah) as total_terjual,
        SUM(dtm.subtotal) as total_pendapatan
      FROM Detail_Transaksi_Makanan dtm
      JOIN Transaksi_Makanan tm ON dtm.id_transaksi_makanan = tm.id_transaksi_makanan
      JOIN Makanan m ON dtm.id_makanan = m.id_makanan
      WHERE DATE(CONVERT_TZ(tm.created_at, '+00:00', '+07:00')) BETWEEN ? AND ? AND tm.id_cabang = ?
      GROUP BY m.id_makanan, m.nama_makanan
      ORDER BY total_terjual DESC
      LIMIT 5`,
      [tanggal_awal, tanggal_akhir, id_cabang]
    );

    // Query 4: Statistik PS per Jenis
    const [statPS] = await db.execute(
      `SELECT 
        jp.nama_jenis,
        COUNT(DISTINCT p.id_ps) as jumlah_unit,
        IFNULL(SUM(CASE WHEN sd.status_sewa = 'completed' THEN sd.durasi_menit ELSE 0 END)/60, 0) as total_jam_sewa,
        IFNULL(SUM(CASE WHEN sd.status_sewa = 'completed' THEN sd.total_harga ELSE 0 END), 0) as pendapatan_ditempat,
        COUNT(DISTINCT CASE WHEN sbp.status_sewa = 'dikembalikan' THEN sbp.id_sewa_bawa_pulang END) as jumlah_sewa_pulang
      FROM Jenis_PS jp
      LEFT JOIN PS p ON jp.id_jenis_ps = p.id_jenis_ps AND p.id_cabang = ?
      LEFT JOIN Sewa_Ditempat sd ON p.id_ps = sd.id_ps 
        AND DATE(CONVERT_TZ(sd.waktu_mulai, '+00:00', '+07:00')) BETWEEN ? AND ?
      LEFT JOIN Sewa_Dibawa_Pulang sbp ON p.id_ps = sbp.id_ps 
        AND DATE(CONVERT_TZ(sbp.tanggal_pengembalian, '+00:00', '+07:00')) BETWEEN ? AND ?
        AND sbp.status_sewa = 'dikembalikan'
      GROUP BY jp.id_jenis_ps, jp.nama_jenis
      ORDER BY pendapatan_ditempat DESC`,
      [id_cabang, tanggal_awal, tanggal_akhir, tanggal_awal, tanggal_akhir]
    );

    console.log("📝 Creating PDF...");

    // Buat PDF
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=dashboard_${cabang.nama_cabang}_${tanggal_awal}_${tanggal_akhir}.pdf`
    );

    doc.pipe(res);

    const formatCurrency = (val) => `Rp ${Number(val).toLocaleString("id-ID")}`;
    const formatDate = (date) => {
      if (!date) return "-";
      const d = new Date(date);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("LAPORAN DASHBOARD BOSSMEN", { align: "center" });
    doc.moveDown(0.3);
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(cabang.nama_cabang.toUpperCase(), { align: "center" });
    doc.fontSize(10).font("Helvetica").text(cabang.alamat, { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .text(
        `Periode: ${formatDate(tanggal_awal)} - ${formatDate(tanggal_akhir)}`,
        { align: "center" }
      );
    doc.moveDown(1);

    // Ringkasan
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("RINGKASAN TOTAL PERIODE", { underline: true });
    doc.moveDown(0.5);

    const summaryData = [
      {
        label: "Jumlah Sewa di Tempat",
        value: `${summary.jumlahSewaDitempat} transaksi`,
      },
      {
        label: "Jumlah Sewa Dibawa Pulang",
        value: `${summary.jumlahSewaBawaPulang} transaksi`,
      },
      {
        label: "Jumlah Permintaan Sewa",
        value: `${summary.jumlahPermintaanSewa} permintaan`,
      },
      {
        label: "Jumlah Penolakan Sewa",
        value: `${summary.jumlahPenolakanSewa} penolakan`,
      },
      {
        label: "Jumlah Pengembalian Sewa",
        value: `${summary.jumlahPengembalianSewa} pengembalian`,
      },
      {
        label: "Total Jam Sewa di Tempat",
        value: `${Math.round(summary.totalJamSewa * 10) / 10} jam`,
      },
      {
        label: "Jumlah Transaksi Makanan",
        value: `${summary.jumlahTransaksiMakanan} transaksi`,
      },
    ];

    summaryData.forEach((item) => {
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`${item.label}:`, { continued: true });
      doc.font("Helvetica-Bold").text(` ${item.value}`);
    });

    doc.moveDown(1);

    // Section Pendapatan
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("RINCIAN PENDAPATAN:", { underline: true });
    doc.moveDown(0.3);

    const pendapatanData = [
      {
        label: "Pendapatan Sewa di Tempat",
        value: formatCurrency(summary.pendapatanSewa),
      },
      {
        label: "Pendapatan Sewa Bawa Pulang",
        value: formatCurrency(summary.pendapatanSewaBawaPulang),
      },
      {
        label: "Pendapatan Makanan",
        value: formatCurrency(summary.pendapatanMakanan),
      },
      {
        label: "Total Denda Keterlambatan",
        value: formatCurrency(summary.totalDendaKeterlambatan),
      },
      {
        label: "Total Diskon Diberikan",
        value: formatCurrency(summary.totalDiskon),
      },
    ];

    pendapatanData.forEach((item) => {
      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`${item.label}:`, { continued: true });
      doc.font("Helvetica-Bold").text(` ${item.value}`);
    });

    doc.moveDown(1);
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("green")
      .text(`TOTAL PENDAPATAN: ${formatCurrency(summary.totalPendapatan)}`);
    doc.fillColor("black");

    // Page break
    doc.addPage();

    // Top 5 Makanan Terlaris
    if (topMakanan.length > 0) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("TOP 5 MAKANAN TERLARIS", { underline: true });
      doc.moveDown(0.5);

      topMakanan.forEach((item, idx) => {
        doc
          .fontSize(11)
          .font("Helvetica")
          .text(`${idx + 1}. ${item.nama_makanan}`, { continued: true });
        doc
          .font("Helvetica-Bold")
          .text(
            ` - ${item.total_terjual} porsi (${formatCurrency(
              item.total_pendapatan
            )})`
          );
      });

      doc.moveDown(1.5);
    }

    // Statistik PS per Jenis
    if (statPS.length > 0) {
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("STATISTIK PLAYSTATION PER JENIS", { underline: true });
      doc.moveDown(0.5);

      statPS.forEach((item) => {
        if (item.jumlah_unit > 0) {
          doc.fontSize(12).font("Helvetica-Bold").text(item.nama_jenis);
          doc
            .fontSize(10)
            .font("Helvetica")
            .text(`  • Jumlah Unit: ${item.jumlah_unit} unit`)
            .text(
              `  • Total Jam Sewa: ${
                Math.round(item.total_jam_sewa * 10) / 10
              } jam`
            )
            .text(
              `  • Pendapatan Sewa Ditempat: ${formatCurrency(
                item.pendapatan_ditempat
              )}`
            )
            .text(
              `  • Jumlah Sewa Bawa Pulang: ${item.jumlah_sewa_pulang} kali`
            );
          doc.moveDown(0.5);
        }
      });

      doc.moveDown(1);
    }

    // Tabel Detail Harian
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("RINCIAN HARIAN", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colWidths = [70, 50, 50, 50, 75, 75, 75, 90];
    const headers = [
      "Tanggal",
      "Sewa\nTempat",
      "Sewa\nPulang",
      "Trans.\nMakanan",
      "Pend.\nSewa",
      "Pend.\nBawa Pulang",
      "Pend.\nMakanan",
      "Total\nPendapatan",
    ];

    let xPos = doc.page.margins.left;
    doc.fontSize(8).font("Helvetica-Bold");

    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop, {
        width: colWidths[i],
        align: "center",
      });
      xPos += colWidths[i];
    });

    doc
      .moveTo(doc.page.margins.left, tableTop + 25)
      .lineTo(doc.page.width - doc.page.margins.right, tableTop + 25)
      .stroke();

    let yPos = tableTop + 30;
    doc.font("Helvetica").fontSize(7);

    dailyDetail.forEach((row, index) => {
      if (yPos > doc.page.height - 100) {
        doc.addPage();
        yPos = doc.page.margins.top;
      }

      xPos = doc.page.margins.left;
      const rowData = [
        formatDate(row.tanggal),
        row.sewa_ditempat || 0,
        row.sewa_bawa_pulang || 0,
        row.transaksi_makanan || 0,
        formatCurrency(row.pendapatan_sewa || 0),
        formatCurrency(row.pendapatan_bawa_pulang || 0),
        formatCurrency(row.pendapatan_makanan || 0),
        formatCurrency(row.total_pendapatan || 0),
      ];

      rowData.forEach((data, i) => {
        doc.text(String(data), xPos, yPos, {
          width: colWidths[i],
          align: i === 0 ? "left" : "center",
        });
        xPos += colWidths[i];
      });

      yPos += 18;

      if (index < dailyDetail.length - 1) {
        doc
          .moveTo(doc.page.margins.left, yPos - 4)
          .lineTo(doc.page.width - doc.page.margins.right, yPos - 4)
          .strokeOpacity(0.3)
          .stroke()
          .strokeOpacity(1);
      }
    });

    doc.moveDown(2);
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(`Laporan digenerate pada: ${new Date().toLocaleString("id-ID")}`, {
        align: "center",
      });

    doc.end();
    console.log("✅ PDF generated successfully");
  } catch (err) {
    console.error("❌ Export PDF error:", err);
    res.status(500).json({
      message: "Server error saat export PDF",
      error: err.message,
    });
  }
};

module.exports = {
  getSummary,
  getPendapatanHarian,
  getPendapatanByDateRange,
  getPendapatanMingguan,
  getPendapatanBulanan,
  getPendapatanTahunan,
  exportPDF,
};
