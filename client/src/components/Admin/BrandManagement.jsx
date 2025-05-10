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
  Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import api from '../../services/api';
import BrandFormDialog from './BrandFormDialog'; 

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/brands');
      if (response.data && response.data.success) {
        setBrands(response.data.data || []);
      } else {
        setError(response.data?.message || 'Không thể tải danh sách thương hiệu.');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Lỗi khi tải thương hiệu.';
      setError(errMsg);
      console.error('Fetch brands error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleAddBrand = () => {
    setEditingBrand(null);
    setIsFormOpen(true);
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setIsFormOpen(true);
  };

  const handleDeleteBrand = async (brandId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này không? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các sản phẩm liên quan.')) {
      try {
        await api.delete(`/brands/${brandId}`);
        setSnackbar({ open: true, message: 'Xóa thương hiệu thành công!', severity: 'success' });
        fetchBrands(); 
      } catch (err) {
        const errMsg = err.response?.data?.message || 'Lỗi khi xóa thương hiệu.';
        setSnackbar({ open: true, message: errMsg, severity: 'error' });
        console.error('Delete brand error:', err);
      }
    }
  };
  
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchBrands();
    setSnackbar({
      open: true,
      message: editingBrand ? 'Cập nhật thương hiệu thành công!' : 'Thêm thương hiệu thành công!',
      severity: 'success',
    });
    setEditingBrand(null); 
  };

  const handleFormError = (errorMessage) => {
    setSnackbar({ open: true, message: errorMessage, severity: 'error' });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading && brands.length === 0) {
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
          Quản lý Thương hiệu
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddBrand}
        >
          Thêm Thương hiệu mới
        </Button>
      </Box>

      {error && !loading && <Alert severity="error" sx={{ mb: 2 }}>{`Lỗi: ${error}`}</Alert>}
      {loading && brands.length > 0 && <CircularProgress size={24} sx={{mb:1}} />}

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="brands table">
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Logo</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Tên Thương hiệu</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Slug</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Mô tả</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold', textAlign: 'right' }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Không có thương hiệu nào.
                </TableCell>
              </TableRow>
            )}
            {brands.map((brand) => (
              <TableRow
                key={brand._id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover' } }}
              >
                <TableCell sx={{ width: 80 }}>
                  <Avatar 
                    src={brand.logoUrl}
                    alt={brand.name} 
                    variant="rounded"
                    sx={{ width: 56, height: 56, backgroundColor: 'grey.200' }}
                  >
                    {!brand.logoUrl && <ImageIcon color="action" />}
                  </Avatar>
                </TableCell>
                <TableCell component="th" scope="row">
                  {brand.name}
                </TableCell>
                <TableCell>{brand.slug}</TableCell>
                <TableCell>{brand.description?.substring(0,50) || '-'}{brand.description?.length > 50 ? '...' : ''}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEditBrand(brand)} color="primary" aria-label="edit brand">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteBrand(brand._id)} color="error" aria-label="delete brand">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {isFormOpen && (
        <BrandFormDialog
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingBrand(null); 
          }}
          brandData={editingBrand}
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

export default BrandManagement;
