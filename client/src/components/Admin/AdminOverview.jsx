import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader, 
  Avatar, 
  IconButton, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Link
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import LaptopIcon from '@mui/icons-material/Laptop';
import ComputerIcon from '@mui/icons-material/Computer';
import MemoryIcon from '@mui/icons-material/Memory';
import MouseIcon from '@mui/icons-material/Mouse';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TableViewIcon from '@mui/icons-material/TableView';
import RecommendIcon from '@mui/icons-material/Recommend';
import ArticleIcon from '@mui/icons-material/Article';

// Styled components
const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s, box-shadow 0.3s',
  borderRadius: '10px',
  overflow: 'hidden',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[3],
  },
}));

const DashboardTable = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(3),
  borderRadius: '10px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: '4px',
  fontWeight: 500,
  fontSize: '0.75rem',
  backgroundColor: 
    status === 'Completed' ? 'rgba(46, 189, 133, 0.1)' : 
    status === 'Processing' ? 'rgba(83, 166, 250, 0.1)' : 
    status === 'Shipped' ? 'rgba(142, 84, 233, 0.1)' : 
    'rgba(255, 0, 0, 0.1)',
  color: 
    status === 'Completed' ? theme.palette.success.main : 
    status === 'Processing' ? theme.palette.info.main : 
    status === 'Shipped' ? 'rgb(142, 84, 233)' : 
    theme.palette.error.main,
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: '10px',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  '&:hover': {
    boxShadow: theme.shadows[3],
  },
}));

const FeatureIcon = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  width: 40,
  height: 40,
  marginBottom: theme.spacing(1.5),
}));

const AdminOverview = () => {
  // Mock data - trong thực tế sẽ được lấy từ API
  const [stats, setStats] = useState({
    revenue: { total: 52489, growth: 12.5 },
    orders: { total: 285, growth: 16.7 },
    customers: { total: 1423, growth: 4.3 },
    inventory: { total: 864, growth: -3.5 },
    loading: true
  });
  
  const [recentOrders, setRecentOrders] = useState([
    { id: 'ORD-5233', customer: 'John Smith', date: '3 min ago', status: 'Completed', amount: 1295.00 },
    { id: 'ORD-7645', customer: 'Sarah Johnson', date: '15 min ago', status: 'Processing', amount: 859.00 },
    { id: 'ORD-5291', customer: 'Michael Brown', date: '1 hour ago', status: 'Completed', amount: 2160.50 },
    { id: 'ORD-4832', customer: 'Emma Wilson', date: '3 hours ago', status: 'Shipped', amount: 889.00 },
    { id: 'ORD-3926', customer: 'James Taylor', date: '5 hours ago', status: 'Completed', amount: 1495.90 },
  ]);
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(prev => ({ ...prev, loading: false }));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount * 23000); // Chuyển đổi USD sang VND
  };
  
  // Format number with thousand separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Thẻ thống kê - 4 thẻ: Doanh thu, Đơn hàng, Khách hàng, Tồn kho */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tổng doanh thu
              </Typography>
              {stats.loading ? (
                <CircularProgress size={24} thickness={4} />
              ) : (
                <>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {formatNumber(stats.revenue.total * 23000)} ₫
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="success.main" sx={{ mr: 1 }}>
                      +{stats.revenue?.growth || 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      from last month
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Đơn hàng
              </Typography>
              {stats.loading ? (
                <CircularProgress size={24} thickness={4} />
              ) : (
                <>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {formatNumber(stats.orders.total)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="success.main" sx={{ mr: 1 }}>
                      +{stats.orders?.growth || 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      from last month
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Khách hàng
              </Typography>
              {stats.loading ? (
                <CircularProgress size={24} thickness={4} />
              ) : (
                <>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {formatNumber(stats.customers.total)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="success.main" sx={{ mr: 1 }}>
                      +{stats.customers?.growth || 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      from last month
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </StatsCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Tồn kho
              </Typography>
              {stats.loading ? (
                <CircularProgress size={24} thickness={4} />
              ) : (
                <>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                    {formatNumber(stats.inventory.total)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="error.main" sx={{ mr: 1 }}>
                      {stats.inventory?.growth || 0}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      from last month
                    </Typography>
                  </Box>
                </>
              )}
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
      
      {/* Bảng đơn hàng gần đây */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Đơn hàng gần đây
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Danh sách đơn hàng mới nhất từ tất cả các cửa hàng
        </Typography>
        
        <DashboardTable component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="recent orders table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                <TableCell>MÃ ĐƠN</TableCell>
                <TableCell>KHÁCH HÀNG</TableCell>
                <TableCell>NGÀY</TableCell>
                <TableCell>TRẠNG THÁI</TableCell>
                <TableCell>TỔNG TIỀN</TableCell>
                <TableCell align="right">THAO TÁC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell component="th" scope="row" sx={{ color: 'primary.main', fontWeight: 500 }}>
                    {order.id}
                  </TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <StatusChip 
                      label={order.status} 
                      status={order.status} 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(order.amount)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="primary" sx={{ textTransform: 'none' }}>
                      Xem
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardTable>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="text" 
            color="primary"
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: 'none' }}
          >
            Xem tất cả đơn hàng
          </Button>
        </Box>
      </Box>
      
      {/* Các thẻ chức năng */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FeatureCard>
            <FeatureIcon>
              <AddIcon />
            </FeatureIcon>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Thêm sản phẩm mới
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tạo sản phẩm mới với thông số kỹ thuật chi tiết
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              sx={{ mt: 'auto', alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Thêm sản phẩm
            </Button>
          </FeatureCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FeatureCard>
            <FeatureIcon sx={{ bgcolor: 'primary.dark' }}>
              <RecommendIcon />
            </FeatureIcon>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Huấn luyện AI gợi ý
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Cập nhật và huấn luyện hệ thống AI gợi ý sản phẩm
            </Typography>
            <Button 
              variant="outlined" 
              color="primary"
              sx={{ mt: 'auto', alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Bắt đầu huấn luyện
            </Button>
          </FeatureCard>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FeatureCard>
            <FeatureIcon sx={{ bgcolor: 'success.main' }}>
              <ArticleIcon />
            </FeatureIcon>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Xuất báo cáo bán hàng
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tạo và xuất báo cáo bán hàng chi tiết
            </Typography>
            <Button 
              variant="outlined" 
              color="success"
              sx={{ mt: 'auto', alignSelf: 'flex-start', textTransform: 'none' }}
            >
              Tạo báo cáo
            </Button>
          </FeatureCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminOverview;