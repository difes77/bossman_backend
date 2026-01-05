const authModel = require("../models/authModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password, deviceToken } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi" });
    }

    const user = await authModel.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    if (user.role !== "karyawan") {
      return res
        .status(403)
        .json({ message: "Akses ditolak, hanya untuk karyawan" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    if (deviceToken) {
      await authModel.saveDeviceToken(user.user_id, deviceToken);
    }

    res.json({
      message: "Login berhasil",
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        nama_karyawan: user.nama_karyawan,
        id_karyawan: user.id_karyawan,
        id_cabang: user.id_cabang,
        nama_cabang: user.nama_cabang,
        role: user.role,
        no_wa: user.no_wa,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat login" });
  }
};

exports.loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi" });
    }

    const user = await authModel.findOwnerByEmail(email);
    if (!user)
      return res.status(404).json({ message: "Owner tidak ditemukan" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Password salah" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login berhasil",
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Owner error:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat login owner" });
  }
};

exports.registerOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await authModel.createUser({
      email,
      password: hashedPassword,
      role: "owner",
      id_karyawan: null,
    });

    res.status(201).json({ message: "Owner berhasil didaftarkan" });
  } catch (error) {
    console.error("Register Owner error:", error);
    res.status(500).json({ message: "Gagal mendaftarkan owner" });
  }
};

exports.registerKaryawan = async (req, res) => {
  try {
    const { email, password, id_karyawan } = req.body;

    if (!email || !password || !id_karyawan) {
      return res
        .status(400)
        .json({ message: "Email, password, dan id_karyawan wajib diisi" });
    }

    // 🔍 Cek apakah id_karyawan sudah digunakan
    const existingUser = await authModel.findUserByKaryawanId(id_karyawan);
    if (existingUser) {
      return res.status(400).json({
        message: "Karyawan ini sudah memiliki akun",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await authModel.createUser({
      email,
      password: hashedPassword,
      role: "karyawan",
      id_karyawan,
    });

    res.status(201).json({ message: "Karyawan berhasil didaftarkan" });
  } catch (error) {
    console.error("Register Karyawan error:", error);
    res.status(500).json({ message: "Gagal mendaftarkan karyawan" });
  }
};

exports.checkKaryawanHasAccount = async (req, res) => {
  const { id_karyawan } = req.params;
  const user = await authModel.findUserByKaryawanId(id_karyawan);
  res.json({ hasAccount: !!user });
};
