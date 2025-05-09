/**
 * Middleware để kiểm tra quyền truy cập dựa trên vai trò của người dùng.
 * @param {string[]} allowedRoles - Mảng các vai trò được phép truy cập.
 * @returns {Function} - Middleware function.
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Giả định rằng middleware xác thực (ví dụ: protect) đã chạy trước
    // và đã gắn thông tin người dùng (bao gồm vai trò) vào req.user
    if (!req.user || !req.user.role) {
      // Nếu không có thông tin người dùng hoặc vai trò, coi như chưa xác thực đầy đủ
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User information not available. Please login again.'
      });
    }

    const { role } = req.user; // Lấy vai trò của người dùng hiện tại

    if (allowedRoles.includes(role)) {
      // Nếu vai trò của người dùng nằm trong danh sách các vai trò được phép
      next(); // Cho phép tiếp tục xử lý request
    } else {
      // Nếu vai trò không được phép
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource.'
      });
    }
  };
};

module.exports = authorize; 