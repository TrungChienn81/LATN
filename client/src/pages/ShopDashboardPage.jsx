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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load shop information
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await api.get('/shops/my-shop');
        if (response.data.success) {
          setShop(response.data.data);
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
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/my-shop/overview' }, 
    { text: 'Sản phẩm', icon: <InventoryIcon />, path: '/my-shop/products' }, 
    { text: 'Đơn hàng', icon: <ShoppingCartIcon />, path: '/my-shop/orders' },
    { text: 'Khách hàng', icon: <PeopleIcon />, path: '/my-shop/customers' }, 
    { text: 'Thống kê', icon: <BarChartIcon />, path: '/my-shop/analytics' },
    { text: 'Cài đặt', icon: <SettingsIcon />, path: '/my-shop/settings' },
  ];

  // Sidebar content component
  const SidebarContent = () => (
    <Box>
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pb: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
          {shop?.shopName || 'Shop Dashboard'}
        </Typography>
      </Box>
      
      {/* Menu Items */}
      <List component="nav" sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            component={RouterLink}
            to={item.path}
            selected={location.pathname.startsWith(item.path)}
            button={false}
            onClick={() => setMobileMenuOpen(false)}
            sx={{
              mb: 1,
              borderRadius: '8px',
              color: location.pathname.startsWith(item.path) ? 'white' : 'rgba(255, 255, 255, 0.6)',
              backgroundColor: location.pathname.startsWith(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              padding: '8px 16px',
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: location.pathname.startsWith(item.path) ? 'white' : 'rgba(255, 255, 255, 0.6)' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      {/* Logout Button */}
      <Box sx={{ p: 2, mt: 'auto' }}>
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
            bgcolor: '#192842',
            color: 'white',
            paddingTop: 2,
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
            bgcolor: '#192842',
            color: 'white',
          },
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        ml: isMobile ? 0 : '240px', // Add left margin to account for fixed sidebar
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <Box sx={{ 
          bgcolor: '#f8fafc', 
          px: isMobile ? 2 : 4, 
          py: 3, 
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: isMobile ? 2 : 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={() => setMobileMenuOpen(true)}
                  sx={{ mr: 2, color: 'text.primary' }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Box>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                  {shop?.shopName || 'Shop Dashboard'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chào mừng, {user?.username || 'Shop Owner'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Thông báo">
                <IconButton color="default" sx={{ bgcolor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <Badge badgeContent={1} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              {!isMobile && (
                <>
                  <Tooltip title="Cài đặt">
                    <IconButton color="default" sx={{ bgcolor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Hồ sơ">
                    <IconButton color="default" sx={{ bgcolor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <AccountCircleIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
        </Box>
        
        {/* Content */}
        <Box sx={{ 
          flexGrow: 1,
          overflow: 'auto',
          p: 3,
          bgcolor: '#f8fafc'
        }}>
          <Box sx={{ 
            bgcolor: 'white', 
            borderRadius: '10px', 
            overflow: 'hidden', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            minHeight: '100%'
          }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ShopDashboardPage; 