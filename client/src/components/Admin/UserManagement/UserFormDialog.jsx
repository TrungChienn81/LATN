import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';

const UserFormDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const isEditMode = Boolean(initialData && initialData._id);

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        setFormData({
          username: initialData.username || '',
          email: initialData.email || '',
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          role: initialData.role || 'customer',
          // Password is not pre-filled for editing for security
        });
      } else {
        // Default values for new user
        setFormData({
          username: '',
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'customer',
        });
      }
      setErrors({}); // Clear errors when dialog opens or initialData changes
    }
  }, [open, initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.username) tempErrors.username = 'Tên đăng nhập là bắt buộc.';
    if (!formData.email) {
      tempErrors.email = 'Email là bắt buộc.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Địa chỉ email không hợp lệ.';
    }
    if (!isEditMode && !formData.password) {
      tempErrors.password = 'Mật khẩu là bắt buộc cho người dùng mới.';
    } else if (formData.password && formData.password.length < 6) {
      tempErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }
    if (!formData.role) tempErrors.role = 'Vai trò là bắt buộc.';
    // Add more validations as needed
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData); 
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Chỉnh sửa User' : 'Thêm User mới'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="username"
                label="Tên đăng nhập"
                value={formData.username || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
                required
                error={Boolean(errors.username)}
                helperText={errors.username}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
                required
                error={Boolean(errors.email)}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="password"
                label={isEditMode ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
                type="password"
                value={formData.password || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
                required={!isEditMode} // Only required for new users
                error={Boolean(errors.password)}
                helperText={errors.password}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="firstName"
                label="Họ"
                value={formData.firstName || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastName"
                label="Tên"
                value={formData.lastName || ''}
                onChange={handleChange}
                fullWidth
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="dense" error={Boolean(errors.role)} required>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  name="role"
                  value={formData.role || 'customer'}
                  onChange={handleChange}
                  label="Vai trò"
                >
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="seller">Seller</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy bỏ</Button>
          <Button type="submit" variant="contained">
            {isEditMode ? 'Lưu thay đổi' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserFormDialog; 