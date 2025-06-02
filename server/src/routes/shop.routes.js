// src/routes/shop.routes.js
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const productController = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware'); // Middleware upload file

// CÁC ROUTE CHO SELLER (NGƯỜI BÁN)

// Tạo shop mới
router.post(
    '/',
    protect, // Chỉ cần đăng nhập
    shopController.createShop
);

// Lấy thông tin shop của mình
router.get(
    '/my-shop',
    protect, 
    shopController.getMyShop
);

// Lấy sản phẩm của shop mình
router.get(
    '/my-shop/products',
    protect,
    shopController.getMyShopProducts
);

// Fix user role thành seller nếu có shop
router.post(
    '/fix-role',
    protect,
    shopController.fixUserRole
);

// Tạo sản phẩm mới cho shop mình
router.post(
    '/my-shop/products',
    protect,
    upload.array('images', 5),
    shopController.createShopProduct
);

// Cập nhật shop của mình
router.put(
    '/:id',
    protect,
    shopController.checkShopOwnership,
    upload.fields([
        { name: 'logo', maxCount: 1 },
        { name: 'banner', maxCount: 1 }
    ]),
    shopController.updateShop
);

// CÁC ROUTE CHUNG (CÔNG KHAI)

// Lấy danh sách shops
router.get('/', shopController.getAllShops);

// Lấy shop theo ID
router.get('/:id', shopController.getShopById);

// Lấy shop theo owner ID
router.get('/owner/:userId', shopController.getShopByOwnerId);

module.exports = router;