// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material'; // <<< Không cần Container ở đây nữa
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import CategoryManagement from './components/Admin/CategoryManagement';
import BrandManagement from './components/Admin/BrandManagement';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';

// Import Shop Pages
import CreateShopPage from './pages/CreateShopPage';
import ShopDashboardPage from './pages/ShopDashboardPage';
import EditShopPage from './pages/EditShopPage';
import ShopPage from './pages/ShopPage';

// Import Shop Components
import ShopProductManagement from './components/Shop/ShopProductManagement';
import ShopSettings from './components/Shop/ShopSettings';
import ShopOverview from './components/Shop/ShopOverview';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CssBaseline /> {/* CssBaseline có thể để ở đây hoặc trong từng Layout */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        /> 
        <Routes>
          {/* Public Routes - Sử dụng PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Shop Routes */}
            <Route path="/create-shop" element={<CreateShopPage />} />
            <Route path="/shop-edit/:id" element={<EditShopPage />} />
            <Route path="/shop/:id" element={<ShopPage />} />
            
            {/* Shop Dashboard Routes */}
            <Route path="/my-shop/*" element={<ShopDashboardPage />}>
              <Route path="overview" element={<ShopOverview />} />
              <Route path="products" element={<ShopProductManagement />} />
              <Route path="orders" element={<div>Shop Orders Content</div>} />
              <Route path="customers" element={<div>Shop Customers Content</div>} />
              <Route path="analytics" element={<div>Shop Analytics Content</div>} />
              <Route path="settings" element={<ShopSettings />} />
            </Route>
            
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
      </CartProvider>
    </AuthProvider>
  );
}

export default App;