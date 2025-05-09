// routes/product.routes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware'); // Đảm bảo auth.middleware có restrictTo

// Public routes - no authentication needed
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes with role-based authorization
router.post(
    '/',
    protect,
    restrictTo('seller'), // Chỉ seller có thể tạo sản phẩm đơn lẻ
    productController.createProduct
);

router.put(
    '/:id',
    protect,
    restrictTo('seller'), // Chỉ seller sở hữu sản phẩm mới có thể cập nhật
    productController.updateProduct
);

router.delete(
    '/:id',
    protect,
    restrictTo('seller', 'admin'), // Seller sở hữu hoặc admin có thể xóa
    productController.deleteProduct
);

// THÊM ROUTE NÀY CHO CHỨC NĂNG IMPORT
router.post(
    '/import',
    protect,
    restrictTo('admin'), // Chỉ admin có thể import hàng loạt
    productController.importProducts // Hàm này chúng ta sẽ thêm vào controller
);

module.exports = router;