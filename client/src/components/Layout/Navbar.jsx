// src/components/Layout/Navbar.jsx
import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  InputBase, 
  alpha, 
  styled, 
  Container,
  Menu,
  MenuItem
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorefrontIcon from '@mui/icons-material/Storefront';

import { useAuth } from '../../contexts/AuthContext';

// Search styling
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.grey[500], 0.1),
  '&:hover': {
    backgroundColor: alpha(theme.palette.grey[500], 0.15),
  },
  marginRight: theme.spacing(2),
  marginLeft: theme.spacing(3),
  width: 'auto',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.action.active
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: { width: '30ch' },
    '&::placeholder': {
      opacity: 0.6,
      color: theme.palette.text.secondary
    },
  },
}));

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <AppBar 
      position="static" 
      color="default" 
      elevation={0} 
      sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo */}
          <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            to="/"
            sx={{ 
              mr: 3, 
              fontWeight: 700, 
              color: 'text.primary', 
              textDecoration: 'none' 
            }}
          >
            LATN
          </Typography>

          {/* Navigation Links */}
          <Box sx={{ 
            flexGrow: 1, 
            display: { xs: 'none', md: 'flex' }, 
            gap: 1.5 
          }}>
            {[
              { text: 'Laptops', path: '/products?category=laptop' },
              { text: 'Desktop PCs', path: '/products?category=desktop' },
              { text: 'Components', path: '/products?category=component' },
              { text: 'Accessories', path: '/products?category=accessory' },
              { text: 'Deals', path: '/deals' }
            ].map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                sx={{ 
                  color: 'text.primary', 
                  fontWeight: 500,
                  '&:hover': {
                    color: 'primary.main'
                  }
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>

          {/* Search and Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search products…"
                inputProps={{ 'aria-label': 'search' }}
              />
            </Search>
            <IconButton 
              sx={{ color: 'text.primary' }} 
              aria-label="shopping cart"
              component={RouterLink}
              to="/cart"
            >
              <ShoppingCartOutlinedIcon />
            </IconButton>

            {isAuthenticated && user ? (
              <>
                <IconButton
                  edge="end"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                  color="inherit"
                  sx={{ color: 'text.primary', ml: 1 }}
                >
                  <AccountCircleIcon />
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem disabled sx={{ opacity: '1 !important' }}>
                    <Typography variant="subtitle2">Chào, {user.firstName || user.username}!</Typography>
                  </MenuItem>
                  <MenuItem component={RouterLink} to="/profile" onClick={handleMenuClose}>Tài khoản của tôi</MenuItem>
                  <MenuItem component={RouterLink} to="/orders" onClick={handleMenuClose}>Đơn hàng</MenuItem>
                  {user.role === 'admin' && (
                    <MenuItem component={RouterLink} to="/admin/dashboard" onClick={handleMenuClose}>
                      <AdminPanelSettingsIcon sx={{ mr: 1 }} /> Admin Dashboard
                    </MenuItem>
                  )}
                  {user.role === 'admin' && (
                    <MenuItem component={RouterLink} to="/admin/categories" onClick={handleMenuClose}>
                      {/* Icon gì đó cho category, ví dụ CategoryIcon, hoặc để trống */} 
                      Quản lý Danh mục
                    </MenuItem>
                  )}
                  {user.role === 'admin' && (
                    <MenuItem component={RouterLink} to="/admin/brands" onClick={handleMenuClose}>
                      <StorefrontIcon sx={{ mr: 1 }} /> Quản lý Thương hiệu
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                    <ExitToAppIcon sx={{ mr: 1 }} /> Đăng xuất
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                component={RouterLink} 
                to="/login" 
                color="inherit" 
                sx={{ color: 'text.primary', fontWeight: 500, ml:1 }}
                startIcon={<PersonOutlineIcon />} 
              >
                Đăng nhập
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;