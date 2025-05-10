// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material'; // <<< Không cần Container ở đây nữa
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Import Layout Components
import PublicLayout from './components/Layout/PublicLayout'; // <<< Import PublicLayout
import AdminLayout from './components/Layout/AdminLayout';   // <<< Import AdminLayout
// import Navbar from './components/Layout/Navbar'; // Không cần import trực tiếp nữa
// import Footer from './components/Layout/Footer'; // Không cần import trực tiếp nữa

// Import Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOverview from './components/Admin/AdminOverview';
import AdminUserManagement from './components/Admin/UserManagement/AdminUserManagement';
import AdminProductManagement from './components/Admin/ProductManagement/AdminProductManagement';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryManagement from './components/Admin/CategoryManagement'; // <<< Import mới
import BrandManagement from './components/Admin/BrandManagement'; // <<< Import mới

function App() {
  return (
    <AuthProvider>
      <CssBaseline /> {/* CssBaseline có thể để ở đây hoặc trong từng Layout */} 
      <Routes>
        {/* Public Routes - Sử dụng PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Các trang public khác */} 
        </Route>

        {/* Admin Routes - Sử dụng AdminLayout và ProtectedRoute */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />}>
              {/* Nested routes bên trong AdminDashboardPage */}
              <Route index element={<Navigate to="overview" replace />} /> 
              <Route path="overview" element={<AdminOverview />} />
              <Route path="users" element={<AdminUserManagement />} />
              <Route path="products" element={<AdminProductManagement />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="brands" element={<BrandManagement />} />
              {/* Các route admin con khác */} 
            </Route>
            <Route path="/admin/categories" element={<CategoryManagement />} /> {/* <<< Route mới */} 
            <Route path="/admin/brands" element={<BrandManagement />} /> {/* <<< Route mới */} 
            {/* Các route admin khác không dùng layout của dashboard (nếu có) */} 
          </Route>
        </Route>

        {/* TODO: Thêm các layout/routes khác nếu cần (ví dụ: Seller Layout) */} 
        {/* TODO: Thêm trang 404 Not Found */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </AuthProvider>
  );
}

export default App;