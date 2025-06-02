import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Components
import Loader from '../components/shared/Loader';

const EditShopPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    shopName: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Việt Nam'
    }
  });
  
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [currentBanner, setCurrentBanner] = useState(null);
  
  // Kiểm tra xem người dùng đã đăng nhập chưa
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !user) {
      navigate('/login?redirect=/shop-edit/' + id);
      toast.error('Bạn cần đăng nhập để chỉnh sửa shop');
      return;
    }
    
    fetchShopDetails();
  }, [navigate, id, isAuthenticated, user, authLoading]);
  
  // Lấy thông tin shop
  const fetchShopDetails = async () => {
    try {
      setFetchLoading(true);
      const response = await api.get(`/shops/${id}`);
      
      if (response.data.success) {
        const shop = response.data.data;
        setFormData({
          shopName: shop.shopName,
          description: shop.description || '',
          contactPhone: shop.contactPhone,
          contactEmail: shop.contactEmail,
          address: {
            street: shop.address?.street || '',
            city: shop.address?.city || '',
            state: shop.address?.state || '',
            postalCode: shop.address?.postalCode || '',
            country: shop.address?.country || 'Việt Nam'
          }
        });
        
        setCurrentLogo(shop.logoUrl);
        setCurrentBanner(shop.bannerUrl);
      }
    } catch (error) {
      console.error('Error fetching shop details:', error);
      if (error.response?.status === 401) {
        navigate('/login?redirect=/shop-edit/' + id);
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      } else if (error.response?.status === 404) {
        toast.error('Không tìm thấy shop');
        navigate('/my-shop');
        return;
      }
      toast.error(error.response?.data?.message || 'Không thể tải thông tin shop');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Xử lý cho các trường address
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewBanner(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Tạo form data để gửi lên server kèm file
      const shopFormData = new FormData();
      
      // Thêm thông tin cơ bản
      shopFormData.append('shopName', formData.shopName);
      shopFormData.append('description', formData.description);
      shopFormData.append('contactPhone', formData.contactPhone);
      shopFormData.append('contactEmail', formData.contactEmail);
      
      // Thêm thông tin địa chỉ
      shopFormData.append('address', JSON.stringify(formData.address));
      
      // Thêm file logo và banner nếu có
      if (logo) shopFormData.append('logo', logo);
      if (banner) shopFormData.append('banner', banner);

      // Gửi request cập nhật shop
      const response = await api.put(
        `/shops/${id}`,
        shopFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Cập nhật gian hàng thành công!');
      navigate('/my-shop');
    } catch (error) {
      console.error('Error updating shop:', error);
      toast.error(
        error.response?.data?.message || 
        'Có lỗi xảy ra khi cập nhật gian hàng. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <Loader />
        <p className="mt-4 text-gray-600">Đang tải thông tin gian hàng...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Cập Nhật Thông Tin Gian Hàng</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        {/* Thông tin cơ bản */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Thông Tin Cơ Bản</h2>
          
          <div className="mb-4">
            <label htmlFor="shopName" className="block text-gray-700 font-medium mb-2">
              Tên Gian Hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="shopName"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Tên gian hàng phải là duy nhất trên hệ thống.
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
              Mô Tả Gian Hàng
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        {/* Thông tin liên hệ */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Thông Tin Liên Hệ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="contactPhone" className="block text-gray-700 font-medium mb-2">
                Số Điện Thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="contactEmail" className="block text-gray-700 font-medium mb-2">
                Email Liên Hệ <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Địa chỉ */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Địa Chỉ</h2>
          
          <div className="mb-4">
            <label htmlFor="address.street" className="block text-gray-700 font-medium mb-2">
              Đường/Số Nhà
            </label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="address.city" className="block text-gray-700 font-medium mb-2">
                Thành Phố/Tỉnh
              </label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="address.state" className="block text-gray-700 font-medium mb-2">
                Quận/Huyện
              </label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="address.postalCode" className="block text-gray-700 font-medium mb-2">
                Mã Bưu Điện
              </label>
              <input
                type="text"
                id="address.postalCode"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="address.country" className="block text-gray-700 font-medium mb-2">
                Quốc Gia
              </label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary bg-gray-100"
                readOnly
              />
            </div>
          </div>
        </div>
        
        {/* Logo và banner */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Hình Ảnh</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Logo Gian Hàng
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                {previewLogo ? (
                  <div className="mb-2">
                    <img 
                      src={previewLogo} 
                      alt="Logo Preview" 
                      className="mx-auto h-32 w-32 object-cover rounded"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        setLogo(null);
                        setPreviewLogo(null);
                      }}
                      className="mt-2 text-red-500 text-sm"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                ) : currentLogo ? (
                  <div className="mb-2">
                    <img 
                      src={currentLogo.startsWith('http') ? currentLogo : `${process.env.REACT_APP_BASE_URL}${currentLogo}`} 
                      alt="Current Logo" 
                      className="mx-auto h-32 w-32 object-cover rounded"
                    />
                    <p className="text-sm text-gray-500 mt-2">Logo hiện tại</p>
                    <input
                      type="file"
                      id="logo"
                      name="logo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full mt-2"
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-gray-500 mb-2">Kéo thả hoặc click để tải lên logo</div>
                    <input
                      type="file"
                      id="logo"
                      name="logo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full"
                    />
                  </>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Khuyến nghị: Hình vuông, kích thước tối thiểu 500x500px, định dạng PNG hoặc JPG
                </p>
              </div>
            </div>
            
            {/* Banner */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Ảnh Bìa Gian Hàng
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                {previewBanner ? (
                  <div className="mb-2">
                    <img 
                      src={previewBanner} 
                      alt="Banner Preview" 
                      className="mx-auto h-32 w-full object-cover rounded"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        setBanner(null);
                        setPreviewBanner(null);
                      }}
                      className="mt-2 text-red-500 text-sm"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                ) : currentBanner ? (
                  <div className="mb-2">
                    <img 
                      src={currentBanner.startsWith('http') ? currentBanner : `${process.env.REACT_APP_BASE_URL}${currentBanner}`} 
                      alt="Current Banner" 
                      className="mx-auto h-32 w-full object-cover rounded"
                    />
                    <p className="text-sm text-gray-500 mt-2">Ảnh bìa hiện tại</p>
                    <input
                      type="file"
                      id="banner"
                      name="banner"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="w-full mt-2"
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-gray-500 mb-2">Kéo thả hoặc click để tải lên ảnh bìa</div>
                    <input
                      type="file"
                      id="banner"
                      name="banner"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="w-full"
                    />
                  </>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Khuyến nghị: Tỷ lệ 3:1, kích thước tối thiểu 1200x400px, định dạng PNG hoặc JPG
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Nút submit */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/my-shop')}
            className="px-6 py-2 mr-4 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition duration-200"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition duration-200"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (
              'Cập Nhật Gian Hàng'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditShopPage;
