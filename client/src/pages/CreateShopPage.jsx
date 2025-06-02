import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreateShopForm from '../components/CreateShopForm';

const CreateShopPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user) {
      navigate('/login?redirect=/create-shop');
      toast.error('Bạn cần đăng nhập để tạo shop');
      return;
    }

    // Kiểm tra xem người dùng đã có shop chưa
    const checkUserShop = async () => {
      try {
        const response = await api.get('/shops/my-shop');
        if (response.data.success) {
          toast.info('Bạn đã có shop rồi. Đang chuyển hướng đến trang quản lý shop.');
          navigate('/my-shop');
        }
      } catch (error) {
        // Nếu không có shop thì không cần xử lý lỗi
        if (!error.response || error.response.status !== 404) {
          console.error('Lỗi khi kiểm tra shop:', error);
        }
      }
    };

    checkUserShop();
  }, [navigate, isAuthenticated, user, authLoading]);

  // Handle form submission
  const handleCreateShop = async (formData) => {
    try {
      const shopData = {
        shopName: formData.shopName,
        description: formData.description || '',
        contactPhone: formData.phone,
        contactEmail: formData.email,
        address: {
          street: formData.address,
          city: '',
          district: '',
          ward: '',
        }
      };

      const response = await api.post('/shops', shopData);
      toast.success('Tạo gian hàng thành công!');
      navigate('/my-shop');
      return { success: true };
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo gian hàng');
      return { success: false, error: error.response?.data?.message };
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <CreateShopForm onSubmit={handleCreateShop} />;
};

export default CreateShopPage;
