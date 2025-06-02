import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Rating,
  Divider,
  Button
} from '@mui/material';
import { 
  ShoppingCart as ShoppingCartIcon,
  Compare as CompareIcon
} from '@mui/icons-material';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { useCart } from '../../contexts/CartContext';
import { useCompare } from '../../contexts/CompareContext';
import { formatPriceToVND } from '../../utils/formatters';

// Component hiển thị sản phẩm dạng danh sách (list view)
const ProductListItem = ({ product, onClick }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToCompare } = useCompare();
  
  // Tính phần trăm giảm giá
  const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return null;
    const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    return discount > 0 ? `-${discount}%` : null;
  };

  // Xử lý khi click thêm vào giỏ hàng
  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  // Xử lý khi click thêm vào so sánh
  const handleAddToCompare = (e) => {
    e.stopPropagation();
    addToCompare(product);
  };

  // Lấy discount từ product hoặc tính toán nếu có giá gốc
  const discount = product.discount || 
    (product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : null);

  return (
    <Card 
      onClick={() => navigate(`/product/${product._id}`)}
      sx={{ 
        mb: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Grid container spacing={2}>
          {/* Product Image */}
          <Grid item xs={12} sm={3}>
            <Box sx={{ position: 'relative' }}>
              <ImageWithFallback
                src={product.images?.[0] || ''}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: 'auto',
                  aspectRatio: '4/3',
                  objectFit: 'contain',
                  bgcolor: 'background.paper'
                }}
              />
              {discount && (
                <Chip
                  label={discount}
                  color="error"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontWeight: 'bold'
                  }}
                />
              )}
            </Box>
          </Grid>

          {/* Product Details */}
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>
              {product.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {product.brandName || product.brand?.name || 'Không xác định'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating 
                value={product.rating || 0} 
                precision={0.5} 
                readOnly 
                size="small"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({product.numReviews || 0} đánh giá)
              </Typography>
            </Box>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 2
              }}
            >
              {product.description || 'Không có mô tả'}
            </Typography>

            {/* Technical Specifications */}
            {product.technicalSpecs && (
              <Grid container spacing={1}>
                {Object.entries(product.technicalSpecs).map(([key, value]) => (
                  value && (
                    <Grid item xs={6} key={key}>
                      <Typography variant="caption" color="text.secondary">
                        • {key}: {value}
                      </Typography>
                    </Grid>
                  )
                ))}
              </Grid>
            )}
          </Grid>

          {/* Price and Actions */}
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'right' }}>
              {/* Original Price */}
              {product.originalPrice && product.originalPrice > product.price && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    textDecoration: 'line-through',
                    color: 'text.disabled'
                  }}
                >
                  {formatPriceToVND(product.originalPrice)}
                </Typography>
              )}

              {/* Current Price */}
              <Typography 
                variant="h6" 
                color="primary.main" 
                sx={{ fontWeight: 'bold' }}
              >
                {formatPriceToVND(product.price)}
              </Typography>

              {/* Stock Status */}
              <Typography 
                variant="body2" 
                color={product.stockQuantity > 0 ? 'success.main' : 'error.main'}
                sx={{ mb: 2, fontWeight: 500 }}
              >
                {product.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'}
              </Typography>

              {/* Action Buttons */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<ShoppingCartIcon />}
                fullWidth
                sx={{ mb: 1 }}
                onClick={handleAddToCart}
                disabled={product.stockQuantity <= 0}
              >
                Thêm vào giỏ
              </Button>

              <Button
                variant="outlined"
                color="primary"
                startIcon={<CompareIcon />}
                fullWidth
                onClick={handleAddToCompare}
              >
                So sánh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ProductListItem;
