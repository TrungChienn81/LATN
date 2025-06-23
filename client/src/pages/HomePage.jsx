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
import { logUserBehavior, getPersonalizedRecommendations, getTrendingProducts } from '../utils/analytics';

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
        
        // Sử dụng AI recommendations thật
        const response = await getPersonalizedRecommendations(4);
        if (response.success && response.data.recommendations.length > 0) {
          setProducts(response.data.recommendations);
        } else {
          // Fallback to regular products if no recommendations
          const fallbackResponse = await api.get('/products?limit=4&sort=newest');
          if (fallbackResponse.data.success) {
            setProducts(fallbackResponse.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        // Final fallback - empty array
        setProducts([]);
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

// Component hiển thị danh mục sản phẩm dạng sidebar
const CategorySidebar = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadCategories = () => {
      try {
        // Load categories from localStorage (same as admin panel)
        const savedCategories = localStorage.getItem('admin_categories');
        if (savedCategories) {
          const parsedCategories = JSON.parse(savedCategories);
          // Transform admin categories format to match the expected format
          const transformedCategories = parsedCategories
            .filter(cat => cat.status === 'active') // Only show active categories
            .map(cat => ({
              _id: cat.id,
              name: cat.name,
              slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
              icon: cat.icon,
              color: cat.color,
              productCount: cat.productCount
            }));
          setCategories(transformedCategories);
        } else {
          // Default categories if localStorage is empty
          const defaultCategories = [
            { _id: 1, name: 'Gaming', slug: 'gaming', icon: 'G', color: '#1976d2', productCount: 285 },
            { _id: 2, name: 'Không xác định', slug: 'khong-xac-dinh', icon: 'K', color: '#757575', productCount: 8 },
            { _id: 3, name: 'General', slug: 'general', icon: 'G', color: '#2e7d32', productCount: 156 }
          ];
          setCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Error loading categories from localStorage:', error);
        // Fallback to default categories
        const defaultCategories = [
          { _id: 1, name: 'Gaming', slug: 'gaming', icon: 'G', color: '#1976d2', productCount: 285 },
          { _id: 2, name: 'Không xác định', slug: 'khong-xac-dinh', icon: 'K', color: '#757575', productCount: 8 },
          { _id: 3, name: 'General', slug: 'general', icon: 'G', color: '#2e7d32', productCount: 156 }
        ];
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
    
    // Listen for localStorage changes (when admin modifies categories)
    const handleStorageChange = (e) => {
      if (e.key === 'admin_categories') {
        loadCategories();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event when categories are updated in the same tab
    const handleCategoriesUpdate = () => {
      loadCategories();
    };
    
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
  }, []);
  
  if (loading) {
    return (
      <Box>
        {[1, 2, 3, 4].map((item) => (
          <Box key={item} sx={{ mb: 1 }}>
            <Skeleton variant="rectangular" height={50} />
          </Box>
        ))}
      </Box>
    );
  }
  
  return (
    <Box>
      {categories.map((category) => (
        <Paper
          key={category._id}
          elevation={0}
          variant="outlined"
          sx={{
            mb: 1,
            p: 2,
            cursor: 'pointer',
            transition: 'all 0.2s',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'primary.light',
              color: 'white',
              transform: 'translateX(4px)'
            },
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
          onClick={() => navigate(`/categories/${category.slug}`)}
        >
          {/* Use icon and color from admin categories */}
          <Box 
            sx={{ 
              width: 32, 
              height: 32, 
              flexShrink: 0,
              bgcolor: category.color || 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
          >
            <Typography variant="body2" color="white" sx={{ fontWeight: 'bold' }}>
              {category.icon || category.name.charAt(0)}
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ fontWeight: 'medium', flex: 1 }}>
            {category.name}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};

// Component hiển thị danh mục sản phẩm
const CategorySection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadCategories = () => {
      try {
        // Load categories from localStorage (same as admin panel)
        const savedCategories = localStorage.getItem('admin_categories');
        if (savedCategories) {
          const parsedCategories = JSON.parse(savedCategories);
          // Transform admin categories format to match the expected format
          const transformedCategories = parsedCategories
            .filter(cat => cat.status === 'active') // Only show active categories
            .map(cat => ({
              _id: cat.id,
              name: cat.name,
              slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
              icon: cat.icon,
              color: cat.color,
              productCount: cat.productCount
            }));
          setCategories(transformedCategories);
        } else {
          // Default categories if localStorage is empty
          const defaultCategories = [
            { _id: 1, name: 'Gaming', slug: 'gaming', icon: 'G', color: '#1976d2', productCount: 285 },
            { _id: 2, name: 'Không xác định', slug: 'khong-xac-dinh', icon: 'K', color: '#757575', productCount: 8 },
            { _id: 3, name: 'General', slug: 'general', icon: 'G', color: '#2e7d32', productCount: 156 }
          ];
          setCategories(defaultCategories);
        }
      } catch (error) {
        console.error('Error loading categories from localStorage:', error);
        // Fallback to default categories
        const defaultCategories = [
          { _id: 1, name: 'Gaming', slug: 'gaming', icon: 'G', color: '#1976d2', productCount: 285 },
          { _id: 2, name: 'Không xác định', slug: 'khong-xac-dinh', icon: 'K', color: '#757575', productCount: 8 },
          { _id: 3, name: 'General', slug: 'general', icon: 'G', color: '#2e7d32', productCount: 156 }
        ];
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
    
    // Listen for localStorage changes (when admin modifies categories)
    const handleStorageChange = (e) => {
      if (e.key === 'admin_categories') {
        loadCategories();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event when categories are updated in the same tab
    const handleCategoriesUpdate = () => {
      loadCategories();
    };
    
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
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
              {/* Use icon and color from admin categories */}
                <Box 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    mb: 1, 
                  bgcolor: category.color || 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%'
                  }}
                >
                  <Typography variant="h6" color="white">
                  {category.icon || category.name.charAt(0)}
                  </Typography>
                </Box>
              
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
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Hero Section with Category Sidebar */}
      <Box sx={{ display: 'flex', width: '100%', position: 'relative' }}>
        {/* Left sidebar - Danh mục sản phẩm (background riêng) */}
        <Box
          sx={{
            width: { xs: 0, md: '240px' }, 
            flexShrink: 0,
            display: { xs: 'none', md: 'block' },
            position: 'relative',
            backgroundColor: '#f8f9fa', // Background riêng cho sidebar
            borderRight: '1px solid #e0e0e0' // Thêm đường viền phân cách
          }}
        >
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              height: '450px',
              overflowY: 'auto',
              borderRadius: 0,
              backgroundColor: 'transparent', // Trong suốt để hiện background của Box cha
              border: 'none',
              m: 0,
              position: 'sticky',
              top: 0
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
              Danh mục sản phẩm
            </Typography>
            <CategorySidebar />
          </Paper>
        </Box>
        
        {/* Right - Hero Slider (background riêng) */}
        <Box sx={{ 
          flex: 1, 
          minWidth: 0,
          backgroundColor: '#fff' // Background riêng cho Hero Slider
        }}>
          <HeroSlider />
        </Box>
      </Box>
      
      {/* Mobile Category Section - hiện trên mobile */}
      <Container maxWidth="lg" sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            Danh mục sản phẩm
          </Typography>
          <CategorySidebar />
        </Paper>
      </Container>
      
      {/* Product Sections */}
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mt: 4 }}>
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
        </Box>
      </Container>
    </Box>
  );
}

export default HomePage;