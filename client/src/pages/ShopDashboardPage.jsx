import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Badge,
  Button,
  useMediaQuery,
  useTheme,
  Drawer
} from '@mui/material';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const ShopDashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load shop information and check for pending orders
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await api.get('/shops/my-shop');
        if (response.data.success) {
          setShop(response.data.data);
        }

        // Check for pending orders for notification badge
        try {
          const statsResponse = await api.get('/shops/my-shop/stats');
          if (statsResponse.data.success) {
            setOrderNotifications(statsResponse.data.data.summary.pendingOrders || 0);
          }
        } catch (statsError) {
          console.log('Stats not available yet');
        }
      } catch (error) {
        console.error('Error fetching shop:', error);
        if (error.response?.status === 404) {
          toast.error('Bạn chưa có shop. Vui lòng tạo shop trước.');
          navigate('/create-shop');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/my-shop/overview',
      description: 'Tổng quan shop của bạn'
    }, 
    { 
      text: 'Sản phẩm', 
      icon: <InventoryIcon />, 
      path: '/my-shop/products',
      description: 'Quản lý sản phẩm'
    }, 
    { 
      text: 'Đơn hàng', 
      icon: <ShoppingCartIcon />, 
      path: '/my-shop/orders',
      badge: orderNotifications,
      description: 'Quản lý đơn hàng'
    },
    { 
      text: 'Phân tích', 
      icon: <AssessmentIcon />, 
      path: '/my-shop/analytics',
      description: 'Báo cáo và thống kê'
    },
    { 
      text: 'Khách hàng', 
      icon: <PeopleIcon />, 
      path: '/my-shop/customers',
      description: 'Quản lý khách hàng'
    }, 
    { 
      text: 'Cài đặt', 
      icon: <SettingsIcon />, 
      path: '/my-shop/settings',
      description: 'Cài đặt shop'
    },
  ];

  // Sidebar content component
  const SidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Shop Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pb: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
          {shop?.shopName || 'Shop Dashboard'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          {shop?.status === 'approved' ? '✅ Đã phê duyệt' : '⏳ Chờ phê duyệt'}
        </Typography>
      </Box>
      
      {/* Menu Items */}
      <List component="nav" sx={{ px: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.text} title={item.description} placement="right">
            <ListItem
              component={RouterLink}
              to={item.path}
              selected={location.pathname.startsWith(item.path)}
              onClick={() => setMobileMenuOpen(false)}
              sx={{
                mb: 1,
                borderRadius: '8px',
                color: location.pathname.startsWith(item.path) ? 'white' : 'rgba(255, 255, 255, 0.6)',
                backgroundColor: location.pathname.startsWith(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                },
                padding: '8px 16px',
                textDecoration: 'none',
                position: 'relative'
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 36, 
                color: location.pathname.startsWith(item.path) ? 'white' : 'rgba(255, 255, 255, 0.6)' 
              }}>
                {item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          </Tooltip>
        ))}
      </List>
      
      {/* User Info & Logout */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AccountCircleIcon sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.6)' }} />
          <Box>
            <Typography variant="body2" sx={{ color: 'white' }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Shop Owner
            </Typography>
          </Box>
        </Box>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Đăng xuất
        </Button>
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Đang tải...</Typography>
      </Box>
    );
  }

  if (!shop) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Không tìm thấy thông tin shop</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Paper
          elevation={0}
          sx={{
            width: 240,
            flexShrink: 0,
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            zIndex: 1200,
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#1a237e', // Updated color scheme
            color: 'white',
            overflowY: 'auto',
          }}
        >
          <SidebarContent />
        </Paper>
      )}

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: 240,
            bgcolor: '#1a237e',
            color: 'white',
          },
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: '#f5f5f5',
          height: '100vh',
          overflow: 'auto',
          marginLeft: { xs: 0, sm: '240px' },
        }}
      >
        {/* Mobile Header */}
        {isMobile && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 2, 
            bgcolor: 'white',
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <IconButton
              color="primary"
              aria-label="open drawer"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>
              {shop?.shopName}
            </Typography>
            {orderNotifications > 0 && (
              <Badge badgeContent={orderNotifications} color="error">
                <NotificationsIcon />
              </Badge>
            )}
          </Box>
        )}

        {/* Page Content */}
        <Outlet context={{ shop, refreshShopData: () => window.location.reload() }} />
      </Box>
    </Box>
  );
};

export default ShopDashboardPage; 