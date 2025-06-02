// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Skeleton,
  Divider,
  CircularProgress,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import HeroSlider from '../components/HeroSlider/HeroSlider';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import ProductCardNew from '../components/product/ProductCardNew';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { logUserBehavior } from '../utils/analytics';

// Component để theo dõi hành vi người dùng
const ProductTracker = ({ product, children }) => {
  const { user } = useAuth();
  
  useEffect(() => {
    // Ghi lại hành vi xem sản phẩm khi component render
    if (user) {
      logUserBehavior('view', product._id);
    }
  }, [product._id, user]);
  
  return children;
};

// Component hiển thị sản phẩm đề xuất riêng cho người dùng
const RecommendedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) {
        // Nếu không có user, lấy sản phẩm nổi bật thay thế
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Tạm thời sử dụng dữ liệu mẫu thay vì gọi API
        // const response = await api.get('/ai/recommendations');
        // if (response.data.success) {
        //   setProducts(response.data.recommendations);
        // }
        
        // Dữ liệu mẫu cho recommendations
        const mockRecommendations = [
          {
            _id: 'rec1',
            name: 'Laptop Gaming MSI GF63',
            price: 22990000,
            discountPrice: 21490000,
            images: ['/images/products/laptop-1.jpg'],
            slug: 'laptop-gaming-msi-gf63'
          },
          {
            _id: 'rec2',
            name: 'PC Gaming RTX 4060',
            price: 25490000,
            discountPrice: null,
            images: ['/images/products/pc-1.jpg'],
            slug: 'pc-gaming-rtx-4060'
          },
          {
            _id: 'rec3',
            name: 'RAM Kingston Fury 32GB',
            price: 2190000,
            discountPrice: 1990000,
            images: ['/images/products/ram-1.jpg'],
            slug: 'ram-kingston-fury-32gb'
          },
          {
            _id: 'rec4',
            name: 'Chuột Logitech G Pro X',
            price: 2890000,
            discountPrice: null,
            images: ['/images/products/mouse-1.jpg'],
            slug: 'chuot-logitech-g-pro-x'
          }
        ];
        
        setProducts(mockRecommendations);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [user]);
  
  if (!user) return null;
  
  if (loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Gợi ý cho bạn
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={6} sm={4} md={3} key={item}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  
  if (products.length === 0) return null;
  
  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Gợi ý cho bạn
        </Typography>
        <Button 
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/recommendations')}
        >
          Xem tất cả
        </Button>
      </Box>
      
      <Grid 
        container 
        spacing={1.5}
        className="product-grid-container"
        sx={{
          width: '100%',
          margin: 0,
          '& .MuiGrid-item': {
            display: 'flex',
            width: '100%'
          }
        }}
      >
        {products.map((product) => (
          <Grid 
            item 
            xs={6}
            sm={4} 
            md={2.4}
            key={product._id}
            className="product-grid-item"
            sx={{
              display: 'flex',
              width: '100%',
              minHeight: '380px'
            }}
          >
            <ProductTracker product={product}>
              <Box className="product-card-wrapper">
                <ProductCardNew product={product} />
              </Box>
            </ProductTracker>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Component hiển thị section sản phẩm
const ProductSection = ({ title, fetchUrl, viewAllUrl }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get(fetchUrl);
        if (response.data.success) {
          // Đảm bảo mỗi sản phẩm có mảng images hoặc thuộc tính image
          const formattedProducts = response.data.data.map(product => {
            console.log('Raw product data:', product);
            
            // Ensure product has proper image information
            let processedProduct = { ...product };
            
            // If product has neither images nor image properties, add placeholder
            if ((!product.images || !product.images.length) && !product.image) {
              processedProduct.images = ['/placeholder.png'];
              console.log('Added placeholder image for product:', product.name || product._id);
            } 
            // If product has image but not images array, convert to array
            else if (!product.images || !product.images.length) {
              if (product.image) {
                processedProduct.images = [product.image];
                console.log('Converted image to images array for product:', product.name || product._id);
              }
            }
            
            return processedProduct;
          });
          
          console.log('Formatted products:', formattedProducts);
          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error(`Error fetching ${title} products:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [fetchUrl, title]);
  
  if (loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={6} sm={4} md={3} key={item}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  
  if (products.length === 0) return null;
  
  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{title}</Typography>
        {viewAllUrl && (
          <Button 
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(viewAllUrl)}
          >
            Xem tất cả
          </Button>
        )}
      </Box>
      
      <Grid 
        container 
        spacing={1.5}
        className="product-grid-container"
        sx={{
          width: '100%',
          margin: 0,
          '& .MuiGrid-item': {
            display: 'flex',
            width: '100%'
          }
        }}
      >
        {products.map((product) => (
          <Grid 
            item 
            xs={6}
            sm={4} 
            md={2.4}
            key={product._id}
            className="product-grid-item"
            sx={{
              display: 'flex',
              width: '100%',
              minHeight: '380px'
            }}
          >
            <ProductTracker product={product}>
              <Box className="product-card-wrapper">
                <ProductCardNew product={product} />
              </Box>
            </ProductTracker>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Component hiển thị danh mục sản phẩm
const CategorySection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  if (loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Danh mục sản phẩm</Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={6} sm={3} key={item}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Danh mục sản phẩm</Typography>
      <Grid container spacing={2}>
        {categories.map((category) => (
          <Grid item xs={6} sm={3} md={2} key={category._id}>
            <Paper
              elevation={0}
              variant="outlined"
              sx={{
                p: 2,
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%'
              }}
              onClick={() => navigate(`/categories/${category.slug}`)}
            >
              {category.image ? (
                <Box sx={{ width: 64, height: 64, mb: 1 }}>
                  <ImageWithFallback
                    src={category.image}
                    alt={category.name}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    mb: 1, 
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                >
                  <Typography variant="h6" color="white">
                    {category.name.charAt(0)}
                  </Typography>
                </Box>
              )}
              
              <Typography variant="subtitle2">{category.name}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Phần Banner quảng cáo
const PromoBanner = ({ src, alt, link }) => {
  const navigate = useNavigate();
  
  return (
    <Box 
      sx={{ 
        mt: 4, 
        overflow: 'hidden', 
        borderRadius: 2,
        cursor: 'pointer',
        '&:hover img': {
          transform: 'scale(1.03)',
          transition: 'transform 0.3s ease'
        }
      }}
      onClick={() => navigate(link)}
    >
      <img 
        src={src} 
        alt={alt} 
        style={{ 
          width: '100%', 
          height: 'auto', 
          display: 'block',
          transition: 'transform 0.3s ease'
        }} 
      />
    </Box>
  );
};

// Component chính trang chủ
function HomePage() {
  return (
    <Box>
      <HeroSlider />
      
      <Container maxWidth="lg">
        {/* Danh mục sản phẩm */}
        <CategorySection />
        
        {/* Sản phẩm gợi ý cá nhân hóa - chỉ hiển thị khi đã đăng nhập */}
        {/* RecommendedProducts section removed */}
        

        
        {/* Sản phẩm mới nhất */}
        <ProductSection 
          title="Sản phẩm mới nhất" 
          fetchUrl="/products?sort=newest&limit=8" 
          viewAllUrl="/products?sort=newest"
        />
        
        {/* Sản phẩm bán chạy */}
        <ProductSection 
          title="Sản phẩm bán chạy" 
          fetchUrl="/products?sort=popular&limit=8" 
          viewAllUrl="/products?sort=popular"
        />
        
        
        
        {/* Sản phẩm giảm giá */}
        <ProductSection 
          title="Giảm giá sốc" 
          fetchUrl="/products?sort=discount&limit=8" 
          viewAllUrl="/products?sort=discount"
        />
      </Container>
    </Box>
  );
}

export default HomePage;