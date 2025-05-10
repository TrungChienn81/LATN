import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { Box, Typography, Grid, Divider, CircularProgress, Alert, Breadcrumbs, Link, Paper } from '@mui/material';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedByBrand, setRelatedByBrand] = useState([]);
  const [relatedByCategory, setRelatedByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy chi tiết sản phẩm
        const res = await api.get(`/products/${id}`);
        if (!res.data.success) throw new Error(res.data.message || 'Không tìm thấy sản phẩm');
        setProduct(res.data.data);

        // Lấy sản phẩm cùng brand (trừ chính nó)
        if (res.data.data.brand) {
          const brandRes = await api.get(`/products?brand=${encodeURIComponent(res.data.data.brand)}&exclude=${id}&limit=8`);
          setRelatedByBrand(brandRes.data.data || []);
        } else {
          setRelatedByBrand([]);
        }
        // Lấy sản phẩm cùng category (trừ chính nó)
        if (res.data.data.category) {
          const catRes = await api.get(`/products?category=${encodeURIComponent(res.data.data.category)}&exclude=${id}&limit=8`);
          setRelatedByCategory(catRes.data.data || []);
        } else {
          setRelatedByCategory([]);
        }
      } catch (err) {
        setError(err.message || 'Đã xảy ra lỗi khi tải sản phẩm.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndRelated();
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  if (!product) return <Alert severity="warning" sx={{ mt: 4 }}>Không tìm thấy sản phẩm.</Alert>;

  // Xử lý ảnh (có thể là string hoặc object)
  const images = Array.isArray(product.images) ? product.images : [];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', my: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
        <Link component={RouterLink} to="/">Trang chủ</Link>
        <Link component={RouterLink} to="/products">Sản phẩm</Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Ảnh sản phẩm */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                component="img"
                src={images[0] || '/placeholder.png'}
                alt={product.name}
                sx={{ width: '100%', maxWidth: 350, maxHeight: 350, objectFit: 'contain', borderRadius: 2, mb: 2, boxShadow: 2 }}
              />
              {/* Hiển thị các ảnh nhỏ nếu có nhiều ảnh */}
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {images.slice(1, 5).map((img, idx) => (
                  <Box
                    key={idx}
                    component="img"
                    src={img}
                    alt={`Ảnh phụ ${idx + 1}`}
                    sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1, border: '1px solid #eee' }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Thông tin sản phẩm */}
          <Grid item xs={12} md={7}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>{product.name}</Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold" gutterBottom>
              {product.price != null ? product.price.toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ'}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>{product.description}</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">Brand: <b>{product.brand || 'Không rõ'}</b></Typography>
            <Typography variant="body2" color="text.secondary">Category: <b>{product.category || 'Không rõ'}</b></Typography>
            {/* Có thể bổ sung thêm các trường khác nếu muốn */}
          </Grid>
        </Grid>
      </Paper>

      {/* Sản phẩm cùng Brand */}
      {relatedByBrand.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="medium" sx={{ mb: 2 }}>Sản phẩm cùng thương hiệu</Typography>
          <Grid container spacing={2}>
            {relatedByBrand.map((prod) => (
              <Grid item xs={12} sm={6} md={3} key={prod._id}>
                <ProductCard product={prod} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Sản phẩm cùng Category */}
      {relatedByCategory.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="medium" sx={{ mb: 2 }}>Sản phẩm cùng danh mục</Typography>
          <Grid container spacing={2}>
            {relatedByCategory.map((prod) => (
              <Grid item xs={12} sm={6} md={3} key={prod._id}>
                <ProductCard product={prod} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ProductDetailPage; 