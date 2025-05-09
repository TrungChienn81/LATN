import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Navbar from './Navbar'; // Sử dụng cùng Navbar
import Footer from './Footer'; // Sử dụng cùng Footer

const AdminLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar />
      {/* Không có Container giới hạn chiều rộng ở đây */}
      <Box component="main" sx={{ flexGrow: 1 }}> 
        <Outlet /> {/* Nội dung trang admin (ví dụ: AdminDashboardPage) sẽ render ở đây */}
      </Box>
      <Footer />
    </Box>
  );
};

export default AdminLayout; 