// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; // Import axios instance
import { useNavigate } from 'react-router-dom'; // Import useNavigate nếu muốn xử lý chuyển hướng trong context

// 1. Tạo Context
const AuthContext = createContext();

// 2. Tạo Provider Component
export const AuthProvider = ({ children }) => {
  // State lưu trữ thông tin xác thực
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('token') || null, // Lấy token từ localStorage nếu có
    user: JSON.parse(localStorage.getItem('user')) || null, // Lấy user từ localStorage nếu có
    isAuthenticated: !!localStorage.getItem('token'), // Xác định trạng thái đăng nhập ban đầu
    isLoading: false, // Không cần isLoading nữa vì đã check ở trên
    error: null,
  });

  // --- Các Hàm Hành Động ---

  // Hàm Đăng nhập
  const login = async (email, password) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.success) {
        const { token, data: { user } } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setAuthState({
          token: token,
          user: user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        // Có thể return true để báo thành công cho component gọi nó
        return true;
      } else {
        // Xử lý trường hợp success: false từ backend
        const errorMsg = response.data.message || 'Đăng nhập thất bại.';
        setAuthState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
        return false;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Email hoặc mật khẩu không đúng hoặc lỗi server.';
      console.error("AuthContext Login Error:", err);
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
       return false; // Báo lỗi
    }
  };

  // Hàm Đăng xuất
  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    // Không cần navigate ở đây, component gọi logout sẽ tự navigate nếu cần
    // window.location.pathname = '/login'; // Hoặc dùng navigate nếu truyền vào
  };

   // Hàm Đăng ký (không tự động đăng nhập sau khi đăng ký)
   const register = async (userData) => {
     setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
     try {
       const dataToSubmit = { ...userData };
       delete dataToSubmit.confirmPassword; // Xóa confirmPassword trước khi gửi
       const response = await api.post('/auth/register', dataToSubmit);
       setAuthState(prev => ({ ...prev, isLoading: false })); // Đặt lại loading
       return response.data; // Trả về response để component xử lý (vd: thông báo thành công)
     } catch (err) {
       const errorMsg = err.response?.data?.message || 'Lỗi đăng ký.';
       console.error("AuthContext Register Error:", err);
       setAuthState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
       throw err; // Ném lỗi ra để component bắt được nếu cần
     }
   };


  // Giá trị cung cấp bởi Context
  const value = {
    authState,
    login,
    logout,
    register,
    setAuthState // Có thể cần để cập nhật user info sau này mà không cần login lại
  };

  // Render Provider với giá trị context
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Tạo Custom Hook để sử dụng Context dễ dàng hơn
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};