import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

// Component hiển thị thẻ sản phẩm theo mẫu mới (card style)
const ProductCardNew = ({ product, onClick }) => {
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

  const handleCardClick = () => {
    if (onClick) {
      onClick(product._id);
    } else {
      navigate(`/product/${product._id}`);
    }
  };

  return (
    <Card 
      onClick={handleCardClick}
      sx={{ 
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        minHeight: '360px',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
    >
      {/* Image container - Fixed height */}
      <Box sx={{ 
        position: 'relative', 
        height: 140, /* Smaller for 5-column layout */
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 1,
        bgcolor: 'background.paper',
        flexShrink: 0,
        overflow: 'visible',
        '& img': {
          maxHeight: '100%',
          maxWidth: '100%',
          objectFit: 'contain',
          zIndex: 2
        }
      }}>
        {console.log('Product image URL:', product.images?.[0], 'Product:', product.name)}
        <ImageWithFallback
          src={product.images?.[0] || ''}
          alt={product.name}
          sx={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain'
          }}
        />
        
        {/* Discount badge */}
        {discount && (
          <Box 
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              backgroundColor: 'error.main',
              color: 'white',
              py: 0.3,
              px: 0.8,
              borderRadius: 1,
              fontWeight: 'bold',
              fontSize: '10px'
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
        p: 1,
        pt: 0.8,
        flexGrow: 1,
        minHeight: 0,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Product Name - Fixed height với 2 dòng và ellipsis */}
        <Box sx={{ 
          width: '100%', 
          height: '2.2em',
          overflow: 'hidden',
          mb: 0.8,
          flexShrink: 0
        }}>
          <Tooltip title={product.name} placement="top" arrow>
            <Typography
              variant="subtitle1"
              component="div"
              sx={{
                fontWeight: 500,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.1em',
                height: '2.2em',
                fontSize: '0.75rem', /* Smaller font for 5-column */
                color: 'text.primary',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                textOverflow: 'ellipsis',
                width: '100%',
                maxWidth: '100%',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                boxSizing: 'border-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2
              }}
            >
              {product.name || 'Tên sản phẩm'}
            </Typography>
          </Tooltip>
        </Box>

        {/* Shop Information Section */}
        <Box sx={{ 
          mb: 0.6,
          height: '18px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center'
        }}>
          <Typography
            variant="body2"
            component={Link}
            to={`/shop/${product.shop?._id || product.shopId?._id || product.shopId}`} 
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'primary.main',
              fontSize: '0.68rem',
              fontWeight: 500,
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              '&:hover': {
                textDecoration: 'underline'
              }
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
            🏪 {product.shop?.shopName || product.shopId?.shopName || 'Shop không xác định'}
            {/* Shop verification badge */}
            {(product.shop?.status || product.shopId?.status) === 'approved' && (
              <Box 
                component="span" 
                sx={{ 
                  ml: 0.5,
                  fontSize: '0.6rem'
                }}
              >
                ✓
              </Box>
            )}
          </Typography>
        </Box>

        {/* Brand Information */}
        <Box sx={{ 
          mb: 0.4,
          height: '16px',
          flexShrink: 0
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem'
            }}
            title={`Debug: brandName=${product.brandName}, brand=${JSON.stringify(product.brand)}, product.name=${product.name}`}
          >
            📱 {(() => {
              // Try different sources for brand name
              if (product.brandName && product.brandName !== 'Không xác định') {
                return product.brandName;
              }
              
              if (product.brand?.name && product.brand.name !== 'Không xác định') {
                return product.brand.name;
              }
              
              if (typeof product.brand === 'string' && 
                  product.brand !== 'undefined' && 
                  product.brand !== 'Không xác định' && 
                  product.brand.trim() !== '') {
                return product.brand;
              }
              
              // Extract brand from product name if available
              if (product.name) {
                const nameParts = product.name.split(' ');
                
                // Look for brand names in different positions
                for (let i = 0; i < nameParts.length; i++) {
                  const part = nameParts[i];
                  const partLower = part.toLowerCase();
                  
                  // Check if this part is a known brand
                  if (['msi', 'acer', 'asus', 'dell', 'hp', 'lenovo', 'apple', 'samsung', 'lg', 'sony', 
                       'intel', 'amd', 'nvidia', 'corsair', 'kingston', 'crucial', 'western', 'seagate',
                       'logitech', 'razer', 'steelseries', 'hyperx', 'cooler', 'master', 'thermaltake',
                       'gigabyte', 'asrock', 'evga', 'zotac', 'viewsonic', 'benq', 'philips'].includes(partLower)) {
                    return part.toUpperCase();
                  }
                }
                
                // Fallback: try position-based extraction for gaming laptops
                if (nameParts.length >= 3) {
                  const possibleBrand = nameParts[2];
                  if (possibleBrand && 
                      !['gaming', 'laptop', 'pc', 'màn', 'hình', 'chuột', 'bàn', 'phím', 'máy', 'tính'].includes(possibleBrand.toLowerCase()) &&
                      possibleBrand.length >= 2) {
                    return possibleBrand.charAt(0).toUpperCase() + possibleBrand.slice(1);
                  }
                }
                
                // Try first word that's not common
                for (const part of nameParts) {
                  if (part.length >= 2 && 
                      !['laptop', 'gaming', 'pc', 'máy', 'tính', 'màn', 'hình', 'chuột', 'bàn', 'phím'].includes(part.toLowerCase())) {
                    return part.charAt(0).toUpperCase() + part.slice(1);
                  }
                }
              }
              
              return 'Đa thương hiệu';
            })()}
          </Typography>
        </Box>

        {/* Rating */}
        <Box sx={{ mb: 0.4, height: '18px', flexShrink: 0 }}>
          <Rating
            value={product.rating || 0}
            precision={0.5}
            readOnly
            size="small"
            sx={{ fontSize: '0.9rem' }}
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1, minHeight: '8px' }} />

        {/* Price section */}
        <Box sx={{ mt: 'auto', flexShrink: 0 }}>
          {/* Original price if discounted */}
          {product.originalPrice && product.originalPrice > product.price && (
            <Typography 
              variant="body2" 
              sx={{ 
                textDecoration: 'line-through', 
                color: 'text.disabled',
                fontSize: '0.7rem',
                lineHeight: 1.1
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
              fontSize: '0.9rem',
              lineHeight: 1.1
            }}
          >
            {formatPriceToVND(product.price)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCardNew;
