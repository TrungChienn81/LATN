import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Link as MuiLink,
  Grid,
  Dialog,
  IconButton,
  Divider
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import { useAuth } from '../contexts/AuthContext';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Vui lòng điền đầy đủ tất cả các trường bắt buộc.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });

    if (result.success) {
      setSuccess(result.message || 'Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } else {
      setError(result.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          ĐĂNG KÝ TÀI KHOẢN 
        </Typography>
        <IconButton onClick={handleClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ px: 3, pb: 3 }}>
        {error && <Alert severity="error" sx={{ mt: 1, mb:1 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 1, mb:1 }}>{success}</Alert>}
        
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          autoFocus
          disabled={loading}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Họ"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          disabled={loading}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Tên"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          disabled={loading}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Mật khẩu"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#e60000', '&:hover': { bgcolor: '#cc0000' } }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'TẠO TÀI KHOẢN'}
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
          <Divider sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ mx: 2 }}>hoặc đăng ký bằng</Typography>
          <Divider sx={{ flexGrow: 1 }} />
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              sx={{ borderColor: '#dd4b39', color: '#dd4b39' }}
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
              sx={{ borderColor: '#3b5998', color: '#3b5998' }}
              disabled={loading}
            >
              Facebook
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Bạn đã có tài khoản? <MuiLink component={RouterLink} to="/login" sx={{ color: (theme) => theme.palette.primary.main, fontWeight: 'medium' }}>Đăng nhập!</MuiLink>
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}

export default RegisterPage;
