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
import api from '../services/api';

function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    // Logic xử lý đăng ký giữ nguyên
  };

  const handleClose = () => {
    setOpen(false);
    navigate('/');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          ĐĂNG KÝ TÀI KHOẢN 
        </Typography>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ px: 3, pb: 3 }}>
       
        
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Họ"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Tên"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
        />
        
        <TextField
          fullWidth
          margin="normal"
          label="Mật khẩu"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
        />
        
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#e60000', '&:hover': { bgcolor: '#cc0000' } }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'TẠO TÀI KHOẢN'}
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
            >
              Facebook
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Bạn đã có tài khoản? <MuiLink component={RouterLink} to="/login">Đăng nhập!</MuiLink>
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}

export default RegisterPage;
