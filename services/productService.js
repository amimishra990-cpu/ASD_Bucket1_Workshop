const productDatabase = require('../database/productDatabase');

function getProducts() {
  return productDatabase.getAll();
}

function getProductById(id) {
  return getProducts().find((product) => product.id === Number(id));
}

function createProduct(productData) {
  const products = getProducts();
  const id = products.reduce((largestId, product) => Math.max(largestId, product.id), 0) + 1;
  const product = { ...productData, id };

  products.push(product);
  productDatabase.save(products);
  return product;
}

function updateProduct(id, productData, replace = false) {
  const products = getProducts();
  const productIndex = products.findIndex((product) => product.id === Number(id));

  if (productIndex === -1) return null;

  const currentProduct = products[productIndex];
  const updatedProduct = replace
    ? { ...productData, id: currentProduct.id }
    : { ...currentProduct, ...productData, id: currentProduct.id };

  products[productIndex] = updatedProduct;
  productDatabase.save(products);
  return updatedProduct;
}

function deleteProduct(id) {
  const products = getProducts();
  const productIndex = products.findIndex((product) => product.id === Number(id));

  if (productIndex === -1) return null;

  const [deletedProduct] = products.splice(productIndex, 1);
  productDatabase.save(products);
  return deletedProduct;
}

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };