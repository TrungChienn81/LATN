import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { 
  Box, 
  Typography, 
  Grid, 
  Divider, 
  CircularProgress, 
  Alert, 
  Breadcrumbs, 
  Link, 
  Paper, 
  Container, 
  Rating, 
  Chip, 
  Button,
  TextField,
  IconButton,
  Stack
} from '@mui/material';
import { 
  Add as AddIcon, 
  Remove as RemoveIcon,
  ShoppingCart as ShoppingCartIcon 
} from '@mui/icons-material';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { formatPriceToVND } from '../utils/formatters';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedByBrand, setRelatedByBrand] = useState([]);
  const [relatedByCategory, setRelatedByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

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

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stockQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return;
    }

    if (quantity > product.stockQuantity) {
      toast.error('Số lượng vượt quá hàng có sẵn');
      return;
    }

    setAddingToCart(true);
    const success = await addToCart(product._id, quantity);
    setAddingToCart(false);
    
    // Reset quantity after successful add to cart
    if (success) {
      setQuantity(1);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  if (!product) return <Alert severity="warning" sx={{ mt: 4 }}>Không tìm thấy sản phẩm.</Alert>;

  // Xử lý ảnh (có thể là string hoặc object)
  const images = Array.isArray(product.images) ? product.images : [];

  return (
    <Box sx={{ py: 4 }}>
      <Container>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={4}>
            {/* Hình ảnh sản phẩm */}
            <Grid item xs={12} md={5}>
              <Box sx={{ position: 'relative' }}>
                <ImageWithFallback
                  src={images[0] || ''}
                  alt={product.name}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '4/3',
                    objectFit: 'contain',
                    bgcolor: 'background.paper'
                  }}
                />
                {product.discount > 0 && (
                  <Chip
                    label={`-${product.discount}%`}
                    color="error"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Box>
            </Grid>
            
            {/* Thông tin sản phẩm */}
            <Grid item xs={12} md={7}>
              <Typography variant="h4" gutterBottom>
                {product.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating value={product.rating || 0} precision={0.5} readOnly />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  ({product.numReviews || 0} đánh giá)
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Chip 
                  label={product.category?.name || 'Không phân loại'} 
                  size="small" 
                  sx={{ mr: 1 }} 
                />
                <Chip 
                  label={product.brand?.name || 'Không xác định'} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
              
              {/* Original Price */}
              {product.originalPrice && product.originalPrice > product.price && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    textDecoration: 'line-through', 
                    color: 'text.secondary',
                    mb: 1
                  }}
                >
                  {formatPriceToVND(product.originalPrice)}
                </Typography>
              )}

              {/* Current Price */}
              <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                {formatPriceToVND(product.price)}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Tình trạng: 
                  <Chip 
                    label={product.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'} 
                    color={product.stockQuantity > 0 ? 'success' : 'error'} 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                </Typography>
                {product.stockQuantity > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Số lượng có sẵn: {product.stockQuantity}
                  </Typography>
                )}
              </Box>

              {/* Add to Cart Section */}
              {product.stockQuantity > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Chọn số lượng
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 1 }}>
                      <IconButton 
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        size="small"
                      >
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        value={quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          handleQuantityChange(value);
                        }}
                        inputProps={{
                          min: 1,
                          max: product.stockQuantity,
                          style: { textAlign: 'center', width: '60px' }
                        }}
                        variant="standard"
                        sx={{ 
                          '& .MuiInput-underline:before': { display: 'none' },
                          '& .MuiInput-underline:after': { display: 'none' }
                        }}
                      />
                      <IconButton 
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= product.stockQuantity}
                        size="small"
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      / {product.stockQuantity} sản phẩm
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<ShoppingCartIcon />}
                      onClick={handleAddToCart}
                      disabled={addingToCart || !isAuthenticated}
                      sx={{ minWidth: 200 }}
                    >
                      {addingToCart ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Thêm vào giỏ hàng'
                      )}
                    </Button>
                    {!isAuthenticated && (
                      <Button
                        variant="outlined"
                        size="large"
                        component={RouterLink}
                        to="/login"
                        sx={{ minWidth: 120 }}
                      >
                        Đăng nhập
                      </Button>
                    )}
                  </Stack>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Tạm tính: {formatPriceToVND(product.price * quantity)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Technical Specifications */}
              {product.technicalSpecs && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Thông số kỹ thuật
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(product.technicalSpecs).map(([key, value]) => (
                      value && (
                        <Grid item xs={12} sm={6} key={key}>
                          <Typography variant="body2">
                            <strong>{key}:</strong> {value}
                          </Typography>
                        </Grid>
                      )
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Description */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Mô tả sản phẩm
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                  {product.description || 'Không có mô tả chi tiết.'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Related Products */}
        {relatedByBrand.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Sản phẩm cùng thương hiệu
            </Typography>
            <Grid container spacing={2}>
              {relatedByBrand.map((relatedProduct) => (
                <Grid item xs={12} sm={6} md={3} key={relatedProduct._id}>
                  <ProductCard product={relatedProduct} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {relatedByCategory.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Sản phẩm tương tự
            </Typography>
            <Grid container spacing={2}>
              {relatedByCategory.map((relatedProduct) => (
                <Grid item xs={12} sm={6} md={3} key={relatedProduct._id}>
                  <ProductCard product={relatedProduct} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ProductDetailPage; 