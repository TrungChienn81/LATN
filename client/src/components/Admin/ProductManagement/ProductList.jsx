import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image'; // Placeholder for image
import api from '../../../services/api';
import ConfirmationDialog from '../UserManagement/ConfirmationDialog'; // Reusing ConfirmationDialog

// Helper function to format currency (you might want to move this to a utils file)
const formatCurrency = (amountMillions) => {
  if (typeof amountMillions !== 'number') {
    return 'N/A';
  }
  const fullAmount = amountMillions * 1000000; // Chuyển từ triệu đồng sang đồng
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    maximumFractionDigits: 0 // Giữ nguyên để không hiển thị số thập phân sau khi đã là đơn vị đồng
  }).format(fullAmount);
};

const ProductList = ({ onEditProduct, refreshCounter }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/products'); // Assuming endpoint is /api/products
        if (response.data && response.data.success) {
          setProducts(response.data.data || []);
        } else {
          setError(response.data.message || 'Không thể tải danh sách sản phẩm.');
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.response?.data?.message || 'Đã có lỗi xảy ra khi tải sản phẩm.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [refreshCounter]);

  const handleOpenConfirmDialog = (productId) => {
    setProductToDelete(productId);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete}`); // Assuming endpoint is /api/products/:id
      setProducts(prevProducts => prevProducts.filter(product => product._id !== productToDelete));
      setSnackbar({ open: true, message: 'Sản phẩm đã được xóa thành công!', severity: 'success' });
    } catch (err) {
      console.error("Error deleting product:", err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Lỗi khi xóa sản phẩm.', severity: 'error' });
    } finally {
      handleCloseConfirmDialog();
    }
  };

  const handleEdit = (product) => {
    if (onEditProduct) {
      onEditProduct(product);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading && products.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải danh sách sản phẩm...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (products.length === 0 && !loading) {
    return <Typography sx={{ mt: 2 }}>Không tìm thấy sản phẩm nào.</Typography>;
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Table sx={{ minWidth: 750 }} aria-label="table of products">
          <TableHead sx={{ backgroundColor: 'grey.100'}}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '80px', textAlign: 'center' }}>Ảnh</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tên Sản phẩm</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Danh mục</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Giá</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Chủ shop</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Tồn kho</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product._id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'action.hover'} }}
              >
                <TableCell align="center">
                  <Box
                    component="img"
                    src={product.images && product.images.length > 0 ? 
                      (typeof product.images[0] === 'string' ? 
                        (product.images[0].startsWith('http') ? 
                          product.images[0] : 
                          `${window.location.origin}${product.images[0]}`) : 
                        product.images[0]?.url || '') : 
                      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjREREREREIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjNTU1Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=' // Default SVG for no image initially
                    }
                    alt={product.name}
                    sx={{
                      width: 56,
                      height: 56,
                      objectFit: 'contain', // or 'cover' depending on desired behavior
                      bgcolor: 'grey.200',
                      borderRadius: 1
                    }}
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiBmaWxsPSIjREREREREIiAvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjNTU1Ij5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </TableCell>
                <TableCell component="th" scope="row">
                  <Typography variant="subtitle2" noWrap>{product.name}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {product.brandName || 'N/A'} 
                  </Typography>
                </TableCell>
                <TableCell>{product.categoryName || 'N/A'}</TableCell>
                <TableCell>{formatCurrency(product.price)}</TableCell>
                <TableCell>{product.shopOwnerName || 'N/A'}</TableCell>
                <TableCell align="center">
                  <Typography color={product.stockStatus === 'Hết hàng' ? 'error' : 'text.primary'}>
                    {product.stockStatus || (product.stockQuantity > 0 ? `Còn ${product.stockQuantity} sản phẩm` : 'Hết hàng')}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Sửa">
                    <IconButton size="small" onClick={() => handleEdit(product)} sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton size="small" onClick={() => handleOpenConfirmDialog(product._id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa Sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác và có thể ảnh hưởng đến các đơn hàng liên quan."
      />
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProductList; 