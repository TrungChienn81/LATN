import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Chip,
  Rating,
  styled,
  Tooltip
} from '@mui/material';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { formatPriceToVND } from '../../utils/formatters';

// Component hiển thị thẻ sản phẩm theo mẫu MSI
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  
  // Tính phần trăm giảm giá
  const calculateDiscount = (originalPrice, currentPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return null;
    const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    return discount > 0 ? `-${discount}%` : null;
  };

  // Lấy discount từ product hoặc tính toán nếu có giá gốc
  const discount = product.discount || 
    (product.originalPrice ? calculateDiscount(product.originalPrice, product.price) : null);

  // Lấy các thông số kỹ thuật từ sản phẩm
  const getSpecIcon = (specName) => {
    switch (specName) {
      case 'cpu': return '🔄';
      case 'ram': return '🧠';
      case 'storage': return '💾';
      case 'display': return '🖥️';
      case 'gpu': return '🎮';
      case 'refresh': return '⚡';
      default: return '•';
    }
  };

  return (
    <Card 
      onClick={() => navigate(`/product/${product._id}`)}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
    >
      {/* Image container */}
      <Box sx={{ position: 'relative', pt: '75%' }}>
        <ImageWithFallback
          src={product.images?.[0] || ''}
          alt={product.name}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            p: 2,
            bgcolor: 'background.paper'
          }}
        />
        
        {/* Discount badge */}
        {discount && (
          <Box 
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'error.main',
              color: 'white',
              py: 0.5,
              px: 1,
              borderRadius: 1,
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {discount}
          </Box>
        )}
      </Box>
      
      {/* Content area */}
      <CardContent sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        p: 2,
        pt: 1.5,
        flexGrow: 1,
      }}>
        {/* Product Name */}
        <Typography 
          variant="h6" 
          component="h3"
          sx={{
            fontWeight: 'medium',
            mb: 1,
            height: '48px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '24px'
          }}
        >
          {product.name}
        </Typography>

        {/* Shop Information */}
        {(product.shop?.shopName || product.shopId?.shopName) && (
          <Box sx={{ mb: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'primary.main',
                fontSize: '0.8rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Box 
                component="span" 
                sx={{ 
                  display: 'inline-block',
                  width: 4,
                  height: 4,
                  bgcolor: 'success.main',
                  borderRadius: '50%',
                  mr: 0.5,
                  flexShrink: 0
                }}
              />
              🏪 {product.shop?.shopName || product.shopId?.shopName}
            </Typography>
          </Box>
        )}

        {/* Brand */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 1, fontSize: '0.85rem' }}
        >
          📱 {product.brandName || product.brand?.name || 'Không xác định'}
        </Typography>

        {/* Rating */}
        <Box sx={{ mb: 1 }}>
          <Rating
            value={product.rating || 0}
            precision={0.5}
            readOnly
            size="small"
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Price section */}
        <Box>
          {/* Original price if discounted */}
          {product.originalPrice && product.originalPrice > product.price && (
            <Typography 
              variant="body2" 
              sx={{ 
                textDecoration: 'line-through', 
                color: 'text.disabled',
                fontSize: '0.8rem'
              }}
            >
              {formatPriceToVND(product.originalPrice)}
            </Typography>
          )}

          {/* Current Price */}
          <Typography 
            variant="h6" 
            color="primary.main" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}
          >
            {/* Thay đổi để hiển thị giá theo VNĐ - nhân 1.000.000 và định dạng */}
            {new Intl.NumberFormat('vi-VN', {
              style: 'decimal',
              maximumFractionDigits: 0
            }).format(product.price * 1000000) + ' đ'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
