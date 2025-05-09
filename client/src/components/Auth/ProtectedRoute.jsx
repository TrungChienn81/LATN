import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  CircularProgress,
  Typography,
  Container
} from '@mui/material';

/**
 * Component để bảo vệ route.
 * - Nếu chưa đăng nhập, điều hướng đến /login.
 * - Nếu có yêu cầu vai trò (allowedRoles) và user không có vai trò đó, điều hướng đến /unauthorized (hoặc trang chủ).
 * @param {object} props
 * @param {React.ReactNode} props.children - (Không dùng trực tiếp, Outlet sẽ render element của Route)
 * @param {string[]} [props.allowedRoles] - Mảng các vai trò được phép truy cập.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation(); // Để lưu lại trang người dùng muốn vào trước khi bị điều hướng

  if (loading) {
    // Hiển thị loading indicator trong khi AuthContext đang kiểm tra trạng thái xác thực ban đầu
    return (
      <Container maxWidth="xs" sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải...</Typography>
      </Container>
    );
  }

  if (!isAuthenticated) {
    // Nếu người dùng chưa đăng nhập, điều hướng đến trang login
    // state={{ from: location }} để sau khi login có thể quay lại trang trước đó
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    // Nếu có yêu cầu về vai trò
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      // Nếu không có thông tin user, không có vai trò, hoặc vai trò không được phép
      // Điều hướng đến trang "Không có quyền" hoặc trang chủ
      // Tạm thời điều hướng về trang chủ nếu không có quyền
      // Sau này có thể tạo trang /unauthorized riêng
      console.warn(`User role '${user?.role}' is not in allowedRoles: [${allowedRoles.join(', ')}] for path ${location.pathname}`);
      return <Navigate to="/" state={{ unauthorizedFrom: location }} replace />;
      // Hoặc: return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  // Nếu đã đăng nhập và có quyền (nếu được yêu cầu), render component con
  return <Outlet />; // Outlet sẽ render element được định nghĩa trong Route
};

export default ProtectedRoute; 