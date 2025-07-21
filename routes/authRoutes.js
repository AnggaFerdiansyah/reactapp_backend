const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { authMiddleware, authorizeAdmin } = require("../middleware/auth");

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
    console.error(err);
    res.status(500).json({ error: "❌ Gagal login" });
  }
});

// Get User
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
// Delete User
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

// Change Role
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

module.exports = router;
