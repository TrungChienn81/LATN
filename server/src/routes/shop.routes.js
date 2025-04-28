// src/routes/shop.routes.js
const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller'); // Sẽ tạo file này ở bước sau
const { protect, restrictTo } = require('../middleware/auth.middleware'); // Import middleware

/*
 * @route   POST /api/shops
 * @desc    Seller tạo gian hàng mới của họ
 * @access  Private (Seller)
 */
router.post(
    '/',
    protect, // Yêu cầu đăng nhập
    restrictTo('seller'), // Chỉ user có role 'seller' mới được truy cập
    shopController.createShop // Hàm xử lý logic (sẽ tạo ở bước sau)
);

// TODO: Thêm các routes khác cho Shop sau này:
// router.get('/my-shop', protect, restrictTo('seller'), shopController.getMyShop); // Seller xem thông tin shop của mình
// router.put('/my-shop', protect, restrictTo('seller'), shopController.updateMyShop); // Seller cập nhật shop của mình
// router.get('/:shopId', shopController.getShopById); // Lấy thông tin shop công khai bằng ID (cho khách xem)

module.exports = router;