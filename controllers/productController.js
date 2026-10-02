const productService = require('../services/productService');
const { clearCache } = require('../middleware/cacheMiddleware');

function getProducts(req, res) {
  res.json(productService.getProducts());
}

function getProductById(req, res) {
  const product = productService.getProductById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  res.json(product);
}

function createProduct(req, res) {
  const product = productService.createProduct(req.body || {});
  clearCache();
  res.status(201).json(product);
}

function updateProduct(req, res, replace = false) {
  const product = productService.updateProduct(req.params.id, req.body || {}, replace);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  clearCache();
  res.json(product);
}

function deleteProduct(req, res) {
  const product = productService.deleteProduct(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  clearCache();
  res.json(product);
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};