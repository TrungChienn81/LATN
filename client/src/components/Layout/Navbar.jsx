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
  Container 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';

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
            TechHub AI
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
            <IconButton 
              sx={{ color: 'text.primary' }} 
              aria-label="user account"
              component={RouterLink}
              to="/login"
            >
              <PersonOutlineIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;