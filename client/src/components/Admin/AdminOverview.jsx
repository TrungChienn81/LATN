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
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemIcon,
  ListItemSecondaryAction
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
import CategoryIcon from '@mui/icons-material/Category';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

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

  // Category management state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  
  // Default categories data
  const defaultCategories = [
    { id: 1, name: 'Gaming', icon: 'G', color: '#1976d2', productCount: 285, status: 'active' },
    { id: 2, name: 'Không xác định', icon: 'K', color: '#757575', productCount: 8, status: 'active' },
    { id: 3, name: 'General', icon: 'G', color: '#2e7d32', productCount: 156, status: 'active' },
    { id: 4, name: 'Văn phòng', icon: 'V', color: '#ed6c02', productCount: 198, status: 'active' },
    { id: 5, name: 'Linh kiện PC', icon: 'L', color: '#9c27b0', productCount: 156, status: 'active' },
    { id: 6, name: 'Phụ kiện', icon: 'P', color: '#d32f2f', productCount: 217, status: 'active' }
  ];
  
  // Load categories from localStorage or use default
  const [categories, setCategories] = useState(() => {
    const savedCategories = localStorage.getItem('admin_categories');
    return savedCategories ? JSON.parse(savedCategories) : defaultCategories;
  });
  
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', color: '#1976d2' });

  // Save categories to localStorage whenever categories change
  useEffect(() => {
    localStorage.setItem('admin_categories', JSON.stringify(categories));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('categoriesUpdated'));
  }, [categories]);
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(prev => ({ ...prev, loading: false }));
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Category management functions
  const handleOpenCategoryDialog = () => {
    setCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    setNewCategory({ name: '', icon: '', color: '#1976d2' });
  };

  const handleAddCategory = () => {
    if (newCategory.name && newCategory.icon) {
      const newCat = {
        id: Math.max(...categories.map(c => c.id)) + 1,
        ...newCategory,
        productCount: 0,
        status: 'active'
      };
      setCategories([...categories, newCat]);
      setNewCategory({ name: '', icon: '', color: '#1976d2' });
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
  };

  const handleSaveEdit = () => {
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id ? editingCategory : cat
    ));
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
    }
  };

  const handleResetCategories = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại tất cả danh mục mặc định? Điều này sẽ xóa tất cả thay đổi.')) {
      setCategories(defaultCategories);
      localStorage.setItem('admin_categories', JSON.stringify(defaultCategories));
    }
  };
  
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
      
      {/* Quản lý Catalogue */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quản lý Catalogue
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tổng quan về danh mục sản phẩm và thương hiệu
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CategoryIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Tổng danh mục
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {categories.length}
                </Typography>
                <Typography variant="body2" color="success.main">
                  +3 danh mục mới
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <InventoryIcon sx={{ color: 'info.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Sản phẩm
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {categories.reduce((total, cat) => total + cat.productCount, 0)}
                </Typography>
                <Typography variant="body2" color="info.main">
                  Tổng sản phẩm
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LaptopIcon sx={{ color: 'warning.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Danh mục hoạt động
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {categories.filter(cat => cat.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((categories.filter(cat => cat.status === 'active').length / categories.length) * 100)}% tổng danh mục
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Danh mục phổ biến
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight="bold">
                  {categories.reduce((max, cat) => cat.productCount > max.productCount ? cat : max, categories[0])?.name || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {categories.reduce((max, cat) => cat.productCount > max.productCount ? cat : max, categories[0])?.productCount || 0} sản phẩm
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>
        
        <DashboardTable component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="catalogue table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
                <TableCell>BIỂU TƯỢNG</TableCell>
                <TableCell>DANH MỤC</TableCell>
                <TableCell>SỐ LƯỢNG SẢN PHẨM</TableCell>
                <TableCell>TRẠNG THÁI</TableCell>
                <TableCell>CẬP NHẬT GẦN NHẤT</TableCell>
                <TableCell align="right">THAO TÁC</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Avatar sx={{ bgcolor: category.color, width: 32, height: 32 }}>
                      {category.icon}
                    </Avatar>
                  </TableCell>
                  <TableCell component="th" scope="row" sx={{ color: 'primary.main', fontWeight: 500 }}>
                    {category.name}
                  </TableCell>
                  <TableCell>{category.productCount}</TableCell>
                  <TableCell>
                    <StatusChip 
                      label={category.status === 'active' ? 'Hoạt động' : 'Không hoạt động'} 
                      status="Completed" 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>2 giờ trước</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="primary" sx={{ textTransform: 'none', mr: 1 }} onClick={() => handleEditCategory(category)}>
                      Chỉnh sửa
                    </Button>
                    <Button size="small" color="error" sx={{ textTransform: 'none' }} onClick={() => handleDeleteCategory(category.id)}>
                      Xóa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DashboardTable>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            variant="text" 
            color="primary"
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: 'none' }}
          >
            Xem tất cả danh mục
          </Button>
          <Button 
            variant="contained" 
            color="warning"
            startIcon={<AddIcon />}
            sx={{ textTransform: 'none' }}
            onClick={handleOpenCategoryDialog}
          >
            Thêm danh mục mới
          </Button>
        </Box>
      </Box>
      
      {/* Các thẻ chức năng */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
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
        
        <Grid item xs={12} md={6} lg={3}>
          <FeatureCard>
            <FeatureIcon sx={{ bgcolor: 'warning.main' }}>
              <CategoryIcon />
            </FeatureIcon>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Quản lý Catalogue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Quản lý danh mục sản phẩm, thương hiệu và phân loại
            </Typography>
            <Button 
              variant="contained" 
              color="warning"
              sx={{ mt: 'auto', alignSelf: 'flex-start', textTransform: 'none' }}
              onClick={handleOpenCategoryDialog}
            >
              Quản lý danh mục
            </Button>
          </FeatureCard>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
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
        
        <Grid item xs={12} md={6} lg={3}>
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

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog} maxWidth="md" fullWidth>
        <DialogTitle>Quản lý Danh mục Sản phẩm</DialogTitle>
        <DialogContent>
          {/* Add new category form */}
          <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>Thêm danh mục mới</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  autoFocus
                  margin="dense"
                  id="name"
                  label="Tên danh mục"
                  type="text"
                  fullWidth
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  margin="dense"
                  id="icon"
                  label="Biểu tượng (1 ký tự)"
                  type="text"
                  fullWidth
                  inputProps={{ maxLength: 1 }}
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value.toUpperCase() })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  margin="dense"
                  id="color"
                  label="Màu sắc"
                  type="color"
                  fullWidth
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                />
              </Grid>
            </Grid>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={handleAddCategory}
              disabled={!newCategory.name || !newCategory.icon}
            >
              Thêm danh mục
            </Button>
          </Box>

          {/* List of existing categories */}
          <Typography variant="h6" gutterBottom>Danh sách danh mục hiện có</Typography>
          <List>
            {categories.map((category) => (
              <ListItem key={category.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: category.color, width: 40, height: 40 }}>
                    {category.icon}
                  </Avatar>
                </ListItemIcon>
                <ListItemText 
                  primary={editingCategory?.id === category.id ? (
                    <TextField
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      size="small"
                      sx={{ mr: 2 }}
                    />
                  ) : category.name}
                  secondary={`${category.productCount} sản phẩm • ${category.status}`}
                />
                <ListItemSecondaryAction>
                  {editingCategory?.id === category.id ? (
                    <Box>
                      <IconButton 
                        edge="end" 
                        aria-label="save"
                        onClick={handleSaveEdit}
                        color="primary"
                        sx={{ mr: 1 }}
                      >
                        <SaveIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="cancel"
                        onClick={() => setEditingCategory(null)}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEditCategory(category)}
                        color="primary"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteCategory(category.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetCategories} color="warning">
            Khôi phục mặc định
          </Button>
          <Button onClick={handleCloseCategoryDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminOverview;