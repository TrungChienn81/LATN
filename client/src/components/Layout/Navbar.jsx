// src/components/Layout/Navbar.jsx
import React from 'react';
// Đảm bảo đã import Box
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        {/* Logo/Title */}
        <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          LATN Shop
        </Typography>

        {/* === BỌC CÁC NÚT BẰNG BOX === */}
        <Box sx={{ display: 'flex', gap: 2 }}> {/* gap: 2 tạo khoảng cách giữa các items */}
          {/* Các nút Button giờ nằm trong Box */}
          <Button color="inherit" component={RouterLink} to="/products">
            Sản phẩm
          </Button>
          <Button color="inherit" component={RouterLink} to="/login">
            Đăng nhập
          </Button>
          <Button color="inherit" component={RouterLink} to="/register">
            Đăng ký
          </Button>
          {/* <Button color="inherit" component={RouterLink} to="/cart">Giỏ hàng</Button> */}
           {/* Thêm các nút khác vào đây nếu cần */}
        </Box>
        {/* === KẾT THÚC BOX === */}

      </Toolbar>
    </AppBar>
  );
}

export default Navbar;