// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Dialog,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Divider,
  Link as MuiLink,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const handleClose = () => {
    setOpen(false);
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <Box sx={{ p: 3, position: 'relative' }}>
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" align="center" sx={{ mb: 1 }}>
          ĐĂNG NHẬP HOẶC TẠO TÀI KHOẢN
        </Typography>
        
        {error && <Alert severity="error" sx={{ mt: 2, mb: 1 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: error ? 1 : 4 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
            disabled={loading}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((show) => !show)}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <MuiLink
            component={RouterLink}
            to="#"
            underline="hover"
            sx={{ display: 'block', textAlign: 'right', fontSize: 14, mt: 1, mb: 2 }}
          >
            Quên mật khẩu email?
          </MuiLink>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              bgcolor: '#e60000',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              py: 1.5,
              mb: 2,
              '&:hover': { bgcolor: '#cc0000' }
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'ĐĂNG NHẬP'}
          </Button>
          <Divider sx={{ my: 2 }}>hoặc đăng nhập bằng</Divider>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                sx={{
                  borderColor: '#dd4b39',
                  color: '#dd4b39',
                  fontWeight: 600,
                  textTransform: 'none'
                }}
                disabled={loading}
              >
                Google
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FacebookIcon />}
                sx={{
                  borderColor: '#3b5998',
                  color: '#3b5998',
                  fontWeight: 600,
                  textTransform: 'none'
                }}
                disabled={loading}
              >
                Facebook
              </Button>
            </Grid>
          </Grid>
          <Typography align="center" sx={{ mt: 3, fontSize: 15 }}>
            Bạn chưa có tài khoản?{' '}
            <MuiLink component={RouterLink} to="/register" underline="hover" sx={{ color: '#1976d2', fontWeight: 600 }}>
              Đăng ký ngay!
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}

export default LoginPage;
