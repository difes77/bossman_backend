const cabangModel = require("../models/cabangModel");

exports.getAllCabang = async (req, res) => {
  try {
    const { include_inactive } = req.query;
    const cabang = await cabangModel.getAll(include_inactive === "true");
    res.json(cabang);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data cabang",
      error: err.message,
    });
  }
};

exports.createCabang = async (req, res) => {
  try {
    const { nama_cabang, alamat } = req.body;
    if (!nama_cabang) {
      return res.status(400).json({ message: "Nama cabang wajib diisi" });
    }

    const result = await cabangModel.create({ nama_cabang, alamat });
    res.status(201).json({
      message: "Cabang berhasil ditambahkan",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal menambahkan cabang",
      error: err.message,
    });
  }
};

exports.updateCabang = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_cabang, alamat, status } = req.body;

    await cabangModel.update(id, { nama_cabang, alamat, status });
    res.json({ message: "Cabang berhasil diupdate" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengupdate cabang",
      error: err.message,
    });
  }
};

exports.deleteCabang = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    if (permanent === "true") {
      // Hard delete (hanya untuk emergency)
      try {
        await cabangModel.hardDelete(id);
        res.json({ message: "Cabang berhasil dihapus permanen" });
      } catch (err) {
        if (err.message.includes("masih memiliki data terkait")) {
          return res.status(400).json({
            message: "Cabang tidak dapat dihapus",
            error: err.message,
            suggestion:
              "Gunakan soft delete atau hapus data terkait terlebih dahulu",
          });
        }
        throw err;
      }
    } else {
      // Soft delete (default & recommended)
      await cabangModel.softDelete(id);
      res.json({ message: "Cabang berhasil dinonaktifkan" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal menghapus cabang",
      error: err.message,
    });
  }
};

// Restore cabang yang sudah dinonaktifkan
exports.restoreCabang = async (req, res) => {
  try {
    const { id } = req.params;
    await cabangModel.update(id, { status: "aktif" });
    res.json({ message: "Cabang berhasil diaktifkan kembali" });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal restore cabang",
      error: err.message,
    });
  }
};
