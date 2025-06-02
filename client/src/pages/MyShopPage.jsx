import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Components
import Loader from '../components/shared/Loader';

const MyShopPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  
  // Kiểm tra xem người dùng đã đăng nhập chưa
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user) {
      navigate('/login?redirect=/my-shop');
      toast.error('Bạn cần đăng nhập để xem shop của mình');
      return;
    }
    
    fetchMyShop();
  }, [navigate, isAuthenticated, user, authLoading]);
  
  // Lấy thông tin shop của người dùng
  const fetchMyShop = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/shops/my-shop');
      
      if (data.success) {
        setShop(data.data);
        fetchShopProducts(data.data._id);
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      
      // Nếu lỗi là 404 (chưa có shop), chuyển hướng đến trang tạo shop
      if (error.response?.status === 404) {
        setError('Bạn chưa có shop nào. Hãy tạo shop mới!');
      } else if (error.response?.status === 401) {
        // Lỗi authentication, chuyển hướng về login
        navigate('/login?redirect=/my-shop');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      } else {
        setError(error.response?.data?.message || 'Không thể tải thông tin shop');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Lấy danh sách sản phẩm của shop
  const fetchShopProducts = async (shopId) => {
    try {
      setProductLoading(true);
      const { data } = await api.get(`/products?shopId=${shopId}`);
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching shop products:', error);
    } finally {
      setProductLoading(false);
    }
  };
  
  // Xử lý trạng thái shop
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Đã phê duyệt</span>;
      case 'pending_approval':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">Đang chờ phê duyệt</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">Bị từ chối</span>;
      case 'suspended':
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">Tạm khóa</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  // Hiển thị thông báo lỗi và nút tạo shop
  if (error && !loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Quản Lý Gian Hàng</h1>
          <div className="mb-6 py-4">
            <p className="text-lg text-gray-600 mb-6">{error}</p>
            <Link 
              to="/create-shop" 
              className="inline-block bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition duration-200"
            >
              Tạo Gian Hàng Mới
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Hiển thị loading
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <Loader />
        <p className="mt-4 text-gray-600">Đang tải thông tin gian hàng...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="relative h-48 md:h-64 mb-8 rounded-lg overflow-hidden">
        {/* Banner */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark to-primary">
          {shop.bannerUrl ? (
            <img 
              src={shop.bannerUrl.startsWith('http') ? shop.bannerUrl : `${process.env.REACT_APP_BASE_URL}${shop.bannerUrl}`} 
              alt={`${shop.shopName} banner`} 
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Shop info */}
        <div className="absolute bottom-0 left-0 p-6 flex items-end w-full">
          <div className="mr-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full overflow-hidden border-4 border-white">
              {shop.logoUrl ? (
                <img 
                  src={shop.logoUrl.startsWith('http') ? shop.logoUrl : `${process.env.REACT_APP_BASE_URL}${shop.logoUrl}`}
                  alt={`${shop.shopName} logo`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                  {shop.shopName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="text-white">
            <h1 className="text-2xl md:text-3xl font-bold">{shop.shopName}</h1>
            <div className="flex items-center mt-1">
              {getStatusBadge(shop.status)}
              <span className="ml-3 text-sm">{shop.address?.city || 'Chưa cập nhật địa chỉ'}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold border-b pb-3 mb-4">Quản Lý Shop</h2>
            
            <nav className="flex flex-col space-y-2">
              <Link 
                to={`/shop-edit/${shop._id}`}
                className="flex items-center py-2 px-4 rounded-md hover:bg-gray-100 text-gray-700 transition duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Chỉnh Sửa Thông Tin
              </Link>
              
              <Link 
                to="/add-product"
                className="flex items-center py-2 px-4 rounded-md hover:bg-gray-100 text-gray-700 transition duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Thêm Sản Phẩm Mới
              </Link>
              
              <Link 
                to="/shop-orders"
                className="flex items-center py-2 px-4 rounded-md hover:bg-gray-100 text-gray-700 transition duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                Quản Lý Đơn Hàng
              </Link>
              
              <Link 
                to={`/shop/${shop._id}`}
                className="flex items-center py-2 px-4 rounded-md hover:bg-gray-100 text-gray-700 transition duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                Xem Trang Shop
              </Link>
            </nav>
            
            {/* Thống kê cơ bản */}
            <div className="mt-8">
              <h3 className="text-md font-medium text-gray-700 mb-3">Thống Kê</h3>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tổng sản phẩm:</span>
                <span className="font-medium">{products.length}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Đã bán:</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đơn hàng chờ xử lý:</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="col-span-1 lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold border-b pb-3 mb-4">Thông Tin Gian Hàng</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Thông Tin Cơ Bản</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block">Tên gian hàng:</span>
                    <span className="font-medium">{shop.shopName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Ngày tạo:</span>
                    <span className="font-medium">{new Date(shop.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Mô tả:</span>
                    <span className="font-medium">{shop.description || 'Chưa có mô tả'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">Thông Tin Liên Hệ</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 block">Số điện thoại:</span>
                    <span className="font-medium">{shop.contactPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Email:</span>
                    <span className="font-medium">{shop.contactEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Địa chỉ:</span>
                    <span className="font-medium">
                      {shop.address?.street ? (
                        <>
                          {shop.address.street}, {shop.address.state}, {shop.address.city}, {shop.address.country}
                        </>
                      ) : (
                        'Chưa cập nhật địa chỉ'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sản phẩm */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-lg font-semibold">Sản Phẩm Của Shop</h2>
              <Link 
                to="/add-product"
                className="bg-primary text-white text-sm px-4 py-2 rounded-md hover:bg-primary-dark transition duration-200"
              >
                Thêm Sản Phẩm
              </Link>
            </div>
            
            {productLoading ? (
              <div className="text-center py-8">
                <Loader />
                <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Bạn chưa có sản phẩm nào</p>
                <Link 
                  to="/add-product"
                  className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition duration-200 inline-block"
                >
                  Thêm Sản Phẩm Đầu Tiên
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-md transition duration-200">
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={product.image ? 
                          product.image.startsWith('http') ? product.image : `${process.env.REACT_APP_BASE_URL}${product.image}` : 
                          'https://placehold.co/600x400?text=No+Image'} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-gray-800 mb-1 truncate">{product.name}</h3>
                      <p className="text-primary font-bold">{product.price.toLocaleString('vi-VN')}₫</p>
                      
                      <div className="flex justify-between mt-3">
                        <Link 
                          to={`/edit-product/${product._id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Chỉnh Sửa
                        </Link>
                        <Link 
                          to={`/product/${product._id}`}
                          className="text-gray-600 hover:underline text-sm"
                        >
                          Xem Chi Tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyShopPage;
