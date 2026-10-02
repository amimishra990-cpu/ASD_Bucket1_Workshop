const express = require('express');
const productController = require('../controllers/productController');
const { cacheGet } = require('../middleware/cacheMiddleware');

const router = express.Router();

router.get('/', cacheGet, productController.getProducts);
router.get('/:id', cacheGet, productController.getProductById);
router.post('/', productController.createProduct);
router.put('/:id', (req, res) => productController.updateProduct(req, res, true));
router.patch('/:id', (req, res) => productController.updateProduct(req, res));
router.delete('/:id', productController.deleteProduct);

module.exports = router;