// src/pages/ProductsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import axios instance đã cấu hình

function ProductsPage() {
  const [products, setProducts] = useState([]); // State lưu danh sách sản phẩm
  const [loading, setLoading] = useState(true); // State quản lý trạng thái loading
  const [error, setError] = useState(null);   // State lưu lỗi (nếu có)

  useEffect(() => {
    // Hàm để gọi API
    const fetchProducts = async () => {
      setLoading(true); // Bắt đầu loading
      setError(null);
      try {
        const response = await api.get('/products'); // Gọi GET /api/products
        console.log(response.data); // Xem thử dữ liệu trả về
        if (response.data && response.data.success) {
          setProducts(response.data.data); // Lưu dữ liệu sản phẩm vào state
        } else {
           setError(response.data.message || 'Không thể tải danh sách sản phẩm.');
        }
      } catch (err) {
        console.error("Lỗi khi gọi API products:", err);
        setError(err.message || 'Đã xảy ra lỗi khi kết nối tới server.');
      } finally {
        setLoading(false); // Kết thúc loading
      }
    };

    fetchProducts(); // Gọi hàm khi component được mount lần đầu
  }, []); // Mảng dependency rỗng để useEffect chỉ chạy 1 lần

  return (
    <div>
      <h1>Danh sách Sản phẩm</h1>
      {loading && <p>Đang tải...</p>} {/* Hiển thị khi đang loading */}
      {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>} {/* Hiển thị khi có lỗi */}
      {!loading && !error && (
        <ul>
          {products.length > 0 ? (
            products.map((product) => (
              <li key={product._id}>
                {/* TODO: Hiển thị đẹp hơn với ảnh, giá,... */}
                {product.name} - {product.price?.toLocaleString('vi-VN')} VNĐ
              </li>
            ))
          ) : (
            <p>Không có sản phẩm nào.</p>
          )}
        </ul>
      )}
    </div>
  );
}

export default ProductsPage;