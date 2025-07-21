// 📁 routes/productRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const { authMiddleware } = require("../middleware/auth");

// ✅ Get all products (protected)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(400).send("Error fetching products: " + err);
  }
});

// ✅ Add new product (protected)
router.post("/", authMiddleware, async (req, res) => {
  const { name, code, stock, unit, color } = req.body;

  const newProduct = new Product({
    name,
    code,
    stock,
    unit,
    color,
  });

  try {
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).send("Error adding product: " + err);
  }
});

// ✅ Update product by ID (protected)
router.put("/:id", authMiddleware, async (req, res) => {
  const { name, code, stock, unit, color } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, code, stock, unit, color },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send("Product Not Found");
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).send("Error updating product: " + err);
  }
});

// ✅ Delete product by ID (protected)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).send("Produk tidak ditemukan");
    }

    res.json({ message: "Produk berhasil dihapus", product: deletedProduct });
  } catch (err) {
    res.status(400).send("Error deleting product: " + err);
  }
});

module.exports = router;
