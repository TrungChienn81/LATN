// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material'; // <<< Không cần Container ở đây nữa
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Import Layout Components
import PublicLayout from './components/Layout/PublicLayout'; // <<< Import PublicLayout
import AdminLayout from './components/Layout/AdminLayout';   // <<< Import AdminLayout
// import Navbar from './components/Layout/Navbar'; // Không cần import trực tiếp nữa
// import Footer from './components/Layout/Footer'; // Không cần import trực tiếp nữa

// Import Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductCategoryPage from './pages/ProductCategoryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminOverview from './components/Admin/AdminOverview';
import AdminUserManagement from './components/Admin/UserManagement/AdminUserManagement';
import AdminOrderManagement from './components/Admin/OrderManagement/AdminOrderManagement';
import AdminProductManagement from './components/Admin/ProductManagement/AdminProductManagement';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoryManagement from './components/Admin/CategoryManagement';
import BrandManagement from './components/Admin/BrandManagement';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import UserProfilePage from './pages/UserProfilePage';

// Import Shop Pages
import CreateShopPage from './pages/CreateShopPage';
import ShopDashboardPage from './pages/ShopDashboardPage';
import EditShopPage from './pages/EditShopPage';
import ShopPage from './pages/ShopPage';
import ShopDetailPage from './pages/ShopDetailPage';

// Import Shop Components
import ShopProductManagement from './components/Shop/ShopProductManagement';
import ShopOrderManagement from './components/Shop/ShopOrderManagement';
import ShopSettings from './components/Shop/ShopSettings';
import ShopOverview from './components/Shop/ShopOverview';

// Import Admin Components
import PaymentManagement from './components/Admin/PaymentManagement';

// Import AI Test Page
import AITestPage from './pages/AITestPage';
import ChatTestPage from './pages/ChatTestPage';
import ChatSetupPage from './pages/ChatSetupPage';
import RAGTestPage from './pages/RAGTestPage';

// Import Demo Payment Page
import DemoPaymentPage from './pages/DemoPaymentPage';

// Import Payment Return Pages
import VNPayReturnPage from './pages/VNPayReturnPage';
import MoMoReturnPage from './pages/MoMoReturnPage';
import PayPalReturnPage from './pages/PayPalReturnPage';

// Import Chat Provider
import ChatProvider from './components/Chat/ChatProvider';

function App() {
  return (
    <>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <ChatProvider>
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
            <Route path="/categories/:categorySlug" element={<ProductCategoryPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Shop Routes */}
            <Route path="/create-shop" element={<CreateShopPage />} />
            <Route path="/shop-edit/:id" element={<EditShopPage />} />
            <Route path="/shop/:shopId" element={<ShopDetailPage />} />
            
            {/* AI Test Page */}
            <Route path="/ai-test" element={<AITestPage />} />
            
            {/* Chat Test Page */}
            <Route path="/chat-test" element={<ChatTestPage />} />
            
            {/* RAG Test Page */}
            <Route path="/rag-test" element={<RAGTestPage />} />
            
            {/* Chat Setup Page */}
            <Route path="/chat-setup" element={<ChatSetupPage />} />
            
            {/* Demo Payment Page */}
            <Route path="/demo-payment" element={<DemoPaymentPage />} />
            
            {/* Payment Return Pages */}
            <Route path="/vnpay-return" element={<VNPayReturnPage />} />
            <Route path="/momo-return" element={<MoMoReturnPage />} />
            <Route path="/paypal-return" element={<PayPalReturnPage />} />
            
            {/* Shop Dashboard Routes */}
            <Route path="/my-shop/*" element={<ShopDashboardPage />}>
              <Route path="overview" element={<ShopOverview />} />
              <Route path="products" element={<ShopProductManagement />} />
              <Route path="orders" element={<ShopOrderManagement />} />
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
                <Route path="orders" element={<AdminOrderManagement />} />
                <Route path="payments" element={<PaymentManagement />} />
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
          
          {/* Catch-all route - redirect to home for undefined routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </ChatProvider>
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </>
  );
}

export default App;