import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Container } from '@mui/material';
import Navbar from './Navbar'; // Sử dụng cùng Navbar
import Footer from './Footer'; // Sử dụng cùng Footer

const PublicLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar />
      {/* Có Container giới hạn chiều rộng ở đây */}
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}> 
        <Outlet /> {/* Nội dung các trang public sẽ render ở đây */}
      </Container>
      <Footer />
    </Box>
  );
};

export default PublicLayout; 