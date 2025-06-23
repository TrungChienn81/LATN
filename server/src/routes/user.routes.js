const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword,
  getUserOrders,
  getUserWishlist,
  addToWishlist,
  removeFromWishlist
} = require('../controllers/user.controller');

const protect = require('../middleware/protect'); // Middleware xác thực
const authorize = require('../middleware/authorize'); // Middleware phân quyền
const { protect: auth, restrictTo } = require('../middleware/auth.middleware');

// Tất cả các route dưới đây đều yêu cầu đăng nhập (protect) và quyền admin (authorize(['admin']))

// GET /api/users - Lấy tất cả người dùng
router.get('/', protect, authorize(['admin']), getAllUsers);

// GET /api/users/:id - Lấy một người dùng bằng ID
router.get('/:id', protect, authorize(['admin']), getUserById);

// PUT /api/users/:id - Cập nhật thông tin người dùng (ví dụ: vai trò, trạng thái)
router.put('/:id', protect, authorize(['admin']), updateUser);

// DELETE /api/users/:id - Xóa người dùng
router.delete('/:id', protect, authorize(['admin']), deleteUser);

// Admin routes (require admin authentication)
router.get('/admin/:id', auth, restrictTo('admin'), getUserById);
router.put('/admin/:id', auth, restrictTo('admin'), updateUser);
router.delete('/admin/:id', auth, restrictTo('admin'), deleteUser);

// User profile routes (require user authentication)
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);

// User orders routes
router.get('/orders', auth, getUserOrders);

// User wishlist routes
router.get('/wishlist', auth, getUserWishlist);
router.post('/wishlist', auth, addToWishlist);
router.delete('/wishlist/:productId', auth, removeFromWishlist);

module.exports = router; 