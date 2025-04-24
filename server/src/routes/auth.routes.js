// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); // Import controller

// POST /api/auth/register
router.post('/register', authController.register); // Gọi hàm register

// POST /api/auth/login
router.post('/login', authController.login); // Gọi hàm login

module.exports = router;