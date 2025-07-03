import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import axios from 'axios';

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderDetails, setOrderDetails] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Lấy token từ localStorage
  const token = localStorage.getItem('token');

  // Map các trạng thái sang tiếng Việt
  const statusTranslations = {
    'pending': 'Chờ xác nhận',
    'processing': 'Đang xử lý',
    'shipped': 'Đang vận chuyển',
    'delivered': 'Đã giao hàng',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy',
    'failed': 'Thất bại'
  };

  // Map các trạng thái thanh toán sang tiếng Việt
  const paymentStatusTranslations = {
    'pending': 'Chờ thanh toán',
    'paid': 'Đã thanh toán',
    'failed': 'Thanh toán thất bại',
    'refunded': 'Đã hoàn tiền'
  };

  // Màu sắc cho từng trạng thái
  const statusColors = {
    'pending': 'warning',
    'processing': 'info',
    'shipped': 'secondary',
    'delivered': 'success',
    'completed': 'success',
    'cancelled': 'error',
    'failed': 'error'
  };

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Debug logs chi tiết về token
        console.log('🔑 Token length:', token ? token.length : 'No token');
        console.log('🔑 Token first 10 chars:', token ? `${token.substring(0, 10)}...` : 'No token');
        console.log('🔑 Local Storage Items:', Object.keys(localStorage));
        console.log('📋 Current User:', localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : 'No user info');
        
        // Thử nhiều đường dẫn API khác nhau
        const apiUrls = [
          `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/orders/admin`,
          `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/orders/admin`,
          `http://localhost:3001/api/orders/admin`
        ];
        
        console.log('🌐 API URLs to try:', apiUrls);
        console.log('🔧 Environment:', process.env.NODE_ENV);
        console.log('🔧 API URL from ENV:', process.env.REACT_APP_API_URL || 'Not set');
        
        let response = null;
        let errorMessages = [];
        let errorDetails = [];
        
        // Thử từng URL cho đến khi thành công
        for (const apiUrl of apiUrls) {
          console.log('🔄 Trying API URL:', apiUrl);
          try {
            // Log chi tiết request
            const config = {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              params: {
                page: page + 1,
                limit: rowsPerPage
              }
            };
            console.log('📡 Request Config:', {
              url: apiUrl,
              headers: {
                Authorization: token ? 'Bearer [REDACTED]' : 'No token',
                'Content-Type': config.headers['Content-Type']
              },
              params: config.params
            });
            
            response = await axios.get(apiUrl, config);
            
            console.log('✅ API call successful with:', apiUrl);
            console.log('📊 Response status:', response.status);
            console.log('📄 Response data structure:', {
              success: response.data.success,
              message: response.data.message,
              dataType: response.data.data ? `Array[${response.data.data.length}]` : 'null',
              paginationInfo: response.data.pagination ? `Total: ${response.data.pagination.total}` : 'No pagination'
            });
            
            break; // Thoát vòng lặp nếu thành công
          } catch (err) {
            errorMessages.push(`${apiUrl}: ${err.message}`);
            errorDetails.push({
              url: apiUrl,
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data,
              message: err.message
            });
            console.error(`❌ Error with ${apiUrl}:`, err.message);
            console.error('❌ Error details:', JSON.stringify({
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data
            }));
          }
        }
        
        // Nếu không gọi API nào thành công
        if (!response) {
          throw new Error(`All API attempts failed: ${errorMessages.join(', ')}`);
        }
        
        console.log('API Response:', response.data);
        
        // Kiểm tra xem dữ liệu trả về có đúng định dạng không
        if (response.data.data && Array.isArray(response.data.data)) {
          setOrders(response.data.data);
          setTotalOrders(response.data.pagination?.total || 0);
        } else if (response.data.orders && Array.isArray(response.data.orders)) {
          // Format thay thế
          console.log('Using alternative data format');
          setOrders(response.data.orders);
          setTotalOrders(response.data.totalOrders || response.data.orders.length || 0);
        } else {
          console.error('Unexpected API response format:', response.data);
          toast.error('Định dạng dữ liệu không đúng');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Lỗi khi tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, rowsPerPage, token, refreshTrigger]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetails = async (orderId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setOrderDetails(response.data.data);
      setOpenDetailsDialog(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Lỗi khi lấy thông tin đơn hàng');
    }
  };

  const handleCloseDetailsDialog = () => {
    setOpenDetailsDialog(false);
    setOrderDetails(null);
  };

  const handleOpenStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedOrder(null);
    setNewStatus('');
  };

  const handleStatusChange = (event) => {
    setNewStatus(event.target.value);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/orders/${selectedOrder._id}/status`,
        { orderStatus: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Cập nhật danh sách đơn hàng
        setOrders(orders.map(order => 
          order._id === selectedOrder._id 
            ? { ...order, orderStatus: newStatus } 
            : order
        ));
        
        toast.success('Cập nhật trạng thái đơn hàng thành công!');
        
        // Refresh danh sách đơn hàng
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Lỗi khi cập nhật trạng thái đơn hàng');
    } finally {
      handleCloseStatusDialog();
    }
  };

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Format ngày tháng
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Quản lý đơn hàng
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell>Mã đơn hàng</TableCell>
                    <TableCell>Ngày đặt</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell align="right">Tổng tiền</TableCell>
                    <TableCell>Phương thức thanh toán</TableCell>
                    <TableCell>Trạng thái thanh toán</TableCell>
                    <TableCell>Trạng thái đơn hàng</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow hover key={order._id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{order.customer?.firstName} {order.customer?.lastName}</TableCell>
                      <TableCell align="right">{formatPrice(order.totalAmount)}</TableCell>
                      <TableCell>
                        {order.paymentMethod === 'cod' ? 'Tiền mặt khi nhận hàng' : 
                         order.paymentMethod === 'momo' ? 'MoMo' : 
                         order.paymentMethod === 'vnpay' ? 'VNPay' :
                         order.paymentMethod === 'paypal' ? 'PayPal' : order.paymentMethod}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={paymentStatusTranslations[order.paymentStatus] || order.paymentStatus} 
                          color={order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'error' : 'warning'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={statusTranslations[order.orderStatus] || order.orderStatus} 
                          color={statusColors[order.orderStatus] || 'default'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleOpenDetails(order._id)}
                          title="Xem chi tiết"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {(order.orderStatus === 'processing' || order.orderStatus === 'shipped') && (
                          <IconButton 
                            size="small" 
                            color="secondary" 
                            onClick={() => handleOpenStatusDialog(order)}
                            title="Cập nhật trạng thái"
                            sx={{ ml: 1 }}
                          >
                            <LocalShippingIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalOrders}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Order Details Dialog */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={handleCloseDetailsDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Chi tiết đơn hàng</DialogTitle>
        <DialogContent dividers>
          {orderDetails && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">Thông tin đơn hàng</Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Mã đơn hàng: <strong>{orderDetails.orderNumber}</strong></Typography>
                  <Typography variant="body2">Ngày đặt: <strong>{formatDate(orderDetails.createdAt)}</strong></Typography>
                  <Typography variant="body2">Trạng thái: <strong>{statusTranslations[orderDetails.orderStatus] || orderDetails.orderStatus}</strong></Typography>
                  <Typography variant="body2">Thanh toán: <strong>{paymentStatusTranslations[orderDetails.paymentStatus] || orderDetails.paymentStatus}</strong></Typography>
                  <Typography variant="body2">Phương thức thanh toán: <strong>{
                    orderDetails.paymentMethod === 'cod' ? 'Tiền mặt khi nhận hàng' : 
                    orderDetails.paymentMethod === 'momo' ? 'MoMo' : 
                    orderDetails.paymentMethod === 'vnpay' ? 'VNPay' :
                    orderDetails.paymentMethod === 'paypal' ? 'PayPal' : orderDetails.paymentMethod
                  }</strong></Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold">Thông tin giao hàng</Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Người nhận: <strong>{orderDetails.shippingAddress?.fullName}</strong></Typography>
                  <Typography variant="body2">Số điện thoại: <strong>{orderDetails.shippingAddress?.phoneNumber}</strong></Typography>
                  <Typography variant="body2">Địa chỉ: <strong>{orderDetails.shippingAddress?.address}, {orderDetails.shippingAddress?.ward}, {orderDetails.shippingAddress?.district}, {orderDetails.shippingAddress?.province}</strong></Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold">Sản phẩm</Typography>
                <TableContainer component={Paper} sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Sản phẩm</TableCell>
                        <TableCell align="center">Số lượng</TableCell>
                        <TableCell align="right">Đơn giá</TableCell>
                        <TableCell align="right">Thành tiền</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderDetails.items.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {item.product?.images && item.product.images[0] && (
                                <Box 
                                  component="img" 
                                  src={item.product.images[0]}
                                  alt={item.product?.name}
                                  sx={{ width: 40, height: 40, objectFit: 'cover', mr: 1 }}
                                />
                              )}
                              <Typography variant="body2">{item.product?.name || 'Sản phẩm không có sẵn'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">{formatPrice(item.price)}</TableCell>
                          <TableCell align="right">{formatPrice(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Typography variant="body1">
                    Tổng tiền: <Typography component="span" variant="h6" fontWeight="bold">{formatPrice(orderDetails.totalAmount)}</Typography>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog}>
        <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Mã đơn hàng: {selectedOrder?.orderNumber}
          </DialogContentText>
          <FormControl fullWidth margin="normal">
            <InputLabel>Trạng thái đơn hàng</InputLabel>
            <Select
              value={newStatus}
              onChange={handleStatusChange}
              label="Trạng thái đơn hàng"
            >
              <MenuItem value="processing">Đang xử lý</MenuItem>
              <MenuItem value="shipped">Đang vận chuyển</MenuItem>
              <MenuItem value="delivered">Đã giao hàng</MenuItem>
              <MenuItem value="completed">Hoàn thành</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Hủy</Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained" 
            color="primary"
          >
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminOrderManagement;
