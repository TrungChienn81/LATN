// src/components/ProductCard.jsx
import React, { useState } from 'react';
import {
  Card, CardMedia, CardContent, CardActions,
  Typography, Button, Rating, Box, Skeleton, Tooltip
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Component này nhận một prop là 'product' object
function ProductCard({ product }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Xử lý trường hợp product không có dữ liệu (phòng lỗi)
  if (!product) {
    return null; // Hoặc hiển thị một card placeholder
  }

  // Lấy ảnh đầu tiên hoặc ảnh mặc định
  let imageUrl = '';
  
  // Hỗ trợ cả hai định dạng: images array và image string property
  if (product.images && product.images.length > 0) {
    const imagePath = product.images[0];
    
    // Kiểm tra và định dạng URL ảnh
    if (typeof imagePath === 'string') {
      if (imagePath.startsWith('http')) {
        // Nếu đã là URL đầy đủ
        imageUrl = imagePath;
      } else if (imagePath.startsWith('/uploads/')) {
        // Đường dẫn upload từ server - cần thêm domain của server API
        const serverUrl = 'http://localhost:3001';
        imageUrl = `${serverUrl}${imagePath}`;
      } else {
        // Xây dựng URL với origin của server
        imageUrl = `${window.location.origin}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
      }
    } else if (imagePath && imagePath.url) {
      // Trường hợp image là object với url property
      imageUrl = imagePath.url;
    }
  } else if (product.image) {
    // Hỗ trợ trường hợp product.image (string)
    const imagePath = product.image;
    if (typeof imagePath === 'string') {
      if (imagePath.startsWith('http')) {
        imageUrl = imagePath;
      } else if (imagePath.startsWith('/uploads/')) {
        // Đường dẫn upload từ server - cần thêm domain của server API
        const serverUrl = 'http://localhost:3001';
        imageUrl = `${serverUrl}${imagePath}`;
      } else {
        imageUrl = `${window.location.origin}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
      }
    }
  }
  
  // Fallback nếu không có ảnh
  if (!imageUrl) {
    imageUrl = `${window.location.origin}/placeholder.png`;
  }

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <Card sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxWidth: '100%',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s ease-in-out',
      boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
      borderRadius: '8px',
      '&:hover': { 
        transform: 'translateY(-4px)',
        boxShadow: '0px 4px 8px rgba(0,0,0,0.2)',
      },
    }}>
      {/* Image container with fixed height */}
      <Box sx={{ 
        position: 'relative', 
        height: 200,
        width: '100%',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {imageLoading && (
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            animation="wave"
            sx={{ position: 'absolute', top: 0, left: 0 }}
          />
        )}
        
        {imageError ? (
          <Box 
            sx={{ 
              height: '100%', 
              width: '100%',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
              color: '#757575',
              fontSize: '14px',
              p: 2,
              textAlign: 'center'
            }}
          >
            No Image
          </Box>
        ) : (
          <CardMedia
            component="img"
            sx={{ 
              maxHeight: '100%', 
              maxWidth: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain', 
              p: 1,
              display: imageLoading ? 'none' : 'block' 
            }}
            image={imageUrl}
            alt={product.name || 'Product image'}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Discount tag */}
        {product.discount > 0 && (
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
            -{product.discount}%
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
        {/* Product Name - Cách hiển thị mới với tooltip */}
        <Tooltip title={product.name} placement="top" arrow>
          <Typography
            component={RouterLink}
            to={`/product/${product._id}`}
            variant="body1"
            sx={{
              fontWeight: 500,
              fontSize: '0.85rem',
              lineHeight: 1.2,
              height: '40px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2, /* Hiển thị tối đa 2 dòng */
              WebkitBoxOrient: 'vertical',
              textDecoration: 'none',
              color: 'text.primary',
              mb: 1,
              '&:hover': { color: 'primary.main' }
            }}
          >
            {product.name || "Không có tên"}
          </Typography>
        </Tooltip>

        {/* Brand name - single line */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 0.5,
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            fontSize: '0.8rem'
          }}
        >
          {product.brandName || product.brand?.name || '\u00A0'}
        </Typography>

        {/* Rating */}
        <Box sx={{ mb: 1 }}>
          <Rating
            name={`rating-${product._id}`}
            value={product.averageRating || 0}
            precision={0.5}
            readOnly
            size="small"
          />
        </Box>

        {/* Spacer to push price to bottom */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Price section */}
        <Box sx={{ mt: 1 }}>
          <Typography 
            variant="h6" 
            color="primary.main" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}
          >
            {product.price != null 
              ? `${new Intl.NumberFormat('vi-VN', {
                  style: 'decimal',
                  maximumFractionDigits: 0
                }).format(product.price * 1000000)} đ`
              : 'Liên hệ'}
          </Typography>

          {/* Original price if discounted */}
          {product.discountPrice && product.discountPrice < product.price && (
            <Typography 
              variant="body2" 
              sx={{ 
                textDecoration: 'line-through', 
                color: 'text.secondary',
                fontSize: '0.8rem'
              }}
            >
              {new Intl.NumberFormat('vi-VN', {
                style: 'decimal',
                maximumFractionDigits: 0
              }).format(product.price * 1000000)} đ
            </Typography>
          )}
        </Box>
      </CardContent>
      
      {/* Action buttons with consistent spacing */}
      <CardActions sx={{ 
        justifyContent: 'space-between', 
        px: 2, 
        py: 1.5
      }}>
        <Button 
          variant="outlined" 
          size="small" 
          component={RouterLink} 
          to={`/product/${product._id}`}
          sx={{ minWidth: '80px', flex: 1, mr: 1 }}
        >
          Chi tiết
        </Button>
        <Button 
          variant="contained" 
          size="small" 
          color="primary"
          sx={{ minWidth: '120px', flex: 2 }}
        >
          Thêm vào giỏ
        </Button>
      </CardActions>
    </Card>
  );
}

export default ProductCard;