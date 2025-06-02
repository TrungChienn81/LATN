import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

// Components
import Loader from '../components/shared/Loader';
import ProductGrid from '../components/product/ProductGrid';

const ShopPage = () => {
  const { id } = useParams();
  
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    fetchShopData();
  }, [id]);
  
  useEffect(() => {
    if (shop) {
      fetchShopProducts();
    }
  }, [shop, sort, currentPage]);
  
  const fetchShopData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/shops/${id}`);
      
      if (data.success) {
        setShop(data.data);
      } else {
        setError('Không thể tải thông tin shop');
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
      setError('Không tìm thấy shop hoặc shop đã bị xóa');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchShopProducts = async () => {
    try {
      setProductLoading(true);
      const { data } = await axios.get(`/api/products`, {
        params: {
          shopId: id,
          sort: sort,
          page: currentPage,
          limit: 12
        }
      });
      
      if (data.success) {
        setProducts(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching shop products:', error);
      toast.error('Không thể tải sản phẩm từ shop này');
    } finally {
      setProductLoading(false);
    }
  };
  
  const handleSortChange = (e) => {
    setSort(e.target.value);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi cách sắp xếp
  };
  
  // Hiển thị loading
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <Loader />
        <p className="mt-4 text-gray-600">Đang tải thông tin shop...</p>
      </div>
    );
  }
  
  // Hiển thị lỗi
  if (error) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Không tìm thấy shop</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition duration-200">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="relative h-64 md:h-80 mb-8 rounded-lg overflow-hidden">
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
          <div className="mr-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full overflow-hidden border-4 border-white">
              {shop.logoUrl ? (
                <img 
                  src={shop.logoUrl.startsWith('http') ? shop.logoUrl : `${process.env.REACT_APP_BASE_URL}${shop.logoUrl}`}
                  alt={`${shop.shopName} logo`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                  {shop.shopName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="text-white flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">{shop.shopName}</h1>
            <div className="mt-2 flex flex-wrap gap-4 md:gap-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                </svg>
                <span>{shop.contactEmail}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
                <span>{shop.contactPhone}</span>
              </div>
              {shop.address?.city && (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>{shop.address.city}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Shop description */}
      {shop.description && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Giới Thiệu Gian Hàng</h2>
          <p className="text-gray-700">{shop.description}</p>
        </div>
      )}
      
      {/* Products section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6">
          <h2 className="text-xl font-semibold mb-2 sm:mb-0">Sản Phẩm Của Shop</h2>
          
          <div className="flex items-center">
            <label htmlFor="sort" className="mr-2 text-gray-600">Sắp xếp:</label>
            <select 
              id="sort" 
              value={sort} 
              onChange={handleSortChange}
              className="border rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
            </select>
          </div>
        </div>
        
        {productLoading && products.length === 0 ? (
          <div className="text-center py-12">
            <Loader />
            <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Hiện tại shop chưa có sản phẩm nào</p>
          </div>
        ) : (
          <>
            <ProductGrid products={products} loading={productLoading} />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`mx-1 px-3 py-1 rounded-md ${
                      currentPage === 1 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    &laquo;
                  </button>
                  
                  {[...Array(totalPages).keys()].map(page => (
                    <button
                      key={page + 1}
                      onClick={() => setCurrentPage(page + 1)}
                      className={`mx-1 px-3 py-1 rounded-md ${
                        currentPage === page + 1
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page + 1}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`mx-1 px-3 py-1 rounded-md ${
                      currentPage === totalPages 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    &raquo;
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
