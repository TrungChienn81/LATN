import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  CircularProgress,
  Grid,
} from '@mui/material';
import api from '../../services/api';

const BrandFormDialog = ({ open, onClose, brandData, onSuccess, onError }) => {
  const [formData, setFormData] = useState({ name: '', description: '', logoUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditMode = Boolean(brandData && brandData._id);

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: brandData.name || '',
        description: brandData.description || '',
        logoUrl: brandData.logoUrl || '',
      });
    } else {
      // Reset for new brand
      setFormData({ name: '', description: '', logoUrl: '' });
    }
    setErrors({}); // Clear errors when dialog opens or mode changes
  }, [brandData, open, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
        setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Tên thương hiệu là bắt buộc.';
    }
    // Basic URL validation for logoUrl (optional)
    if (formData.logoUrl && !/^https?:\/\/.+\..+/.test(formData.logoUrl)) {
        newErrors.logoUrl = 'URL logo không hợp lệ.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      
      if (isEditMode) {
        await api.patch(`/brands/${brandData._id}`, payload); // API endpoint for brands
      } else {
        await api.post('/brands', payload); // API endpoint for brands
      }
      onSuccess();
    } catch (err) {
      console.error('Submit brand error:', err);
      const errMsg = err.response?.data?.message || (isEditMode ? 'Lỗi khi cập nhật thương hiệu.' : 'Lỗi khi tạo thương hiệu.');
      onError(errMsg);
      if (err.response?.data?.errors) {
        setErrors(prevErrors => ({...prevErrors, ...err.response.data.errors}));
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onClose={() => { onClose(); setErrors({}); }} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Chỉnh sửa Thương hiệu' : 'Thêm Thương hiệu mới'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Tên Thương hiệu"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                margin="dense"
                error={Boolean(errors.name)}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Mô tả (Tùy chọn)"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                margin="dense"
                error={Boolean(errors.description)}
                helperText={errors.description}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="logoUrl"
                label="URL Logo (Tùy chọn)"
                value={formData.logoUrl}
                onChange={handleChange}
                fullWidth
                margin="dense"
                type="url"
                error={Boolean(errors.logoUrl)}
                helperText={errors.logoUrl || 'Ví dụ: https://example.com/logo.png'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { onClose(); setErrors({}); }} disabled={isSubmitting}>Hủy bỏ</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isSubmitting ? <CircularProgress size={20} /> : null}>
            {isEditMode ? 'Lưu thay đổi' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BrandFormDialog;
