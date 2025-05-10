// routes/product.routes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware'); // Đảm bảo auth.middleware có restrictTo
const upload = require('../middleware/upload.middleware'); // Thêm middleware upload

// Public routes - no authentication needed
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Protected routes with role-based authorization
router.post(
    '/',
    protect,
    restrictTo('seller', 'admin'), // Chỉ seller và admin có thể tạo sản phẩm đơn lẻ
    upload.array('images', 10), // Cho phép upload tối đa 10 ảnh với field name là 'images'
    productController.createProduct
);

// Route để xóa tất cả sản phẩm - đặt TRƯỚC route '/:id' để tránh nhầm lẫn
router.delete(
    '/delete-all',
    protect,
    restrictTo('admin'), // Chỉ admin có quyền xóa tất cả sản phẩm
    productController.deleteAllProducts
);

router.put(
    '/:id',
    protect,
    restrictTo('seller', 'admin'), // Seller sở hữu hoặc admin có thể cập nhật
    upload.array('images', 10), // Cho phép upload tối đa 10 ảnh với field name là 'images'
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