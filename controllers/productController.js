let products = [];

const getAllProducts = (req, res) => {
  res.json(products);
};

const createProduct = (req, res) => {
  const { name, code, stock, unit, color } = req.body;

  const newProduct = {
    id: Date.now(), // simple ID, nanti diganti dengan DB
    name,
    code,
    stock: parseInt(stock),
    unit,
    color: color || "",
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
};

module.exports = {
  getAllProducts,
  createProduct,
};
