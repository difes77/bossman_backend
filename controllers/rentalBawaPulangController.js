// controllers/rentalBawaPulangController.js
const rentalModel = require("../models/rentalBawaPulangModel");
const db = require("../config/db");
const axios = require("axios");
const {
  emitPsStatusUpdate,
  emitSewaBawaPulangCreated,
  emitSewaBawaPulangApproved,
  emitSewaBawaPulangRejected,
  emitSewaBawaPulangCompleted,
  emitNotification,
} = require("../websocket/socketHandler");

// ========== utils API WhatsApp Fonnte ==========
const FONNTE_API_URL = "https://api.fonnte.com/send";
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || "SRnosdLTy8KLSZUHWMEq";
const ADMIN_WA = process.env.ADMIN_WA || "6281234567890";

const sendWhatsAppNotification = async (phoneNumber, message) => {
  try {
    const response = await axios.post(
      FONNTE_API_URL,
      {
        target: phoneNumber,
        message: message,
        countryCode: "62",
      },
      {
        headers: {
          Authorization: FONNTE_TOKEN,
        },
      }
    );

    if (response.data.status) {
      console.log("✅ WhatsApp berhasil dikirim ke:", phoneNumber);
      return true;
    } else {
      console.log("⚠️ WhatsApp gagal:", response.data.reason);
      return false;
    }
  } catch (error) {
    console.error("❌ Error kirim WhatsApp:", error.message);
    return false;
  }
};

// =========== Controller Mobile ===========
const createRental = async (req, res) => {
  console.log("📥 req.body:", req.body);
  console.log("🖼️ req.files:", req.files);

  try {
    const data = req.body;
    const files = req.files;
    const fotoOrang = files?.foto_orang?.[0]?.filename || null;
    const fotoIdentitas = files?.foto_identitas_jaminan?.[0]?.filename || null;

    // Validasi input wajib
    if (
      !data.id_ps ||
      !data.id_karyawan ||
      !data.id_cabang ||
      !data.nama_penyewa ||
      !data.alamat_penyewa ||
      !data.no_telp_penyewa ||
      !data.total_harga_sewa ||
      !data.paket_sewa ||
      !data.tanggal_kembali
    ) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }

    // Cek status PS
    const [[psData]] = await db.execute(
      "SELECT status_fisik, nomor_ps FROM PS WHERE id_ps = ?",
      [data.id_ps]
    );

    if (!psData) {
      return res.status(404).json({ message: "Data PS tidak ditemukan." });
    }

    if (psData.status_fisik !== "available") {
      return res.status(400).json({ message: "PS sedang tidak tersedia." });
    }

    // Siapkan data untuk insert
    const rentalData = {
      id_ps: data.id_ps,
      id_karyawan: data.id_karyawan,
      id_cabang: data.id_cabang,
      nama_penyewa: data.nama_penyewa,
      alamat_penyewa: data.alamat_penyewa,
      no_telp_penyewa: data.no_telp_penyewa,
      total_harga_sewa: data.total_harga_sewa,
      foto_orang: fotoOrang,
      foto_identitas_jaminan: fotoIdentitas,
      status_sewa: "menunggu persetujuan admin",
      paket_sewa: data.paket_sewa,
      nominal_diskon: data.nominal_diskon || 0,
      diskon_persen: data.diskon_persen || 0,
      tanggal_kembali: data.tanggal_kembali,
    };

    // Simpan ke DB
    const insertId = await rentalModel.createRental(rentalData);

    // Update status PS ke borrowed_out
    await db.execute(
      "UPDATE PS SET status_fisik = 'borrowed_out', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?",
      [data.id_ps]
    );

    // Ambil data karyawan dan cabang
    const [karyawanRows] = await db.execute(
      "SELECT nama_karyawan FROM karyawan WHERE id_karyawan = ?",
      [data.id_karyawan]
    );

    const [cabangRows] = await db.execute(
      "SELECT nama_cabang FROM cabang WHERE id_cabang = ?",
      [data.id_cabang]
    );

    const namaKaryawan = karyawanRows[0]?.nama_karyawan || "-";
    const namaCabang = cabangRows[0]?.nama_cabang || "-";

    // ✅ EMIT: PS Status Updated
    emitPsStatusUpdate(data.id_cabang, {
      id_ps: parseInt(data.id_ps),
      nomor_ps: psData.nomor_ps,
      status_fisik: "borrowed_out",
      action: "sewa_bawa_pulang_created",
    });

    // ✅ EMIT: Sewa Bawa Pulang Created (untuk notifikasi Admin)
    emitSewaBawaPulangCreated(data.id_cabang, {
      id_sewa_bawa_pulang: insertId,
      id_ps: parseInt(data.id_ps),
      nomor_ps: psData.nomor_ps,
      nama_penyewa: data.nama_penyewa,
      alamat_penyewa: data.alamat_penyewa,
      no_telp_penyewa: data.no_telp_penyewa,
      paket_sewa: data.paket_sewa,
      total_harga_sewa: data.total_harga_sewa,
      tanggal_kembali: data.tanggal_kembali,
      karyawan: namaKaryawan,
      cabang: namaCabang,
      status_sewa: "menunggu persetujuan admin",
    });

    // Kirim WhatsApp ke Admin
    const message =
      `🔔 *PERMINTAAN SEWA BARU*\n\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `📋 *Detail Permintaan:*\n` +
      `• PS: ${psData.nomor_ps}\n` +
      `• Karyawan: ${namaKaryawan}\n` +
      `• Cabang: ${namaCabang}\n\n` +
      `👤 *Data Penyewa:*\n` +
      `• Nama: ${data.nama_penyewa}\n` +
      `• Alamat: ${data.alamat_penyewa}\n` +
      `• No. Telp: ${data.no_telp_penyewa}\n\n` +
      `💰 *Total Harga:* Rp ${parseInt(data.total_harga_sewa).toLocaleString(
        "id-ID"
      )}\n` +
      `📅 *Tanggal Kembali:* ${data.tanggal_kembali}\n` +
      `━━━━━━━━━━━━━━━━━\n\n` +
      `⚠️ Silakan cek dashboard untuk menyetujui atau menolak.`;

    sendWhatsAppNotification(ADMIN_WA, message).catch((err) =>
      console.error("⚠️ WA notification to admin failed:", err)
    );

    res.status(201).json({
      message: "Sewa dibawa pulang berhasil disimpan.",
      id: insertId,
    });
  } catch (error) {
    console.error("❌ Error create rental:", error);
    res.status(500).json({
      message: "Gagal menyimpan sewa.",
      error: error.message,
    });
  }
};

// ========== Controller Web Admin ===========
const setujuiSewa = async (req, res) => {
  try {
    const { id } = req.params;

    // Update status sewa
    await rentalModel.updateStatus(id, "disetujui");

    // Ambil data rental lengkap
    const rental = await rentalModel.getRentalById(id);

    if (!rental) {
      return res.status(404).json({ message: "Sewa tidak ditemukan" });
    }

    // Get PS info
    const [[psData]] = await db.execute(
      "SELECT nomor_ps FROM PS WHERE id_ps = ?",
      [rental.id_ps]
    );

    // Update status PS
    await db.execute(
      "UPDATE PS SET status_fisik = 'borrowed_out', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?",
      [rental.id_ps]
    );

    // Ambil data karyawan
    const [karyawanRows] = await db.execute(
      "SELECT nama_karyawan, no_wa FROM karyawan WHERE id_karyawan = ?",
      [rental.id_karyawan]
    );
    const karyawan = karyawanRows[0];

    // Ambil data cabang
    const [cabangRows] = await db.execute(
      "SELECT nama_cabang FROM cabang WHERE id_cabang = ?",
      [rental.id_cabang]
    );
    const cabang = cabangRows[0];

    // ✅ EMIT: Sewa Approved
    emitSewaBawaPulangApproved(rental.id_cabang, {
      id_sewa_bawa_pulang: parseInt(id),
      id_ps: rental.id_ps,
      nomor_ps: psData?.nomor_ps,
      status_sewa: "disetujui",
      nama_penyewa: rental.nama_penyewa,
    });

    // ✅ EMIT: Notification ke Karyawan
    emitNotification(rental.id_cabang, {
      type: "success",
      title: "Sewa Disetujui",
      message: `Sewa atas nama ${rental.nama_penyewa} telah disetujui`,
      data: { id_sewa_bawa_pulang: parseInt(id) },
    });

    // Kirim WhatsApp ke Karyawan
    if (karyawan && karyawan.no_wa) {
      const message =
        `✅ *SEWA DISETUJUI OLEH ADMIN*\n\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `Halo *${karyawan.nama_karyawan}*,\n\n` +
        `Permintaan sewa telah *DISETUJUI*.\n\n` +
        `📋 *Detail:*\n` +
        `• ID Sewa: #${rental.id_sewa_bawa_pulang}\n` +
        `• PS: ${psData?.nomor_ps || rental.id_ps}\n` +
        `• Penyewa: ${rental.nama_penyewa}\n` +
        `• Cabang: ${cabang?.nama_cabang || "-"}\n\n` +
        `⚠️ Silakan koordinasikan penyerahan PS.\n\n` +
        `Terima kasih! 🙏`;

      sendWhatsAppNotification(karyawan.no_wa, message).catch((err) =>
        console.error("⚠️ WA notification failed:", err)
      );
    }

    res.status(200).json({ message: "Sewa berhasil disetujui." });
  } catch (error) {
    console.error("❌ Gagal menyetujui sewa:", error);
    res.status(500).json({
      message: "Gagal menyetujui sewa.",
      error: error.message,
    });
  }
};

const tolakSewa = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔄 Menolak sewa ID: ${id}`);

    // Update status sewa
    await rentalModel.updateStatus(id, "ditolak");

    // Ambil data rental
    const rental = await rentalModel.getRentalById(id);

    if (!rental) {
      return res.status(404).json({ message: "Sewa tidak ditemukan" });
    }

    // Get PS info
    const [[psData]] = await db.execute(
      "SELECT nomor_ps FROM PS WHERE id_ps = ?",
      [rental.id_ps]
    );

    // Update status PS menjadi available
    await db.execute(
      "UPDATE PS SET status_fisik = 'available', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?",
      [rental.id_ps]
    );

    // Ambil data karyawan
    let karyawan = null;
    if (rental.id_karyawan) {
      const [karyawanRows] = await db.execute(
        "SELECT nama_karyawan, no_wa FROM KARYAWAN WHERE id_karyawan = ?",
        [rental.id_karyawan]
      );
      karyawan = karyawanRows[0];
    }

    // Ambil data cabang
    let cabang = null;
    if (rental.id_cabang) {
      const [cabangRows] = await db.execute(
        "SELECT nama_cabang FROM CABANG WHERE id_cabang = ?",
        [rental.id_cabang]
      );
      cabang = cabangRows[0];
    }

    // ✅ EMIT: PS Status Updated (kembali available)
    emitPsStatusUpdate(rental.id_cabang, {
      id_ps: rental.id_ps,
      nomor_ps: psData?.nomor_ps,
      status_fisik: "available",
      action: "sewa_bawa_pulang_ditolak",
    });

    // ✅ EMIT: Sewa Rejected
    emitSewaBawaPulangRejected(rental.id_cabang, {
      id_sewa_bawa_pulang: parseInt(id),
      id_ps: rental.id_ps,
      nomor_ps: psData?.nomor_ps,
      status_sewa: "ditolak",
      nama_penyewa: rental.nama_penyewa,
    });

    // ✅ EMIT: Notification ke Karyawan
    emitNotification(rental.id_cabang, {
      type: "error",
      title: "Sewa Ditolak",
      message: `Sewa atas nama ${rental.nama_penyewa} telah ditolak`,
      data: { id_sewa_bawa_pulang: parseInt(id) },
    });

    // Kirim WhatsApp ke Karyawan
    if (karyawan && karyawan.no_wa) {
      const message =
        `❌ *SEWA DITOLAK OLEH ADMIN*\n\n` +
        `━━━━━━━━━━━━━━━━━\n` +
        `Halo *${karyawan.nama_karyawan}*,\n\n` +
        `Permintaan sewa atas nama *${rental.nama_penyewa}* telah *DITOLAK*.\n\n` +
        `📋 *Detail:*\n` +
        `• ID Sewa: #${rental.id_sewa_bawa_pulang}\n` +
        `• PS: ${psData?.nomor_ps || rental.id_ps}\n` +
        `• Cabang: ${cabang?.nama_cabang || "-"}\n\n` +
        `Terima kasih! 🙏`;

      sendWhatsAppNotification(karyawan.no_wa, message).catch((err) =>
        console.error("⚠️ WA notification failed:", err)
      );
    }

    res.status(200).json({ message: "Sewa berhasil ditolak." });
  } catch (error) {
    console.error("❌ Error tolakSewa:", error);
    res.status(500).json({
      message: "Gagal menolak sewa.",
      error: error.message,
    });
  }
};

const completeSewa = async (req, res) => {
  try {
    const { id } = req.params;
    const { jam_terlambat, denda_keterlambatan, total_akhir } = req.body;

    // Cek foto upload
    if (!req.files || !req.files.foto_bukti_1 || !req.files.foto_bukti_2) {
      return res.status(400).json({
        message: "Harap upload 2 foto bukti penyerahan",
      });
    }

    const fotoBukti1 = req.files.foto_bukti_1[0];
    const fotoBukti2 = req.files.foto_bukti_2[0];

    // Get rental info
    const [rentalRows] = await rentalModel.getSewaById(id);
    if (!rentalRows.length) {
      return res.status(404).json({ message: "Sewa tidak ditemukan" });
    }

    const rental = rentalRows[0];

    // Get PS info
    const [[psData]] = await db.execute(
      "SELECT nomor_ps FROM PS WHERE id_ps = ?",
      [rental.id_ps]
    );

    // Complete sewa
    await rentalModel.completeSewa(
      id,
      jam_terlambat || 0,
      denda_keterlambatan || 0,
      total_akhir
    );

    // Update foto bukti
    await rentalModel.updateFotoBukti(
      id,
      fotoBukti1.filename,
      fotoBukti2.filename
    );

    // Update status PS ke available
    await db.execute(
      "UPDATE PS SET status_fisik = 'available', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?",
      [rental.id_ps]
    );

    // ✅ EMIT: PS Status Updated
    emitPsStatusUpdate(rental.id_cabang, {
      id_ps: rental.id_ps,
      nomor_ps: psData?.nomor_ps,
      status_fisik: "available",
      action: "sewa_bawa_pulang_selesai",
    });

    // ✅ EMIT: Sewa Completed
    emitSewaBawaPulangCompleted(rental.id_cabang, {
      id_sewa_bawa_pulang: parseInt(id),
      id_ps: rental.id_ps,
      nomor_ps: psData?.nomor_ps,
      status_sewa: "dikembalikan",
      nama_penyewa: rental.nama_penyewa,
      jam_terlambat: jam_terlambat || 0,
      denda_keterlambatan: denda_keterlambatan || 0,
      total_akhir,
    });

    res.json({
      message: "Pengembalian sewa berhasil dicatat",
      jam_terlambat: jam_terlambat || 0,
      denda_keterlambatan: denda_keterlambatan || 0,
      total_akhir,
    });
  } catch (err) {
    console.error("❌ Error complete sewa:", err);
    res.status(500).json({ message: err.message });
  }
};

// Other controllers...
const kembalikanSewa = async (req, res) => {
  try {
    const { id } = req.params;

    await rentalModel.updateStatus(id, "dikembalikan");

    const rental = await rentalModel.getRentalById(id);
    if (rental) {
      await db.execute(
        "UPDATE PS SET status_fisik = 'available', updated_at = CURRENT_TIMESTAMP WHERE id_ps = ?",
        [rental.id_ps]
      );

      emitPsStatusUpdate(rental.id_cabang, {
        id_ps: rental.id_ps,
        status_fisik: "available",
        action: "sewa_dikembalikan",
      });
    }

    res
      .status(200)
      .json({ message: "Sewa berhasil ditandai sebagai dikembalikan." });
  } catch (error) {
    res.status(500).json({
      message: "Gagal memproses pengembalian.",
      error: error.message,
    });
  }
};

const getActiveRentalByConsoleId = async (req, res) => {
  try {
    const { id_ps } = req.params;
    const rental = await rentalModel.getActiveRentalByConsoleId(id_ps);

    if (!rental) {
      return res.status(404).json({
        message: "Tidak ada sewa aktif pada PS ini.",
      });
    }

    res.status(200).json(rental);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data sewa.",
      error: error.message,
    });
  }
};

const getApprovedRentalsByBranch = async (req, res) => {
  try {
    const { id_cabang } = req.params;
    const [rows] = await rentalModel.getApprovedRentalsByBranch(id_cabang);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error get approved rentals:", err);
    res.status(500).json({ message: err.message });
  }
};

const listRentalsByStatus = async (req, res) => {
  try {
    const { status, id_cabang } = req.query;

    const allowedStatuses = [
      "menunggu persetujuan admin",
      "disetujui",
      "dikembalikan",
      "ditolak",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Status tidak valid." });
    }

    const rentals = await rentalModel.getRentalsByStatusAndBranch(
      status,
      id_cabang
    );

    res.status(200).json(rentals);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data sewa berdasarkan status.",
      error: error.message,
    });
  }
};

const getSewaList = async (req, res) => {
  try {
    const { status, tanggal, id_cabang } = req.query;

    let query = `SELECT * FROM Sewa_Dibawa_Pulang WHERE 1=1`;
    const params = [];

    if (status) {
      query += " AND status_sewa = ?";
      params.push(status);
    }

    if (tanggal) {
      query += " AND DATE(updated_at) = ?";
      params.push(tanggal);
    }

    if (id_cabang) {
      query += " AND id_cabang = ?";
      params.push(id_cabang);
    }

    query += " ORDER BY created_at DESC";

    const [result] = await db.execute(query, params);
    res.json(result);
  } catch (err) {
    console.error("🔥 ERROR getSewaList:", err);
    res.status(500).json({ message: "Gagal memuat data sewa dibawa pulang" });
  }
};

module.exports = {
  createRental,
  tolakSewa,
  kembalikanSewa,
  setujuiSewa,
  getApprovedRentalsByBranch,
  getActiveRentalByConsoleId,
  listRentalsByStatus,
  getSewaList,
  completeSewa,
};
