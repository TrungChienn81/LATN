import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Badge,
  Avatar,
  Divider,
  Chip,
  Button
} from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AdminOverview from '../components/Admin/AdminOverview'; // Import AdminOverview

// import { useAuth } from '../contexts/AuthContext'; // Có thể cần nếu muốn lấy thông tin admin

const AdminDashboardPage = () => {
  const location = useLocation(); // Để biết route hiện tại và làm nổi bật menu item

  const isOverviewPage = location.pathname === '/admin/dashboard/overview';

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard/overview' }, 
    { text: 'Products', icon: <InventoryIcon />, path: '/admin/dashboard/products' }, 
    { text: 'Orders', icon: <ShoppingCartIcon />, path: '/admin/dashboard/orders' },
    { text: 'Customers', icon: <PeopleIcon />, path: '/admin/dashboard/users' }, 
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/dashboard/settings' },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Paper
        elevation={0}
        sx={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#192842', // Tối màu như trong hình mẫu
          color: 'white',
          height: '100%',
          paddingTop: 2,
        }}
      >
        {/* Logo */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', pb: 2, mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
            LATN <Typography component="span" variant="caption" sx={{ color: 'primary.main', fontSize: '0.7rem', fontWeight: 'bold', position: 'relative', top: -8 }}>Admin</Typography>
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
        
        <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<AccountCircleIcon />}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              justifyContent: 'flex-start',
              textTransform: 'none',
            }}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#F5F7FB', height: '100vh', overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome, Admin
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton color="default" sx={{ bgcolor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Badge badgeContent={4} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton color="default" sx={{ bgcolor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Profile">
              <IconButton color="default" sx={{ bgcolor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <AccountCircleIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {/* Content */}
        <Box sx={{ bgcolor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {isOverviewPage ? <AdminOverview /> : <Outlet />}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage; 