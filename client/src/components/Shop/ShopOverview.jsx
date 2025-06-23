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
  Paper,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';
import { formatPriceToVND } from '../../utils/formatters';

const ShopOverview = () => {
  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch shop info
      const shopResponse = await api.get('/shops/my-shop');
      if (shopResponse.data.success) {
        setShop(shopResponse.data.data);
      }

      // Fetch real stats from API
      const statsResponse = await api.get('/shops/my-shop/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Có lỗi xảy ra khi tải dữ liệu shop');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return formatPriceToVND(amount / 1000000); // Convert back to millions for formatter
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending_approval': return 'warning';
      case 'rejected': return 'error';
      case 'active': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return 'Đã phê duyệt';
      case 'pending_approval': return 'Chờ phê duyệt';
      case 'rejected': return 'Bị từ chối';
      case 'active': return 'Hoạt động';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchData} sx={{ mt: 2 }}>
          Thử lại
        </Button>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Không có dữ liệu thống kê</Alert>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Tổng sản phẩm',
      value: stats.summary.totalProducts,
      subValue: `${stats.summary.activeProducts} đang bán`,
      icon: <InventoryIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
      trend: stats.summary.outOfStockProducts > 0 ? 'warning' : 'stable'
    },
    {
      title: 'Đơn hàng',
      value: stats.summary.totalOrders,
      subValue: `${stats.summary.pendingOrders} đang chờ`,
      icon: <ShoppingCartIcon />,
      color: '#388e3c',
      bgColor: '#e8f5e8',
      trend: stats.summary.pendingOrders > 0 ? 'up' : 'stable'
    },
    {
      title: 'Khách hàng',
      value: stats.summary.totalCustomers,
      subValue: 'Khách hàng duy nhất',
      icon: <PeopleIcon />,
      color: '#f57c00',
      bgColor: '#fff3e0',
      trend: 'stable'
    },
    {
      title: 'Doanh thu',
      value: formatCurrency(stats.summary.totalRevenue),
      subValue: `TB: ${formatCurrency(stats.summary.avgOrderValue)}`,
      icon: <TrendingUpIcon />,
      color: '#7b1fa2',
      bgColor: '#f3e5f5',
      trend: 'up'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Chào mừng trở lại!
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Đây là tổng quan về shop {shop?.shopName} của bạn
          </Typography>
          <Chip 
            label={getStatusLabel(shop?.status)} 
            color={getStatusColor(shop?.status)}
            size="small"
          />
        </Box>
        
        {stats.summary.outOfStockProducts > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>{stats.summary.outOfStockProducts}</strong> sản phẩm đã hết hàng. 
            Hãy cập nhật kho để không bỏ lỡ đơn hàng!
          </Alert>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
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
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {typeof stat.value === 'number' && stat.title !== 'Doanh thu' 
                        ? stat.value.toLocaleString() 
                        : stat.value
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.subValue}
                    </Typography>
                  </Box>
                  
                  {/* Trend Indicator */}
                  {stat.trend === 'up' && (
                    <TrendingUpIcon color="success" fontSize="small" />
                  )}
                  {stat.trend === 'warning' && (
                    <WarningIcon color="warning" fontSize="small" />
                  )}
                </Box>
                
                {/* Progress bar for completion rate */}
                {stat.title === 'Đơn hàng' && stats.summary.totalOrders > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.summary.completedOrders / stats.summary.totalOrders) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {Math.round((stats.summary.completedOrders / stats.summary.totalOrders) * 100)}% hoàn thành
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Top Products & Quick Actions */}
      <Grid container spacing={3}>
        {/* Top Products */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Sản phẩm bán chạy
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {stats.topProducts && stats.topProducts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="center">Đã bán</TableCell>
                        <TableCell align="right">Doanh thu</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topProducts.map((product, index) => (
                        <TableRow key={product._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip 
                                label={index + 1} 
                                size="small" 
                                color="primary" 
                                sx={{ mr: 1, minWidth: 24 }}
                              />
                              <Typography variant="body2">
                                {product.productName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight="bold">
                              {product.totalSold}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="primary">
                              {formatCurrency(product.revenue / 1000000)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có dữ liệu bán hàng
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Hành động nhanh
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/my-shop/products"
                    sx={{ py: 1.5, mb: 1 }}
                  >
                    Thêm sản phẩm mới
                  </Button>
                </Grid>
                <Grid item xs={6}>
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
                <Grid item xs={6}>
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
                <Grid item xs={6}>
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
                <Grid item xs={6}>
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

              {/* Quick Stats */}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Thống kê nhanh
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Tỷ lệ hoàn thành đơn hàng:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {stats.summary.totalOrders > 0 
                    ? Math.round((stats.summary.completedOrders / stats.summary.totalOrders) * 100)
                    : 0
                  }%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Sản phẩm hết hàng:
                </Typography>
                <Typography variant="body2" fontWeight="bold" color={stats.summary.outOfStockProducts > 0 ? 'error' : 'success'}>
                  {stats.summary.outOfStockProducts}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      {stats.monthlyStats && stats.monthlyStats.length > 0 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Xu hướng 6 tháng gần nhất
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tháng</TableCell>
                        <TableCell align="center">Đơn hàng</TableCell>
                        <TableCell align="right">Doanh thu</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.monthlyStats.map((monthData, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {monthData._id.month}/{monthData._id.year}
                          </TableCell>
                          <TableCell align="center">
                            {monthData.orders}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(monthData.revenue / 1000000)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ShopOverview; 