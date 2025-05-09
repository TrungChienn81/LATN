// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); // Import controller

// POST /api/auth/register - Đăng ký user thông thường
router.post('/register', authController.register);

// POST /api/auth/login - Đăng nhập user
router.post('/login', authController.login);

// POST /api/auth/register-admin - Đăng ký admin (có bảo vệ bằng secret key trong controller)
router.post('/register-admin', authController.registerAdmin);

module.exports = router;