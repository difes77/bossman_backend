const db = require("../config/db");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const createPenggunaan = async (req, res) => {
  const {
    id_karyawan,
    id_bahan_baku,
    jumlah_digunakan,
    keterangan,
    id_cabang,
  } = req.body;

  if (!id_karyawan || !id_bahan_baku || !jumlah_digunakan || !id_cabang) {
    return res.status(400).json({ message: "Data tidak lengkap" });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    await conn.execute(
      `INSERT INTO Penggunaan_Bahan_Baku 
       (id_karyawan, id_bahan_baku, jumlah_digunakan, keterangan, id_cabang)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id_karyawan,
        id_bahan_baku,
        jumlah_digunakan,
        keterangan || null,
        id_cabang,
      ]
    );

    await conn.execute(
      `UPDATE Bahan_Baku 
       SET jumlah_stok = jumlah_stok - ? 
       WHERE id_bahan_baku = ?`,
      [jumlah_digunakan, id_bahan_baku]
    );

    await conn.commit();
    res.status(201).json({ message: "Penggunaan bahan baku berhasil dicatat" });
  } catch (err) {
    await conn.rollback();
    console.error("Gagal simpan penggunaan bahan baku:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};

const getPenggunaanFiltered = async (req, res) => {
  const { id_cabang, tanggal } = req.query;

  let query = `
    SELECT pb.*, b.nama_bahan_baku, b.unit_satuan, k.nama_karyawan
    FROM Penggunaan_Bahan_Baku pb
    JOIN Bahan_Baku b ON pb.id_bahan_baku = b.id_bahan_baku
    JOIN Karyawan k ON pb.id_karyawan = k.id_karyawan
    WHERE 1=1
  `;
  const params = [];

  if (id_cabang) {
    query += ` AND pb.id_cabang = ?`;
    params.push(id_cabang);
  }

  if (tanggal) {
    query += ` AND DATE(pb.created_at) = ?`;
    params.push(tanggal);
  }

  query += ` ORDER BY pb.created_at DESC`;

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error("Gagal ambil data penggunaan (filtered):", err);
    res.status(500).json({ message: "Server error" });
  }
};

const exportPDF = async (req, res) => {
  const { id_cabang, tanggal } = req.query;

  let query = `
    SELECT pb.*, b.nama_bahan_baku, b.unit_satuan, k.nama_karyawan
    FROM Penggunaan_Bahan_Baku pb
    JOIN Bahan_Baku b ON pb.id_bahan_baku = b.id_bahan_baku
    JOIN Karyawan k ON pb.id_karyawan = k.id_karyawan
    WHERE 1=1
  `;
  const params = [];

  if (id_cabang) {
    query += ` AND pb.id_cabang = ?`;
    params.push(id_cabang);
  }
  if (tanggal) {
    query += ` AND DATE(pb.created_at) = ?`;
    params.push(tanggal);
  }

  query += ` ORDER BY pb.created_at DESC`;

  try {
    const [rows] = await db.execute(query, params);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=laporan_penggunaan.pdf"
    );
    doc.pipe(res);

    doc.fontSize(16).text("Laporan Penggunaan Bahan Baku", { align: "center" });
    doc.moveDown();

    rows.forEach((item, i) => {
      doc
        .fontSize(12)
        .text(
          `${i + 1}. ${item.nama_bahan_baku} - ${item.jumlah_digunakan} ${
            item.unit_satuan
          }`
        )
        .text(`   Dipakai oleh: ${item.nama_karyawan}`)
        .text(`   Tanggal: ${new Date(item.created_at).toLocaleString()}`)
        .moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    console.error("Export PDF error:", err);
    res.status(500).json({ message: "Gagal export PDF" });
  }
};

const exportExcel = async (req, res) => {
  const { id_cabang, tanggal } = req.query;

  let query = `
    SELECT pb.*, b.nama_bahan_baku, b.unit_satuan, k.nama_karyawan
    FROM Penggunaan_Bahan_Baku pb
    JOIN Bahan_Baku b ON pb.id_bahan_baku = b.id_bahan_baku
    JOIN Karyawan k ON pb.id_karyawan = k.id_karyawan
    WHERE 1=1
  `;
  const params = [];

  if (id_cabang) {
    query += ` AND pb.id_cabang = ?`;
    params.push(id_cabang);
  }
  if (tanggal) {
    query += ` AND DATE(pb.created_at) = ?`;
    params.push(tanggal);
  }

  query += ` ORDER BY pb.created_at DESC`;

  try {
    const [rows] = await db.execute(query, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Penggunaan Bahan");

    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Bahan Baku", key: "bahan", width: 25 },
      { header: "Jumlah", key: "jumlah", width: 10 },
      { header: "Satuan", key: "satuan", width: 10 },
      { header: "Karyawan", key: "karyawan", width: 20 },
      { header: "Tanggal", key: "tanggal", width: 25 },
      { header: "Keterangan", key: "keterangan", width: 30 },
    ];

    rows.forEach((item, i) => {
      worksheet.addRow({
        no: i + 1,
        bahan: item.nama_bahan_baku,
        jumlah: item.jumlah_digunakan,
        satuan: item.unit_satuan,
        karyawan: item.nama_karyawan,
        tanggal: item.created_at,
        keterangan: item.keterangan || "-",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=laporan_penggunaan.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export Excel error:", err);
    res.status(500).json({ message: "Gagal export Excel" });
  }
};

const getByTanggal = async (req, res) => {
  let { tanggal, id_cabang } = req.query;

  if (!tanggal) {
    const now = new Date();
    tanggal = now.toISOString().split("T")[0]; // default ke hari ini
  }

  let query = `
    SELECT 
      pb.id_penggunaan_bahan,
      pb.created_at,
      pb.jumlah_digunakan,
      pb.keterangan,
      k.nama_karyawan,
      b.nama_bahan_baku,
      b.unit_satuan
    FROM Penggunaan_Bahan_Baku pb
    JOIN Karyawan k ON pb.id_karyawan = k.id_karyawan
    JOIN Bahan_Baku b ON pb.id_bahan_baku = b.id_bahan_baku
    WHERE DATE(pb.created_at) = ?
  `;
  const params = [tanggal];

  if (id_cabang) {
    query += ` AND pb.id_cabang = ?`;
    params.push(id_cabang);
  }

  query += ` ORDER BY pb.created_at DESC`;

  try {
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Gagal ambil penggunaan bahan:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createPenggunaan,
  getPenggunaanFiltered,
  exportPDF,
  exportExcel,
  getByTanggal,
};
