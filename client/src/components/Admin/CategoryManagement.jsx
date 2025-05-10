import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';
import CategoryFormDialog from './CategoryFormDialog'; // Import component dialog

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null); // Reset error before fetching
    try {
      const response = await api.get('/categories');
      if (response.data && response.data.success) {
        setCategories(response.data.data || []);
      } else {
        setError(response.data?.message || 'Không thể tải danh sách danh mục.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi tải danh mục.';
      setError(errMsg);
      console.error('Fetch categories error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = () => {
    setEditingCategory(null); // No data for new category
    setIsFormOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này không? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các sản phẩm liên quan.')) {
      try {
        await api.delete(`/categories/${categoryId}`);
        setSnackbar({ open: true, message: 'Xóa danh mục thành công!', severity: 'success' });
        fetchCategories(); // Refresh the list
      } catch (err) {
        const errMsg = err.response?.data?.message || 'Lỗi khi xóa danh mục.';
        setSnackbar({ open: true, message: errMsg, severity: 'error' });
        console.error('Delete category error:', err);
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchCategories();
    setSnackbar({
      open: true,
      message: editingCategory ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!',
      severity: 'success',
    });
    setEditingCategory(null); // Reset editing state
  };

  const handleFormError = (errorMessage) => {
    // Snackbar for error is handled by CategoryFormDialog's onError prop now
    // but we can also show a general error or log it here if needed.
    setSnackbar({ open: true, message: errorMessage, severity: 'error' });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && categories.length === 0) { // Show loading only if no data yet
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, margin: 'auto', maxWidth: 1000, flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Quản lý Danh mục
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddCategory}
        >
          Thêm Danh mục mới
        </Button>
      </Box>

      {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{`Lỗi: ${error}`}</Alert>} 
      {/* Show loading indicator on table if fetching during refresh */}
      {loading && categories.length > 0 && <CircularProgress size={24} sx={{mb:1}} />}

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Tên Danh mục</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Slug</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Mô tả</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Danh mục cha</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold', textAlign: 'right' }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Không có danh mục nào.
                </TableCell>
              </TableRow>
            )}
            {categories.map((category) => (
              <TableRow
                key={category._id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover' } }}
              >
                <TableCell component="th" scope="row">
                  {category.name}
                </TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.description?.substring(0,50) || '-'}{category.description?.length > 50 ? '...' : ''}</TableCell>
                <TableCell>{category.parentCategory ? category.parentCategory.name : 'Không có'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEditCategory(category)} color="primary" aria-label="edit category">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteCategory(category._id)} color="error" aria-label="delete category">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {isFormOpen && (
        <CategoryFormDialog
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCategory(null); // Clear editing state on close
          }}
          categoryData={editingCategory}
          allCategories={categories} // Pass all categories for parent selection
          onSuccess={handleFormSuccess}
          onError={handleFormError} 
        />
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default CategoryManagement;
