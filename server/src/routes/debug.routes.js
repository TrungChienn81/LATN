// src/routes/debug.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/protect');

// Route kiểm tra token (dành cho debug)
router.get('/check-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token trong header',
                headers: req.headers,
                authorization: authHeader ? 'Có header Authorization' : 'Không có header Authorization'
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ (format không đúng)'
            });
        }
        
        try {
            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Kiểm tra user trong db
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token hợp lệ nhưng không tìm thấy user tương ứng',
                    decodedToken: {
                        id: decoded.id,
                        iat: decoded.iat,
                        exp: decoded.exp
                    }
                });
            }
            
            // Thông tin về token và user
            return res.status(200).json({
                success: true,
                message: 'Token hợp lệ',
                tokenInfo: {
                    id: decoded.id,
                    iat: decoded.iat,
                    exp: decoded.exp,
                    expiresIn: new Date(decoded.exp * 1000).toLocaleString(),
                    isExpired: Date.now() > decoded.exp * 1000
                },
                user: {
                    id: user._id,
                    name: user.firstName + ' ' + user.lastName,
                    email: user.email,
                    role: user.role,
                    isAdmin: user.role === 'admin'
                }
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn',
                error: error.name,
                errorMessage: error.message
            });
        }
    } catch (error) {
        console.error('Debug route error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi kiểm tra token',
            error: error.message
        });
    }
});

// Route kiểm tra middleware protect
router.get('/check-auth', protect, (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Xác thực middleware thành công',
        user: {
            id: req.user._id,
            name: req.user.firstName + ' ' + req.user.lastName,
            email: req.user.email,
            role: req.user.role,
            isAdmin: req.user.role === 'admin'
        }
    });
});

module.exports = router;
