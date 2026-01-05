// controllers/reportController.js
const db = require("../config/db");
const {
  emitReportCreated,
  emitNotification,
} = require("../websocket/socketHandler");

exports.createReport = async (req, res) => {
  try {
    const { id_karyawan, deskripsi_report, id_cabang } = req.body;

    // Generate foto URLs
    const fotoUrls = req.files.map(
      (file) => `/uploads/report/${file.filename}`
    );

    const [result] = await db.query(
      `INSERT INTO Report (id_karyawan, deskripsi_report, foto_report_urls, id_cabang)
       VALUES (?, ?, ?, ?)`,
      [id_karyawan, deskripsi_report, JSON.stringify(fotoUrls), id_cabang]
    );

    // Get karyawan name
    const [karyawanRows] = await db.query(
      "SELECT nama_karyawan FROM Karyawan WHERE id_karyawan = ?",
      [id_karyawan]
    );
    const namaKaryawan = karyawanRows[0]?.nama_karyawan || "Unknown";

    // ✅ EMIT: Report Created
    emitReportCreated(id_cabang, {
      id_report: result.insertId,
      id_karyawan,
      nama_karyawan: namaKaryawan,
      deskripsi_report,
      foto_report_urls: fotoUrls,
      status_report: "unread",
    });

    // ✅ EMIT: Notification untuk Admin
    emitNotification(id_cabang, {
      type: "warning",
      title: "Laporan Baru",
      message: `${namaKaryawan} mengirim laporan: ${deskripsi_report.substring(
        0,
        50
      )}...`,
      data: { id_report: result.insertId },
    });

    res.status(201).json({
      message: "Laporan berhasil dikirim",
      id_report: result.insertId,
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: "Gagal mengirim laporan" });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const { id_cabang } = req.query;

    let query = `
      SELECT r.*, k.nama_karyawan, c.nama_cabang
      FROM Report r
      JOIN Karyawan k ON r.id_karyawan = k.id_karyawan
      JOIN Cabang c ON r.id_cabang = c.id_cabang
    `;

    const params = [];

    if (id_cabang) {
      query += " WHERE r.id_cabang = ?";
      params.push(id_cabang);
    }

    query += " ORDER BY r.created_at DESC";

    const [rows] = await db.query(query, params);

    const result = rows.map((r) => ({
      ...r,
      foto_report_urls: JSON.parse(r.foto_report_urls || "[]"),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error getting all reports:", error);
    res.status(500).json({ error: "Gagal mengambil data laporan" });
  }
};

exports.getReportById = async (req, res) => {
  try {
    // ✅ FIXED: Proper query syntax
    const [rows] = await db.query("SELECT * FROM Report WHERE id_report = ?", [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Laporan tidak ditemukan" });
    }

    const report = rows[0];
    report.foto_report_urls = JSON.parse(report.foto_report_urls || "[]");

    res.json(report);
  } catch (error) {
    console.error("Error getting report by ID:", error);
    res.status(500).json({ error: "Gagal mengambil laporan" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status_report } = req.body;

    if (!["unread", "read"].includes(status_report)) {
      return res.status(400).json({ error: "Status tidak valid" });
    }

    // Get report untuk emit event
    const [reportRows] = await db.query(
      "SELECT id_cabang FROM Report WHERE id_report = ?",
      [req.params.id]
    );

    // ✅ FIXED: Proper query syntax
    await db.query("UPDATE Report SET status_report = ? WHERE id_report = ?", [
      status_report,
      req.params.id,
    ]);

    // ✅ EMIT: Report Status Updated (optional, jika diperlukan)
    if (reportRows[0]) {
      const { emitToBranch, EVENTS } = require("../websocket/socketHandler");
      emitToBranch(reportRows[0].id_cabang, EVENTS.REPORT_STATUS_UPDATED, {
        id_report: parseInt(req.params.id),
        status_report,
      });
    }

    res.json({ message: "Status laporan berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating report status:", error);
    res.status(500).json({ error: "Gagal memperbarui status laporan" });
  }
};
