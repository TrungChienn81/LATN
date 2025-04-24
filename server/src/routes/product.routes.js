// routes/product.routes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Public routes - no authentication needed
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes with role-based authorization
router.post(
    '/',
    protect,
    restrictTo('seller'),
    productController.createProduct
);

router.put(
    '/:id',
    protect,
    restrictTo('seller'),
    productController.updateProduct
);

router.delete(
    '/:id',
    protect,
    restrictTo('seller', 'admin'),
    productController.deleteProduct
);

module.exports = router;