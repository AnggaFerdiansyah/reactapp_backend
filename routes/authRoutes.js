const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UAParser = require("ua-parser-js");
const User = require("../models/user");
const Session = require("../models/session");
const { authMiddleware, authorizeAdmin } = require("../middleware/auth");

// ✅ Register User
router.post("/register", async (req, res) => {
  const { name, username, password, role = "staff" } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "Username sudah digunakan" });

    const newUser = new User({ name, username, password, role });
    await newUser.save();

    res.status(201).json({ message: "✅ User berhasil didaftarkan" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Gagal daftar user" });
  }
});

// ✅ Login + Simpan Session
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ error: "Username tidak ditemukan" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Password salah" });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Ambil IP Address
    let ip =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip;

    if (ip?.startsWith("::ffff:")) ip = ip.replace("::ffff:", "");
    else if (ip === "::1") ip = "127.0.0.1";

    // ✅ Parsing User Agent
    const rawUserAgent = req.get("User-Agent") || "Unknown";
    const parser = new UAParser(rawUserAgent);
    const deviceInfo = parser.getDevice(); // { vendor, model, type }

    let deviceName = "Unknown Device";
    if (deviceInfo.vendor || deviceInfo.model) {
      deviceName = `${deviceInfo.vendor || ""} ${
        deviceInfo.model || ""
      }`.trim();
    } else {
      const os = parser.getOS();
      deviceName = os.name || "Unknown Device";
    }

    // ✅ Simpan session login
    await Session.create({
      user: user._id,
      ipAddress: ip,
      device: deviceName,
      loginTime: new Date(),
      token,
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error saat login:", err);
    res.status(500).json({ error: "❌ Gagal login" });
  }
});

// ✅ Get Semua User (admin only)
router.get(
  "/users/all",
  authMiddleware,
  authorizeAdmin("admin"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "❌ Gagal mengambil data user" });
    }
  }
);

// ✅ Delete User (admin only)
router.delete(
  "/users/:id",
  authMiddleware,
  authorizeAdmin("admin"),
  async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: "✅ User berhasil dihapus" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "❌ Gagal menghapus user" });
    }
  }
);

// ✅ Ubah Role User (admin only)
router.put(
  "/users/:id/role",
  authMiddleware,
  authorizeAdmin("admin"),
  async (req, res) => {
    const { role } = req.body;

    if (!["admin", "staff", "user"].includes(role)) {
      return res.status(400).json({ error: "❌ Role tidak valid" });
    }

    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select("-password");

      if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

      res.json({ message: "✅ Role user berhasil diubah", user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "❌ Gagal mengubah role user" });
    }
  }
);

// ✅ Get Semua Session Login (admin only)
router.get(
  "/sessions",
  authMiddleware,
  authorizeAdmin("admin"),
  async (req, res) => {
    try {
      const sessions = await Session.find()
        .populate("user", "name username role")
        .sort({ loginTime: -1 });

      const formatted = sessions.map((s) => ({
        _id: s._id,
        name: s.user?.name || "-",
        username: s.user?.username || "-",
        role: s.user?.role || "-",
        ip: s.ipAddress || "-",
        device: s.device || "-",
        timestamp: s.loginTime || "-",
      }));

      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "❌ Gagal mengambil data session" });
    }
  }
);

module.exports = router;
