// src/routes/cart.routes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller'); // Sẽ tạo file này
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Áp dụng protect cho tất cả các route trong file này vì giỏ hàng là của user đã đăng nhập
router.use(protect);
// Optional: Nếu bạn muốn chỉ customer mới thao tác được giỏ hàng thì thêm restrictTo
// router.use(restrictTo('customer')); // Hoặc có thể check role cụ thể trong từng controller nếu cần linh hoạt hơn

/*
 * @route   GET /api/cart
 * @desc    Lấy giỏ hàng của user đang đăng nhập
 * @access  Private (Customer)
 */
router.get('/', cartController.getCart);

/*
 * @route   POST /api/cart/items
 * @desc    Thêm một sản phẩm vào giỏ hàng (hoặc cập nhật số lượng nếu đã có)
 * @access  Private (Customer)
 */
router.post('/items', cartController.addItemToCart);

/*
 * @route   PUT /api/cart/items/:productId
 * @desc    Cập nhật số lượng của một sản phẩm trong giỏ hàng
 * @access  Private (Customer)
 */
router.put('/items/:productId', cartController.updateCartItem);

/*
 * @route   DELETE /api/cart/items/:productId
 * @desc    Xóa một sản phẩm khỏi giỏ hàng
 * @access  Private (Customer)
 */
router.delete('/items/:productId', cartController.removeCartItem);

/*
 * @route   DELETE /api/cart
 * @desc    Xóa sạch tất cả sản phẩm trong giỏ hàng (Optional)
 * @access  Private (Customer)
 */
router.delete('/', cartController.clearCart);


module.exports = router;