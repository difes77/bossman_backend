const db = require("../config/db");

const karyawanModel = require("../models/karyawanModel");

exports.getAllKaryawan = async (req, res) => {
  try {
    const data = await karyawanModel.getAll();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data karyawan" });
  }
};
exports.getKaryawanByCabang = async (req, res) => {
  try {
    const { idCabang } = req.params;
    const [rows] = await db.execute(
      "SELECT id_karyawan, nama_karyawan FROM karyawan WHERE id_cabang = ?",
      [idCabang]
    );
    res.json(rows);
  } catch (err) {
    console.error("🔥 Error getKaryawanByCabang:", err);
    res.status(500).json({ message: "Gagal mengambil data karyawan" });
  }
};
exports.createKaryawan = async (req, res) => {
  try {
    const { nama_karyawan, no_wa, alamat, id_cabang, foto_ktp } = req.body;
    if (!nama_karyawan || !id_cabang) {
      return res.status(400).json({ message: "Nama dan cabang wajib diisi" });
    }

    const result = await karyawanModel.create({
      nama_karyawan,
      no_wa,
      alamat,
      id_cabang,
      foto_ktp,
    });

    res.status(201).json({
      message: "Karyawan berhasil ditambahkan",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambahkan karyawan" });
  }
};

exports.updateKaryawan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_karyawan, no_wa, alamat, id_cabang, foto_ktp } = req.body;

    await karyawanModel.update(id, {
      nama_karyawan,
      no_wa,
      alamat,
      id_cabang,
      foto_ktp,
    });

    res.json({ message: "Karyawan berhasil diperbarui" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memperbarui data karyawan" });
  }
};

exports.deleteKaryawan = async (req, res) => {
  try {
    const { id } = req.params;

    await karyawanModel.delete(id);
    res.json({ message: "Karyawan berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menghapus karyawan" });
  }
};

exports.getKaryawanTanpaAkun = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT k.id_karyawan, k.nama_karyawan
      FROM Karyawan k
      LEFT JOIN User u ON k.id_karyawan = u.id_karyawan
      WHERE u.id_karyawan IS NULL
    `);
    res.json(rows);
  } catch (error) {
    console.error("Gagal ambil karyawan tanpa akun:", error);
    res.status(500).json({ message: "Gagal ambil data" });
  }
};
