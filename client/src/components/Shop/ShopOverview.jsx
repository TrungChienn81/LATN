import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Button,
  Divider,
  Paper
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';

const ShopOverview = () => {
  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch shop info
      const shopResponse = await api.get('/shops/my-shop');
      if (shopResponse.data.success) {
        setShop(shopResponse.data.data);
      }

      // TODO: Fetch stats from API when available
      // For now, using mock data
      setStats({
        totalProducts: 25,
        totalOrders: 12,
        totalCustomers: 8,
        revenue: 2500000
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Tổng sản phẩm',
      value: stats.totalProducts,
      icon: <InventoryIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd'
    },
    {
      title: 'Đơn hàng',
      value: stats.totalOrders,
      icon: <ShoppingCartIcon />,
      color: '#388e3c',
      bgColor: '#e8f5e8'
    },
    {
      title: 'Khách hàng',
      value: stats.totalCustomers,
      icon: <PeopleIcon />,
      color: '#f57c00',
      bgColor: '#fff3e0'
    },
    {
      title: 'Doanh thu',
      value: formatCurrency(stats.revenue),
      icon: <TrendingUpIcon />,
      color: '#7b1fa2',
      bgColor: '#f3e5f5'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Đang tải...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Chào mừng trở lại!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Đây là tổng quan về shop {shop?.shopName} của bạn
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '8px',
                      backgroundColor: stat.bgColor,
                      color: stat.color,
                      mr: 2
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {typeof stat.value === 'number' && stat.title !== 'Doanh thu' 
                        ? stat.value.toLocaleString() 
                        : stat.value
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Hành động nhanh
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/my-shop/products"
                    sx={{ py: 1.5 }}
                  >
                    Thêm sản phẩm
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<InventoryIcon />}
                    component={RouterLink}
                    to="/my-shop/products"
                    sx={{ py: 1.5 }}
                  >
                    Quản lý sản phẩm
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ShoppingCartIcon />}
                    component={RouterLink}
                    to="/my-shop/orders"
                    sx={{ py: 1.5 }}
                  >
                    Xem đơn hàng
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VisibilityIcon />}
                    component={RouterLink}
                    to={`/shop/${shop?._id}`}
                    sx={{ py: 1.5 }}
                  >
                    Xem shop
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditIcon />}
                    component={RouterLink}
                    to="/my-shop/settings"
                    sx={{ py: 1.5 }}
                  >
                    Cài đặt shop
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Thông tin shop
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={shop?.logoUrl}
                  sx={{ width: 56, height: 56, mr: 2 }}
                >
                  LATN
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {shop?.shopName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {shop?.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {shop?.description || 'Chưa có mô tả'}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {shop?.contactEmail || 'Chưa cập nhật'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>SĐT:</strong> {shop?.contactPhone || 'Chưa cập nhật'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Địa chỉ:</strong> {shop?.address?.city || 'Chưa cập nhật'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ShopOverview; 