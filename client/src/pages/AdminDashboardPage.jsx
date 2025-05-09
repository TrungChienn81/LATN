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
} from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminOverview from '../components/Admin/AdminOverview'; // Import AdminOverview

// import { useAuth } from '../contexts/AuthContext'; // Có thể cần nếu muốn lấy thông tin admin

const AdminDashboardPage = () => {
  const location = useLocation(); // Để biết route hiện tại và làm nổi bật menu item

  const isOverviewPage = location.pathname === '/admin/dashboard/overview';

  const menuItems = [
    // Sửa path cho "Tổng quan" để nó là một sub-route cụ thể
    { text: 'Tổng quan', icon: <DashboardIcon />, path: '/admin/dashboard/overview' }, 
    { text: 'Quản lý Người dùng', icon: <PeopleIcon />, path: '/admin/dashboard/users' }, // <<< Sửa path
    { text: 'Quản lý Sản phẩm', icon: <CategoryIcon />, path: '/admin/dashboard/products' }, // <<< Sửa path
    { text: 'Quản lý Gian hàng', icon: <StorefrontIcon />, path: '/admin/dashboard/shops' },    // <<< Sửa path
    { text: 'Quản lý Đơn hàng', icon: <BarChartIcon />, path: '/admin/dashboard/orders' },   // <<< Sửa path
    { text: 'Cài đặt Hệ thống', icon: <SettingsIcon />, path: '/admin/dashboard/settings' }, // <<< Sửa path
  ];

  return (
    <Box sx={{ mt: {xs: 1, md: 2}, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: {xs: 2, md: 3}, px: { xs: 2, sm: 3 } }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={{ xs: 1, sm: 2 }}>
        {/* Phần Sidebar Menu */}
        <Grid item xs={12} sm={4} md={3} lg={2}>
          <Paper elevation={0} sx={{ p: {xs:1, sm:1.5}, border: '1px solid rgba(0,0,0,0.12)', height: '100%', borderRadius: '8px' }}>
            <List component="nav" dense>
              {menuItems.map((item) => (
                <ListItem 
                  button 
                  key={item.text} 
                  component={RouterLink} 
                  to={item.path}
                  selected={location.pathname.startsWith(item.path)}
                  sx={{ 
                    mb: 0.5,
                    borderRadius: '4px',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      }
                    },
                  }}
                >
                  <ListItemIcon sx={{minWidth: 36}}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body2' }}/>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Phần Nội dung Chính */}
        <Grid item xs={12} sm={8} md={9} lg={10}>
          <Paper 
            elevation={2}
            sx={{
              p: { xs: 2, sm: 3 },
              minHeight: '80vh', 
              width: '100%', 
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {isOverviewPage ? <AdminOverview /> : <Outlet />}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboardPage; 