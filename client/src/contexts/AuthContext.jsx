// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; // Import axios instance
import { useNavigate } from 'react-router-dom'; // Import useNavigate nếu muốn xử lý chuyển hướng trong context

// 1. Tạo Context
const AuthContext = createContext(null);

// 2. Tạo Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // Ban đầu là true để check token
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    }
    setLoading(false); // Kết thúc kiểm tra token
  }, []);

  // --- Các Hàm Hành Động ---

  // Hàm Đăng nhập
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.success) {
        const { token: newToken, data } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setToken(newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setIsAuthenticated(true);
        setLoading(false);
        // navigate('/'); // Điều hướng có thể xử lý ở component gọi login
        return { success: true, user: data.user };
      } else {
        setLoading(false);
        return { success: false, message: response.data.message || 'Đăng nhập thất bại' };
      }
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error.response?.data?.message || error.message);
      return { success: false, message: error.response?.data?.message || 'Lỗi server khi đăng nhập' };
    }
  };

  // Hàm Đăng xuất
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    navigate('/login'); // Điều hướng về trang login sau khi logout
  };

   // Hàm Đăng ký (không tự động đăng nhập sau khi đăng ký)
   const register = async (userData) => {
     setLoading(true);
     try {
       const response = await api.post('/auth/register', userData);
       setLoading(false);
       return response.data; // { success: true/false, message: '...' }
     } catch (error) {
       setLoading(false);
       console.error('Register error:', error.response?.data?.message || error.message);
       return { success: false, message: error.response?.data?.message || 'Lỗi server khi đăng ký' };
     }
   };


  // Giá trị cung cấp bởi Context
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    setUser, // Có thể cần để cập nhật user từ nơi khác (ví dụ: profile update)
    setToken,
    setIsAuthenticated
  };

  // Render Provider với giá trị context
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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

export default AuthContext;