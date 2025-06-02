// src/middleware/auth.middleware.js

/*
 * ROLE HIERARCHY & PRIVILEGES:
 * 
 * 🛒 customer: Có thể mua sản phẩm, xem products, thêm vào cart, tạo orders
 * 🏪 seller: Có TẤT CẢ quyền của customer + quản lý shop riêng (CRUD products, view shop analytics)
 * 👑 admin: Có TẤT CẢ quyền + quản lý toàn hệ thống (user management, shop management, system settings)
 * 
 * LƯU Ý: Khi user tạo shop → role chuyển từ customer thành seller
 * Seller vẫn giữ đầy đủ chức năng mua hàng như customer!
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { promisify } = require('util');

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.' 
            });
        }

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ 
                success: false, 
                message: 'Người dùng của token này không còn tồn tại.' 
            });
        }

        req.user = currentUser;
        next();

    } catch (error) {
        console.error('!!! ERROR in protect middleware:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Xác thực thất bại.' 
        });
    }
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này.'
            });
        }
        next();
    };
};