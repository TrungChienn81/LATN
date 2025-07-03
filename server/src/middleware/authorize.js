/**
 * Middleware để kiểm tra quyền truy cập dựa trên vai trò của người dùng.
 * @param {string[]} allowedRoles - Mảng các vai trò được phép truy cập.
 * @returns {Function} - Middleware function.
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    console.log(`🔐 Authorization check for role(s): ${allowedRoles} on path: ${req.originalUrl}`);
    console.log(`🔐 Auth header exists: ${!!req.headers.authorization}`);
    
    // Giả định rằng middleware xác thực (ví dụ: protect) đã chạy trước
    // và đã gắn thông tin người dùng (bao gồm vai trò) vào req.user
    if (!req.user || !req.user.role) {
      console.log('❌ Authorization failed: No user or role information');
      // Nếu không có thông tin người dùng hoặc vai trò, coi như chưa xác thực đầy đủ
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User information not available. Please login again.'
      });
    }

    const { role } = req.user; // Lấy vai trò của người dùng hiện tại
    console.log(`🔐 User role: ${role}, Required roles: ${allowedRoles}`);

    if (allowedRoles.includes(role)) {
      // Nếu vai trò của người dùng nằm trong danh sách các vai trò được phép
      console.log(`✅ Authorization successful: ${role} has access to ${req.originalUrl}`);
      next(); // Cho phép tiếp tục xử lý request
    } else {
      // Nếu vai trò không được phép
      console.log(`❌ Authorization denied: ${role} does not have permission for ${req.originalUrl}`);
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource.'
      });
    }
  };
};

module.exports = authorize;