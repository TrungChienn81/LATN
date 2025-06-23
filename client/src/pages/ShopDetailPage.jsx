import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  Rating,
  CircularProgress,
  Card,
  CardContent,
  Tab,
  Tabs
} from '@mui/material';
import {
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Message as MessageIcon,
  Add as AddIcon
} from '@mui/icons-material';
import api from '../services/api';
import ProductCardNew from '../components/product/ProductCardNew';
import { ImageWithFallback } from '../components/common/ImageWithFallback';

const ShopDetailPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchShopData();
    fetchShopProducts();
  }, [shopId]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/shops/${shopId}/stats`);
      if (response.data.success) {
        setShop(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
      setError('Không tìm thấy shop hoặc shop không tồn tại');
    } finally {
      setLoading(false);
    }
  };

  const fetchShopProducts = async (page = 1) => {
    try {
      setProductLoading(true);
      const response = await api.get('/products', {
        params: {
          shopId: shopId,
          page: page,
          limit: 20
        }
      });
      
      if (response.data.success) {
        setProducts(response.data.data);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching shop products:', error);
    } finally {
      setProductLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải thông tin shop...</Typography>
      </Box>
    );
  }

  if (error || !shop) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Không tìm thấy shop
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {error || 'Shop không tồn tại hoặc đã bị xóa'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Quay về trang chủ
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Shop Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Grid container spacing={3} alignItems="center">
            {/* Shop Avatar */}
            <Grid item xs={12} md={3}>
              <Avatar
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  border: '3px solid #fff',
                  boxShadow: 2
                }}
                src={shop.logoUrl}
              >
                {shop.logoUrl ? null : <StoreIcon fontSize="large" />}
              </Avatar>
            </Grid>

            {/* Shop Info */}
            <Grid item xs={12} md={9}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mb: 1 }}>
                  {shop.shopName}
                </Typography>
                
                {shop.description && (
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {shop.description}
                  </Typography>
                )}

                {/* Stats - Only show product count */}
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item>
                    <Typography variant="body2">
                      <strong>{formatNumber(shop.stats?.productCount || 0)}</strong>
                      <span style={{ color: '#666', marginLeft: '4px' }}>Sản Phẩm</span>
                    </Typography>
                  </Grid>
                </Grid>

                {/* Join Date */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Tham gia {shop.stats?.joinedMonths || 1} tháng trước
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Shop Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{ 
              borderBottom: '1px solid #e0e0e0',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 }
            }}
          >
            <Tab label={`Tất Cả Sản Phẩm (${shop.stats?.productCount || 0})`} />
            <Tab label="Thông Tin Shop" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {currentTab === 0 && (
          <Box>
            {productLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Đang tải sản phẩm...</Typography>
              </Box>
            ) : products.length > 0 ? (
              <Grid container spacing={2}>
                {products.map((product) => (
                  <Grid item xs={6} sm={4} md={2.4} key={product._id}>
                    <ProductCardNew product={product} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Shop này chưa có sản phẩm nào
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {currentTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Thông Tin Shop
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tên Shop
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {shop.shopName}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email Liên Hệ
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {shop.contactEmail || 'Chưa cập nhật'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Số Điện Thoại
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {shop.contactPhone || 'Chưa cập nhật'}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Địa Chỉ
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {shop.address?.street ? 
                    `${shop.address.street}, ${shop.address.city || ''}`.trim().replace(/,$/, '') : 
                    'Chưa cập nhật'
                  }
                </Typography>
              </Grid>

              {shop.description && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Mô Tả Shop
                  </Typography>
                  <Typography variant="body1">
                    {shop.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default ShopDetailPage; 