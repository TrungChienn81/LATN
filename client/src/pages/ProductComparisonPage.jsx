import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { useCompare } from '../contexts/CompareContext';
import { useCart } from '../contexts/CartContext';
import api from '../services/api';

// Format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(price * 1000000);
};

const ProductComparisonPage = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [specs, setSpecs] = useState([]);
  
  // Trích xuất tất cả các thông số kỹ thuật từ danh sách sản phẩm so sánh
  useEffect(() => {
    if (compareItems.length === 0) return;
    
    // Lấy tất cả các thuộc tính kỹ thuật
    const allSpecs = [];
    compareItems.forEach(product => {
      if (product.technicalSpecs) {
        Object.keys(product.technicalSpecs).forEach(key => {
          if (!allSpecs.includes(key)) {
            allSpecs.push(key);
          }
        });
      }
    });
    
    // Sắp xếp theo bảng chữ cái
    allSpecs.sort();
    
    // Thêm các thuộc tính cơ bản vào đầu tiên
    const basicSpecs = [
      'Tên sản phẩm',
      'Giá',
      'Thương hiệu',
      'Danh mục',
      'Tình trạng'
    ];
    
    setSpecs([...basicSpecs, ...allSpecs]);
  }, [compareItems]);

  // Lấy giá trị thông số kỹ thuật của sản phẩm
  const getSpecValue = (product, specName) => {
    switch (specName) {
      case 'Tên sản phẩm':
        return product.name;
      case 'Giá':
        return formatPrice(product.price);
      case 'Thương hiệu':
        return product.brand?.name || 'Không xác định';
      case 'Danh mục':
        return product.category?.name || 'Không xác định';
      case 'Tình trạng':
        return product.stockQuantity > 0 
          ? `Còn hàng (${product.stockQuantity})` 
          : 'Hết hàng';
      default:
        return product.technicalSpecs?.[specName] || '-';
    }
  };

  // Xử lý khi thêm sản phẩm vào giỏ hàng
  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  if (compareItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h5" gutterBottom>
            Danh sách so sánh trống
          </Typography>
          <Typography variant="body1" paragraph>
            Bạn chưa thêm sản phẩm nào vào danh sách so sánh.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/products')}
          >
            Tiếp tục mua sắm
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          So sánh sản phẩm
        </Typography>
        <Typography variant="body1" color="text.secondary">
          So sánh chi tiết {compareItems.length} sản phẩm
        </Typography>
      </Box>

      {/* Product Images and Basic Info */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {compareItems.map((product) => (
          <Grid item xs={12} sm={6} md={12 / Math.min(compareItems.length, 4)} key={product._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <IconButton 
                  size="small"
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    }
                  }}
                  onClick={() => removeFromCompare(product._id)}
                >
                  <DeleteIcon />
                </IconButton>
                
                <Box sx={{ pt: '75%', position: 'relative' }}>
                  <CardMedia
                    component={ImageWithFallback}
                    src={product.images?.[0] || ''}
                    alt={product.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      p: 2
                    }}
                  />
                </Box>
              </Box>
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography 
                  variant="subtitle1" 
                  component="h3"
                  sx={{
                    fontWeight: 'medium',
                    mb: 1,
                    height: '48px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {product.name}
                </Typography>
                
                <Typography variant="h6" color="primary" gutterBottom>
                  {formatPrice(product.price)}
                </Typography>
                
                {product.stockQuantity > 0 ? (
                  <Chip 
                    label="Còn hàng" 
                    color="success" 
                    size="small" 
                    sx={{ mb: 2 }} 
                  />
                ) : (
                  <Chip 
                    label="Hết hàng" 
                    color="error" 
                    size="small" 
                    sx={{ mb: 2 }} 
                  />
                )}
                
                <Box sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    startIcon={<CartIcon />}
                    disabled={product.stockQuantity <= 0}
                    onClick={() => handleAddToCart(product)}
                    sx={{ mb: 1 }}
                  >
                    Thêm vào giỏ
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    Xem chi tiết
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Compare Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Thông số</TableCell>
              {compareItems.map((product) => (
                <TableCell key={product._id} align="center">
                  {product.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {specs.map((specName) => (
              <TableRow key={specName} sx={{ '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 0, 0, 0.02)' } }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  {specName}
                </TableCell>
                {compareItems.map((product) => {
                  const value = getSpecValue(product, specName);
                  // Highlight differences
                  const allValues = compareItems.map(p => getSpecValue(p, specName));
                  const hasDifference = allValues.some(v => v !== value);
                  
                  return (
                    <TableCell 
                      key={`${product._id}-${specName}`} 
                      align="center"
                      sx={{
                        fontWeight: hasDifference && value !== '-' ? 'bold' : 'normal',
                        color: hasDifference && value !== '-' ? 'primary.main' : 'inherit'
                      }}
                    >
                      {value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>
        
        <Button 
          variant="outlined" 
          color="error"
          onClick={clearCompare}
        >
          Xóa tất cả
        </Button>
      </Box>
    </Container>
  );
};

export default ProductComparisonPage;
