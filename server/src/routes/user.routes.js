const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');

const protect = require('../middleware/protect'); // Middleware xác thực
const authorize = require('../middleware/authorize'); // Middleware phân quyền

// Tất cả các route dưới đây đều yêu cầu đăng nhập (protect) và quyền admin (authorize(['admin']))

// GET /api/users - Lấy tất cả người dùng
router.get('/', protect, authorize(['admin']), getAllUsers);

// GET /api/users/:id - Lấy một người dùng bằng ID
router.get('/:id', protect, authorize(['admin']), getUserById);

// PUT /api/users/:id - Cập nhật thông tin người dùng (ví dụ: vai trò, trạng thái)
router.put('/:id', protect, authorize(['admin']), updateUser);

// DELETE /api/users/:id - Xóa người dùng
router.delete('/:id', protect, authorize(['admin']), deleteUser);

module.exports = router; 