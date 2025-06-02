import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Fetch cart data
  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      setCartCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/cart');
      if (response.data.success) {
        setCart(response.data.data);
        setCartCount(response.data.data.totalItems || 0);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return false;
    }

    try {
      const response = await api.post('/cart/add', {
        productId,
        quantity
      });

      if (response.data.success) {
        setCart(response.data.data);
        setCartCount(response.data.data.totalItems || 0);
        toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
        return true;
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng';
      toast.error(errorMessage);
      return false;
    }
  };

  // Update item quantity
  const updateCartItem = async (productId, quantity) => {
    try {
      const response = await api.put('/cart/update', {
        productId,
        quantity
      });

      if (response.data.success) {
        setCart(response.data.data);
        setCartCount(response.data.data.totalItems || 0);
        return true;
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Có lỗi xảy ra khi cập nhật giỏ hàng');
      return false;
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      const response = await api.delete(`/cart/remove/${productId}`);
      if (response.data.success) {
        setCart(response.data.data);
        setCartCount(response.data.data.totalItems || 0);
        toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
        return true;
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Có lỗi xảy ra khi xóa sản phẩm');
      return false;
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      const response = await api.delete('/cart');
      if (response.data.success) {
        setCart(response.data.data);
        setCartCount(0);
        toast.success('Đã xóa tất cả sản phẩm trong giỏ hàng');
        return true;
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Có lỗi xảy ra khi xóa giỏ hàng');
      return false;
    }
  };

  // Fetch cart when user changes
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated, user]);

  const value = {
    cart,
    cartCount,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 