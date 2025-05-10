import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  FormHelperText,
} from '@mui/material';
import api from '../../services/api';

const CategoryFormDialog = ({ open, onClose, categoryData, onSuccess, onError, allCategories = [] }) => {
  const [formData, setFormData] = useState({ name: '', description: '', parentCategory: '', iconUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditMode = Boolean(categoryData && categoryData._id);

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: categoryData.name || '',
        description: categoryData.description || '',
        parentCategory: categoryData.parentCategory?._id || categoryData.parentCategory || '', // Handle populated or ID
        iconUrl: categoryData.iconUrl || '',
      });
    } else {
      // Reset for new category
      setFormData({ name: '', description: '', parentCategory: '', iconUrl: '' });
    }
    setErrors({}); // Clear errors when dialog opens or mode changes
  }, [categoryData, open, isEditMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
        setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Tên danh mục là bắt buộc.';
    }
    // Add other validations if needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.parentCategory === '') {
        payload.parentCategory = null; // Send null if no parent selected
      }

      if (isEditMode) {
        await api.patch(`/categories/${categoryData._id}`, payload);
      } else {
        await api.post('/categories', payload);
      }
      onSuccess();
    } catch (err) {
      console.error('Submit category error:', err);
      const errMsg = err.response?.data?.message || (isEditMode ? 'Lỗi khi cập nhật danh mục.' : 'Lỗi khi tạo danh mục.');
      onError(errMsg);
      if (err.response?.data?.errors) { // Handle specific field errors from backend if any
        setErrors(prevErrors => ({...prevErrors, ...err.response.data.errors}));
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onClose={() => { onClose(); setErrors({}); }} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Tên Danh mục"
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
              <FormControl fullWidth margin="dense" error={Boolean(errors.parentCategory)}>
                <InputLabel id="parent-category-select-label">Danh mục cha (Tùy chọn)</InputLabel>
                <Select
                  labelId="parent-category-select-label"
                  name="parentCategory"
                  value={formData.parentCategory}
                  label="Danh mục cha (Tùy chọn)"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Không có</em></MenuItem>
                  {allCategories
                    .filter(cat => !isEditMode || cat._id !== categoryData?._id) // Prevent selecting self as parent
                    .map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </MenuItem>
                  ))}
                </Select>
                {errors.parentCategory && <FormHelperText>{errors.parentCategory}</FormHelperText>}
              </FormControl>
            </Grid>
             <Grid item xs={12}>
              <TextField
                name="iconUrl"
                label="URL Icon (Tùy chọn)"
                value={formData.iconUrl}
                onChange={handleChange}
                fullWidth
                margin="dense"
                error={Boolean(errors.iconUrl)}
                helperText={errors.iconUrl}
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

export default CategoryFormDialog;
