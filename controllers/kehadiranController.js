const db = require("../config/db");
const PDFDocument = require("pdfkit");
// ==================== LAPORAN KEHADIRAN BULANAN ====================

// Get kehadiran karyawan per bulan (untuk penggajian)
const getKehadiranBulanan = async (req, res) => {
  try {
    const { id_karyawan } = req.params;
    let { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
      const now = new Date();
      bulan = bulan || now.getMonth() + 1;
      tahun = tahun || now.getFullYear();
    }

    const [kehadiran] = await db.execute(
      `SELECT 
        k.id_karyawan,
        k.nama_karyawan,
        c.id_cabang,
        c.nama_cabang,
        COUNT(DISTINCT js.id_jadwal_shift) as total_shift_terjadwal,
        COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM absensi a1 WHERE a1.id_jadwal_shift = js.id_jadwal_shift AND a1.tipe_absensi = 'masuk') AND EXISTS (SELECT 1 FROM absensi a2 WHERE a2.id_jadwal_shift = js.id_jadwal_shift AND a2.tipe_absensi = 'pulang') THEN js.id_jadwal_shift END) as total_hadir,
        COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM absensi a1 WHERE a1.id_jadwal_shift = js.id_jadwal_shift AND a1.tipe_absensi = 'masuk') AND NOT EXISTS (SELECT 1 FROM absensi a2 WHERE a2.id_jadwal_shift = js.id_jadwal_shift AND a2.tipe_absensi = 'pulang') THEN js.id_jadwal_shift END) as total_tidak_absen_pulang,
        COUNT(DISTINCT CASE WHEN NOT EXISTS (SELECT 1 FROM absensi a WHERE a.id_jadwal_shift = js.id_jadwal_shift AND a.tipe_absensi = 'masuk') THEN js.id_jadwal_shift END) as total_tidak_hadir,
        SUM(CASE WHEN EXISTS (SELECT 1 FROM absensi a1 WHERE a1.id_jadwal_shift = js.id_jadwal_shift AND a1.tipe_absensi = 'masuk') AND EXISTS (SELECT 1 FROM absensi a2 WHERE a2.id_jadwal_shift = js.id_jadwal_shift AND a2.tipe_absensi = 'pulang') THEN sc.durasi_jam ELSE 0 END) as total_jam_kerja
       FROM jadwal_shift js
       JOIN karyawan k ON js.id_karyawan = k.id_karyawan
       JOIN shift_config sc ON js.id_shift_config = sc.id_shift_config
       JOIN cabang c ON sc.id_cabang = c.id_cabang
       WHERE js.id_karyawan = ? AND MONTH(js.tanggal) = ? AND YEAR(js.tanggal) = ? AND js.status_jadwal = 'terjadwal'
       GROUP BY k.id_karyawan, c.id_cabang`,
      [id_karyawan, bulan, tahun]
    );

    if (kehadiran.length === 0) {
      return res.json({
        id_karyawan: parseInt(id_karyawan),
        bulan: parseInt(bulan),
        tahun: parseInt(tahun),
        total_shift_terjadwal: 0,
        total_hadir: 0,
        total_tidak_absen_pulang: 0,
        total_tidak_hadir: 0,
        total_jam_kerja: 0,
        persentase_kehadiran: 0,
      });
    }

    const result = kehadiran[0];
    result.persentase_kehadiran =
      result.total_shift_terjadwal > 0
        ? ((result.total_hadir / result.total_shift_terjadwal) * 100).toFixed(2)
        : 0;
    res.json(result);
  } catch (err) {
    console.error("❌ Error getKehadiranBulanan:", err);
    res.status(500).json({
      message: "Gagal mengambil data kehadiran bulanan",
      error: err.message,
    });
  }
};

// Get detail kehadiran per hari dalam bulan tertentu
// di kehadiranController.js

const getDetailKehadiranBulanan = async (req, res) => {
  try {
    const { id_karyawan } = req.params;
    let { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
      const now = new Date();
      bulan = bulan || now.getMonth() + 1;
      tahun = tahun || now.getFullYear();
    }

    console.log(`\n... DEBUG LOGGING ...\n`);

    const [detail] = await db.execute(
      `SELECT 
        -- ✅ PERBAIKAN: Gunakan DATE_FORMAT untuk menghindari konversi timezone
        DATE_FORMAT(js.tanggal, '%Y-%m-%d') as tanggal, 
        
        js.id_jadwal_shift,
        sc.nama_shift,
        sc.jam_mulai,
        sc.jam_selesai,
        
        (SELECT CONVERT_TZ(created_at, '+00:00', '+07:00') FROM absensi WHERE id_jadwal_shift = js.id_jadwal_shift AND tipe_absensi = 'masuk' LIMIT 1) as waktu_absen_masuk,
        (SELECT CONVERT_TZ(created_at, '+00:00', '+07:00') FROM absensi WHERE id_jadwal_shift = js.id_jadwal_shift AND tipe_absensi = 'pulang' LIMIT 1) as waktu_absen_pulang,
        
        CASE 
          WHEN EXISTS (SELECT 1 FROM absensi WHERE id_jadwal_shift = js.id_jadwal_shift AND tipe_absensi = 'masuk') AND EXISTS (SELECT 1 FROM absensi WHERE id_jadwal_shift = js.id_jadwal_shift AND tipe_absensi = 'pulang') THEN 'Hadir'
          WHEN EXISTS (SELECT 1 FROM absensi WHERE id_jadwal_shift = js.id_jadwal_shift AND tipe_absensi = 'masuk') THEN 'Tidak Absen Pulang'
          ELSE 'Tidak Hadir'
        END as status_kehadiran,
        
        js.status_jadwal
        
       FROM jadwal_shift js
       JOIN shift_config sc ON js.id_shift_config = sc.id_shift_config
       WHERE js.id_karyawan = ?
       AND MONTH(js.tanggal) = ?
       AND YEAR(js.tanggal) = ?
       ORDER BY js.tanggal ASC, sc.jam_mulai ASC`,
      [id_karyawan, bulan, tahun]
    );

    console.log(`✅ HASIL DARI DATABASE:`);
    console.log(JSON.stringify(detail, null, 2));
    console.log(`-------------------------\n`);

    res.json(detail);
  } catch (err) {
    console.error("❌ Error getDetailKehadiranBulanan:", err);
    res.status(500).json({
      message: "Gagal mengambil detail kehadiran",
      error: err.message,
    });
  }
};
// Get kehadiran semua karyawan per bulan (untuk admin/HRD)
const getKehadiranSemuaKaryawan = async (req, res) => {
  try {
    let { bulan, tahun, id_cabang } = req.query;

    if (!bulan || !tahun) {
      const now = new Date();
      bulan = bulan || now.getMonth() + 1;
      tahun = tahun || now.getFullYear();
    }

    const params = [bulan, tahun];
    let whereClause = "";
    if (id_cabang) {
      whereClause = "AND c.id_cabang = ?";
      params.push(id_cabang);
    }

    const [kehadiran] = await db.execute(
      `SELECT 
        k.id_karyawan, k.nama_karyawan, k.no_wa, c.id_cabang, c.nama_cabang,
        COUNT(DISTINCT js.id_jadwal_shift) as total_shift_terjadwal,
        COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM absensi a1 WHERE a1.id_jadwal_shift = js.id_jadwal_shift AND a1.tipe_absensi = 'masuk') AND EXISTS (SELECT 1 FROM absensi a2 WHERE a2.id_jadwal_shift = js.id_jadwal_shift AND a2.tipe_absensi = 'pulang') THEN js.id_jadwal_shift END) as total_hadir,
        COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM absensi a1 WHERE a1.id_jadwal_shift = js.id_jadwal_shift AND a1.tipe_absensi = 'masuk') AND NOT EXISTS (SELECT 1 FROM absensi a2 WHERE a2.id_jadwal_shift = js.id_jadwal_shift AND a2.tipe_absensi = 'pulang') THEN js.id_jadwal_shift END) as total_tidak_absen_pulang,
        COUNT(DISTINCT CASE WHEN NOT EXISTS (SELECT 1 FROM absensi a WHERE a.id_jadwal_shift = js.id_jadwal_shift AND a.tipe_absensi = 'masuk') THEN js.id_jadwal_shift END) as total_tidak_hadir,
        SUM(CASE WHEN EXISTS (SELECT 1 FROM absensi a1 WHERE a1.id_jadwal_shift = js.id_jadwal_shift AND a1.tipe_absensi = 'masuk') AND EXISTS (SELECT 1 FROM absensi a2 WHERE a2.id_jadwal_shift = js.id_jadwal_shift AND a2.tipe_absensi = 'pulang') THEN sc.durasi_jam ELSE 0 END) as total_jam_kerja,
        ROUND((COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM absensi a1 WHERE a1.id_jadwal_shift = js.id_jadwal_shift AND a1.tipe_absensi = 'masuk') AND EXISTS (SELECT 1 FROM absensi a2 WHERE a2.id_jadwal_shift = js.id_jadwal_shift AND a2.tipe_absensi = 'pulang') THEN js.id_jadwal_shift END) * 100.0 / COUNT(DISTINCT js.id_jadwal_shift)), 2) as persentase_kehadiran
       FROM karyawan k
       LEFT JOIN jadwal_shift js ON k.id_karyawan = js.id_karyawan AND MONTH(js.tanggal) = ? AND YEAR(js.tanggal) = ? AND js.status_jadwal = 'terjadwal'
       LEFT JOIN shift_config sc ON js.id_shift_config = sc.id_shift_config
       LEFT JOIN cabang c ON k.id_cabang = c.id_cabang
       WHERE k.status = 'aktif' ${whereClause}
       GROUP BY k.id_karyawan
       ORDER BY c.nama_cabang, k.nama_karyawan`,
      params
    );

    res.json(kehadiran);
  } catch (err) {
    console.error("❌ Error getKehadiranSemuaKaryawan:", err);
    res.status(500).json({
      message: "Gagal mengambil data kehadiran semua karyawan",
      error: err.message,
    });
  }
};

// Get statistik kehadiran per shift (untuk analisis)
const getStatistikPerShift = async (req, res) => {
  try {
    let { bulan, tahun, id_cabang } = req.query;

    if (!bulan || !tahun) {
      const now = new Date();
      bulan = bulan || now.getMonth() + 1;
      tahun = tahun || now.getFullYear();
    }

    const params = [bulan, tahun];
    let whereClause = "";

    if (id_cabang) {
      whereClause = "AND c.id_cabang = ?";
      params.push(id_cabang);
    }

    const [statistik] = await db.execute(
      `SELECT 
        c.id_cabang,
        c.nama_cabang,
        sc.id_shift_config,
        sc.nama_shift,
        sc.jam_mulai,
        sc.jam_selesai,
        
        COUNT(DISTINCT js.id_jadwal_shift) as total_shift_terjadwal,
        COUNT(DISTINCT js.id_karyawan) as total_karyawan,
        
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM absensi a1 
            WHERE a1.id_jadwal_shift = js.id_jadwal_shift 
            AND a1.tipe_absensi = 'masuk'
          ) AND EXISTS (
            SELECT 1 FROM absensi a2 
            WHERE a2.id_jadwal_shift = js.id_jadwal_shift 
            AND a2.tipe_absensi = 'pulang'
          )
          THEN js.id_jadwal_shift 
        END) as total_shift_hadir,
        
        ROUND(
          (COUNT(DISTINCT CASE 
            WHEN EXISTS (
              SELECT 1 FROM absensi a1 
              WHERE a1.id_jadwal_shift = js.id_jadwal_shift 
              AND a1.tipe_absensi = 'masuk'
            ) AND EXISTS (
              SELECT 1 FROM absensi a2 
              WHERE a2.id_jadwal_shift = js.id_jadwal_shift 
              AND a2.tipe_absensi = 'pulang'
            )
            THEN js.id_jadwal_shift 
          END) * 100.0 / COUNT(DISTINCT js.id_jadwal_shift)), 2
        ) as persentase_kehadiran
        
       FROM jadwal_shift js
       JOIN shift_config sc ON js.id_shift_config = sc.id_shift_config
       JOIN cabang c ON sc.id_cabang = c.id_cabang
       WHERE MONTH(js.tanggal) = ?
       AND YEAR(js.tanggal) = ?
       AND js.status_jadwal = 'terjadwal'
       ${whereClause}
       GROUP BY c.id_cabang, sc.id_shift_config
       ORDER BY c.nama_cabang, sc.jam_mulai`,
      params
    );

    res.json(statistik);
  } catch (err) {
    console.error("❌ Error getStatistikPerShift:", err);
    res.status(500).json({
      message: "Gagal mengambil statistik per shift",
      error: err.message,
    });
  }
};

const exportKehadiranPenggajian = async (req, res) => {
  try {
    let { bulan, tahun, id_cabang } = req.query;

    if (!bulan || !tahun) {
      return res.status(400).json({
        message: "Parameter bulan dan tahun harus diisi",
      });
    }

    const params = [bulan, tahun];
    let whereClause = "";

    if (id_cabang) {
      whereClause = "AND c.id_cabang = ?";
      params.push(id_cabang);
    }

    const [data] = await db.execute(
      `SELECT 
        k.id_karyawan as 'ID Karyawan',
        k.nama_karyawan as 'Nama Karyawan',
        k.no_wa as 'No Telepon',
        c.nama_cabang as 'Cabang',
        COUNT(DISTINCT js.id_jadwal_shift) as 'Total Shift',
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM absensi a1 
            WHERE a1.id_jadwal_shift = js.id_jadwal_shift 
            AND a1.tipe_absensi = 'masuk'
          ) AND EXISTS (
            SELECT 1 FROM absensi a2 
            WHERE a2.id_jadwal_shift = js.id_jadwal_shift 
            AND a2.tipe_absensi = 'pulang'
          )
          THEN js.id_jadwal_shift 
        END) as 'Total Hadir',
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM absensi a 
            WHERE a.id_jadwal_shift = js.id_jadwal_shift 
            AND a.tipe_absensi = 'masuk'
          )
          THEN js.id_jadwal_shift 
        END) as 'Total Tidak Hadir',
        SUM(CASE 
          WHEN EXISTS (
            SELECT 1 FROM absensi a1 
            WHERE a1.id_jadwal_shift = js.id_jadwal_shift 
            AND a1.tipe_absensi = 'masuk'
          ) AND EXISTS (
            SELECT 1 FROM absensi a2 
            WHERE a2.id_jadwal_shift = js.id_jadwal_shift 
            AND a2.tipe_absensi = 'pulang'
          )
          THEN sc.durasi_jam 
          ELSE 0
        END) as 'Total Jam Kerja',
        CONCAT(
          ROUND(
            (COUNT(DISTINCT CASE 
              WHEN EXISTS (
                SELECT 1 FROM absensi a1 
                WHERE a1.id_jadwal_shift = js.id_jadwal_shift 
                AND a1.tipe_absensi = 'masuk'
              ) AND EXISTS (
                SELECT 1 FROM absensi a2 
                WHERE a2.id_jadwal_shift = js.id_jadwal_shift 
                AND a2.tipe_absensi = 'pulang'
              )
              THEN js.id_jadwal_shift 
            END) * 100.0 / COUNT(DISTINCT js.id_jadwal_shift)), 2
          ), '%'
        ) as 'Persentase Kehadiran'
       FROM karyawan k
       LEFT JOIN jadwal_shift js ON k.id_karyawan = js.id_karyawan 
         AND MONTH(js.tanggal) = ? 
         AND YEAR(js.tanggal) = ?
         AND js.status_jadwal = 'terjadwal'
       LEFT JOIN shift_config sc ON js.id_shift_config = sc.id_shift_config
       LEFT JOIN cabang c ON k.id_cabang = c.id_cabang
       WHERE k.status = 'aktif'
       ${whereClause}
       GROUP BY k.id_karyawan
       ORDER BY c.nama_cabang, k.nama_karyawan`,
      params
    );

    // Generate PDF
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 50,
    });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Kehadiran-${bulan}-${tahun}.pdf`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("LAPORAN KEHADIRAN PENGGAJIAN", {
        align: "center",
      });

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Bulan: ${bulan} | Tahun: ${tahun}`, { align: "center" });

    doc.moveDown();
    doc.fontSize(10).text(`Total Karyawan: ${data.length}`, { align: "left" });
    doc.moveDown();

    // Table Setup
    const tableTop = 150;
    const itemHeight = 25;
    const pageHeight = doc.page.height - 100;

    // Column positions
    const columns = {
      no: 30,
      nama: 130,
      telp: 230,
      cabang: 320,
      shift: 400,
      hadir: 450,
      tidakHadir: 510,
      persentase: 660,
    };

    // Function to draw table header
    const drawTableHeader = (y) => {
      doc.fontSize(8).font("Helvetica-Bold");
      doc.text("No", columns.no, y);
      doc.text("Nama", columns.nama, y);
      doc.text("Telepon", columns.telp, y);
      doc.text("Cabang", columns.cabang, y);
      doc.text("Jumlah Shift", columns.shift, y);
      doc.text("Hadir", columns.hadir, y);
      doc.text("Tidak Hadir", columns.tidakHadir, y);
      doc.text("Persentase Kehadiran", columns.persentase, y);

      doc
        .moveTo(30, y + 15)
        .lineTo(720, y + 15)
        .stroke();
    };

    // Draw first header
    drawTableHeader(tableTop);

    let currentY = tableTop + 20;
    let rowNumber = 1;

    // Table content
    doc.font("Helvetica").fontSize(7);

    data.forEach((row, index) => {
      // Check if need new page
      if (currentY > pageHeight) {
        doc.addPage({ layout: "landscape" });
        currentY = 50;
        drawTableHeader(currentY);
        currentY += 20;
      }

      doc.text(rowNumber, columns.no, currentY);
      doc.text(row["Nama Karyawan"] || "-", columns.nama, currentY, {
        width: 90,
      });
      doc.text(row["No Telepon"] || "-", columns.telp, currentY);
      doc.text(row["Cabang"] || "-", columns.cabang, currentY, { width: 70 });
      doc.text(row["Total Shift"]?.toString() || "0", columns.shift, currentY);
      doc.text(row["Total Hadir"]?.toString() || "0", columns.hadir, currentY);
      doc.text(
        row["Total Tidak Hadir"]?.toString() || "0",
        columns.tidakHadir,
        currentY
      );
      doc.text(
        row["Persentase Kehadiran"] || "0%",
        columns.persentase,
        currentY
      );

      currentY += itemHeight;
      rowNumber++;
    });

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .text(`Halaman ${i + 1} dari ${pages.count}`, 0, doc.page.height - 50, {
          align: "center",
        });
    }

    doc.end();
  } catch (err) {
    console.error("❌ Error exportKehadiranPenggajian:", err);
    res.status(500).json({
      message: "Gagal export data kehadiran",
      error: err.message,
    });
  }
};

module.exports = {
  getKehadiranBulanan,
  getDetailKehadiranBulanan,
  getKehadiranSemuaKaryawan,
  getStatistikPerShift,
  exportKehadiranPenggajian,
};
