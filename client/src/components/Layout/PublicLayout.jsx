import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Navbar from './Navbar'; // Sử dụng cùng Navbar
import Footer from './Footer'; // Sử dụng cùng Footer

const PublicLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar />
      {/* Remove Container wrapper để các trang có thể tự quản lý layout */}
      <Box component="main" sx={{ flexGrow: 1, pt: 2 }}> 
        <Outlet /> {/* Nội dung các trang public sẽ render ở đây */}
      </Box>
      <Footer />
    </Box>
  );
};

export default PublicLayout; 