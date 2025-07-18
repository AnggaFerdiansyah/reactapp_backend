const mongoose = require("mongoose");

// Definisi schema untuk Produk
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Membuat model dari schema di atas
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
