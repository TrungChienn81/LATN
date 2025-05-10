const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Đường dẫn tới User model

/**
 * Middleware để bảo vệ routes, yêu cầu người dùng phải đăng nhập (có token hợp lệ).
 * Gắn thông tin người dùng đã xác thực vào req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Kiểm tra xem token có trong header Authorization không và có đúng định dạng 'Bearer token' không
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Lấy token từ header (bỏ phần 'Bearer ')
      token = req.headers.authorization.split(' ')[1];

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm người dùng dựa trên ID trong token và loại bỏ trường password
      // Đảm bảo JWT_SECRET trong .env đã được định nghĩa và khớp với lúc tạo token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User not found for this token. The user may have been deleted.'
        });
      }

      next(); // Người dùng hợp lệ, tiếp tục
    } catch (error) {
      console.error('Token verification error:', error.message);
      // Các lỗi có thể xảy ra: TokenExpiredError, JsonWebTokenError, NotBeforeError
      let message = 'Unauthorized: Invalid token.';
      if (error.name === 'TokenExpiredError') {
        message = 'Unauthorized: Token has expired. Please login again.';
      }
      return res.status(401).json({ success: false, message });
    }
  }

  if (!token) {
    // Nếu không có token trong header
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided. Access denied.'
    });
  }
};

module.exports = protect;