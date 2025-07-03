import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Checkbox,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ButtonGroup,
  Badge
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as LocalShippingIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Store as StoreIcon,
  ShoppingBag as ShoppingBagIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  DeleteForever as DeleteForeverIcon,
  MoreVert as MoreVertIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { formatPriceToVND } from '../utils/formatters';
import api from '../services/api';
import { toast } from 'react-toastify';

const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [paymentDialog, setPaymentDialog] = useState({ open: false, order: null });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bankingDetails, setBankingDetails] = useState(null);
  
  // Các trạng thái cho chức năng xóa đơn hàng
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ open: false, mode: null, orderIds: [] });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null); // Cho menu hành động xóa

  // Get success message from navigation state
  const successOrderNumber = location.state?.orderNumber;

  useEffect(() => {
    if (successOrderNumber) {
      toast.success(`Đặt hàng thành công! Mã đơn hàng: ${successOrderNumber}`);
    }
    
    // Check if redirected from payment page
    const searchParams = new URLSearchParams(location.search);
    const paymentStatus = searchParams.get('payment_status');
    const orderId = searchParams.get('order_id');
    const paymentMethod = searchParams.get('payment_method');
    
    // Show payment result notification if available
    if (paymentStatus) {
      if (paymentStatus === 'success') {
        toast.success(`Thanh toán ${paymentMethod ? 'qua ' + paymentMethod : ''} thành công!`);
      } else if (paymentStatus === 'failed') {
        toast.error(`Thanh toán ${paymentMethod ? 'qua ' + paymentMethod : ''} thất bại. Vui lòng thử lại.`);
      } else if (paymentStatus === 'pending') {
        toast.info(`Thanh toán ${paymentMethod ? 'qua ' + paymentMethod : ''} đang được xử lý.`);
      }
      
      // Clear URL parameters without refreshing page
      window.history.replaceState({}, document.title, '/user/orders');
    }
    
    // Fetch orders
    fetchOrders();
    
    // Setup auto-refresh for orders with pending payment status
    const refreshInterval = setInterval(() => {
      // Refresh orders regardless of status to ensure latest data
      console.log('Auto-refreshing orders...');
      fetchOrders();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [location.search]); // Re-run when URL parameters change

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/my-orders?page=${page}&limit=10`);
      
      if (response.data.success) {
        setOrders(response.data.data);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Có lỗi xảy ra khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Chờ xác nhận', color: 'warning', icon: <ScheduleIcon /> },
      confirmed: { label: 'Đã xác nhận', color: 'info', icon: <CheckCircleIcon /> },
      processing: { label: 'Đang xử lý', color: 'info', icon: <ScheduleIcon /> },
      shipping: { label: 'Đang giao hàng', color: 'primary', icon: <LocalShippingIcon /> },
      delivered: { label: 'Đã giao hàng', color: 'success', icon: <CheckCircleIcon /> },
      cancelled: { label: 'Đã hủy', color: 'error', icon: <CancelIcon /> }
    };
    return statusMap[status] || { label: status, color: 'default', icon: null };
  };

  const getPaymentStatusInfo = (paymentStatus, orderStatus) => {
    if (orderStatus === 'cancelled') {
        return { label: 'Đã hủy', color: 'error', icon: <CancelIcon /> };
    }
    const paymentStatusMap = {
      pending: { label: 'Chưa thanh toán', color: 'error', icon: <ScheduleIcon /> },
      paid: { label: 'Đã thanh toán', color: 'success', icon: <CheckCircleIcon /> },
      failed: { label: 'Thanh toán thất bại', color: 'error', icon: <CancelIcon /> },
      refunded: { label: 'Đã hoàn tiền', color: 'info', icon: <MonetizationOnIcon /> }
    };
    return paymentStatusMap[paymentStatus] || { label: paymentStatus, color: 'default', icon: null };
  };

  const getPaymentMethodInfo = (paymentMethod) => {
    const methodMap = {
      cod: { label: 'Thanh toán khi nhận hàng', icon: <MonetizationOnIcon />, color: 'default' },
      bank_transfer: { label: 'Chuyển khoản ngân hàng', icon: <BankIcon />, color: 'primary' },
      momo: { label: 'Ví MoMo', icon: <PaymentIcon />, color: 'secondary' },
      vnpay: { label: 'VNPay', icon: <CardIcon />, color: 'info' },
      zalopay: { label: 'ZaloPay', icon: <PaymentIcon />, color: 'warning' },
      paypal: { label: 'PayPal', icon: <PaymentIcon />, color: 'info' }
    };
    return methodMap[paymentMethod] || { label: paymentMethod, icon: <PaymentIcon />, color: 'default' };
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

    try {
      const response = await api.put(`/orders/${orderId}/cancel`, {
        cancelReason: 'Khách hàng hủy đơn'
      });

      if (response.data.success) {
        toast.success('Đã hủy đơn hàng thành công');
        fetchOrders(); // Refresh orders list
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn hàng');
    }
  };

  const handlePaymentNow = (order) => {
    setPaymentDialog({ open: true, order });
    setSelectedPaymentMethod('momo'); // Default to MoMo
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod || !paymentDialog.order) return;

    setProcessingPayment(true);
    try {
      // Call payment API
      const response = await api.post(`/orders/${paymentDialog.order._id}/payment`, {
        paymentMethod: selectedPaymentMethod
      });

      if (response.data.success) {
        const { data } = response.data;
        
        if (data.paymentUrl) {
          // Redirect to payment gateway for MoMo, VNPay, ZaloPay
          window.location.href = data.paymentUrl;
        } else if (data.paymentMethod === 'bank_transfer') {
          // Show banking details for bank transfer
          setBankingDetails(data.bankingDetails);
          toast.success('Vui lòng chuyển khoản theo thông tin bên dưới');
        } else {
          toast.success('Thanh toán thành công!');
          setPaymentDialog({ open: false, order: null });
          fetchOrders(); // Refresh orders
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Có lỗi xảy ra khi xử lý thanh toán');
    } finally {
      setProcessingPayment(false);
    }
  };

  const closePaymentDialog = () => {
    setPaymentDialog({ open: false, order: null });
    setSelectedPaymentMethod('');
    setBankingDetails(null);
  };
  
  // Hành động xóa đơn hàng
  const handleOpenDeleteMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseDeleteMenu = () => {
    setAnchorEl(null);
  };
  
  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prevSelected => {
      if (prevSelected.includes(orderId)) {
        return prevSelected.filter(id => id !== orderId);
      } else {
        return [...prevSelected, orderId];
      }
    });
  };
  
  const handleSelectAllOrders = (event) => {
    if (event.target.checked) {
      // Chỉ chọn các đơn hàng đã hoàn thành, hủy hoặc thất bại
      const selectableOrders = orders
        .filter(order => ['completed', 'cancelled', 'failed'].includes(order.orderStatus))
        .map(order => order._id);
      setSelectedOrders(selectableOrders);
    } else {
      setSelectedOrders([]);
    }
  };
  
  const canDelete = (orderStatus) => {
    return ['completed', 'cancelled', 'failed'].includes(orderStatus);
  };
  
  const openDeleteConfirmDialog = (mode, orderIds = []) => {
    setDeleteConfirmDialog({
      open: true,
      mode,
      orderIds
    });
  };
  
  const closeDeleteConfirmDialog = () => {
    setDeleteConfirmDialog({
      open: false,
      mode: null,
      orderIds: []
    });
  };
  
  const handleDeleteSingleOrder = (orderId) => {
    openDeleteConfirmDialog('single', [orderId]);
  };
  
  const handleDeleteMultipleOrders = () => {
    if (selectedOrders.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một đơn hàng để xóa');
      return;
    }
    openDeleteConfirmDialog('multiple', selectedOrders);
    handleCloseDeleteMenu();
  };
  
  const handleDeleteAllOrders = () => {
    // Kiểm tra xem có đơn hàng đủ điều kiện để xóa không
    const deletableOrders = orders.filter(order => canDelete(order.orderStatus));
    if (deletableOrders.length === 0) {
      toast.warning('Không có đơn hàng nào có thể xóa');
      return;
    }
    openDeleteConfirmDialog('all');
    handleCloseDeleteMenu();
  };
  
  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const { mode, orderIds } = deleteConfirmDialog;
      
      let response;
      switch (mode) {
        case 'single':
          response = await api.delete(`/orders/${orderIds[0]}`);
          break;
        case 'multiple':
          response = await api.delete('/orders/multiple', {
            data: { orderIds }
          });
          break;
        case 'all':
          response = await api.delete('/orders/all');
          break;
      }
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchOrders(); // Làm mới danh sách đơn hàng
        setSelectedOrders([]); // Xóa các lựa chọn
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra khi xóa đơn hàng');
      }
    } catch (error) {
      console.error('Lỗi khi xóa đơn hàng:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setDeleteLoading(false);
      closeDeleteConfirmDialog();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Đơn hàng của tôi
        </Typography>
        
        <Box>
          <ButtonGroup variant="outlined" color="primary">
            <Button
              startIcon={<DeleteSweepIcon />}
              onClick={handleDeleteMultipleOrders}
              disabled={selectedOrders.length === 0}
            >
              Xóa đã chọn ({selectedOrders.length})
            </Button>
            
            <Button onClick={handleOpenDeleteMenu}>
              <MoreVertIcon />
            </Button>
          </ButtonGroup>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseDeleteMenu}
          >
            <MenuItem onClick={handleDeleteAllOrders}>
              <DeleteForeverIcon fontSize="small" sx={{ mr: 1 }} />
              Xóa tất cả đơn hàng đã hủy/hoàn thành
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {successOrderNumber && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Đặt hàng thành công! Mã đơn hàng: <strong>{successOrderNumber}</strong>
        </Alert>
      )}

      {/* Payment Features Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            🎉 Tính năng thanh toán mới!
          </Typography>
          <Typography variant="body2">
            • <strong>Thanh toán trực tuyến:</strong> Hỗ trợ MoMo, VNPay để thanh toán ngay lập tức
            <br />
            • <strong>Chuyển khoản ngân hàng:</strong> Thông tin chi tiết và theo dõi tự động
            <br />
            • <strong>Trạng thái realtime:</strong> Cập nhật trạng thái thanh toán và đơn hàng ngay lập tức
          </Typography>
        </Box>
      </Alert>

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Bạn chưa có đơn hàng nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hãy đặt hàng để theo dõi trạng thái đơn hàng tại đây
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.orderStatus);
            const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus, order.orderStatus);
            const paymentMethodInfo = getPaymentMethodInfo(order.paymentMethod);
            
            return (
              <Grid item xs={12} key={order._id}>
                <Card sx={{ boxShadow: 2, position: 'relative' }}>
                  {canDelete(order.orderStatus) && (
                    <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
                      <Checkbox
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        color="primary"
                        disabled={!canDelete(order.orderStatus)}
                      />
                    </Box>
                  )}
                  <CardContent sx={{ p: 3, pl: canDelete(order.orderStatus) ? 5 : 3 }}>
                    {/* Order Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Đơn hàng #{order.orderNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ngày đặt: {new Date(order.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      {/* Statuses */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                         <Chip
                          icon={paymentStatusInfo.icon}
                          label={paymentStatusInfo.label}
                          color={paymentStatusInfo.color}
                          size="small"
                        />
                        <Typography variant="h6" color="error.main" sx={{ fontWeight: 'bold' }}>
                          {formatPriceToVND(order.totalAmount)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Payment Method */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mr: 2, fontWeight: 'bold' }}>
                        Phương thức thanh toán:
                      </Typography>
                      <Chip
                        icon={paymentMethodInfo.icon}
                        label={paymentMethodInfo.label}
                        variant="outlined"
                        color={paymentMethodInfo.color}
                        size="small"
                      />
                    </Box>

                    {/* Product List */}
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Sản phẩm đã đặt:
                    </Typography>
                    <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mb: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell align="right">Số lượng</TableCell>
                            <TableCell align="right">Đơn giá</TableCell>
                            <TableCell align="right">Thành tiền</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item.product._id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar
                                    src={item.product.images[0]}
                                    variant="rounded"
                                    sx={{ mr: 1, width: 40, height: 40, backgroundColor: '#f0f0f0' }}
                                  >
                                    <ShoppingBagIcon />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {item.product.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Shop: {item.shop.name}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="right">{item.quantity}</TableCell>
                              <TableCell align="right">{formatPriceToVND(item.price)}</TableCell>
                              <TableCell align="right">{formatPriceToVND(item.quantity * item.price)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Shops in Order */}
                    <Box sx={{ mb: 2 }}>
                       <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Các cửa hàng trong đơn hàng:
                      </Typography>
                      <List disablePadding>
                        {order.shops.map((shop) => {
                          const shopTotal = order.items
                            .filter((item) => item.shop._id === shop._id)
                            .reduce((acc, item) => acc + item.price * item.quantity, 0);

                          return (
                            <ListItem
                              key={shop._id}
                              sx={{
                                p: 2,
                                mb: 1,
                                borderRadius: 1,
                                border: '1px solid #e0e0e0'
                              }}
                              secondaryAction={
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => console.log('Shop details clicked')}
                                >
                                  Chi tiết
                                </Button>
                              }
                            >
                              <ListItemAvatar>
                                <Avatar src={shop.logo || ''}>
                                  <StoreIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={shop.name}
                                secondary={`${order.items.filter(item => item.shop._id === shop._id).length} sản phẩm - ${formatPriceToVND(shopTotal)}`}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>

                    {/* Shipping Info */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        Địa chỉ giao hàng:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.shippingAddress.fullName} - {order.shippingAddress.phoneNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.shippingAddress.address.street}, {order.shippingAddress.address.ward}, {order.shippingAddress.address.district}, {order.shippingAddress.address.city}
                      </Typography>
                    </Box>

                    {/* Order Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {order.paymentStatus === 'paid' && order.orderStatus === 'delivered' && (
                          <Button variant="contained" color="primary">
                            Đánh giá sản phẩm
                          </Button>
                        )}
                        
                        {canDelete(order.orderStatus) && (
                          <Button 
                            variant="outlined" 
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteSingleOrder(order._id)}
                          >
                            Xóa đơn hàng
                          </Button>
                        )}
                        
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => console.log('Xem chi tiết đơn hàng:', order._id)}
                        >
                          Xem chi tiết
                        </Button>
                      </Box>
                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {order.orderStatus === 'pending' && order.paymentStatus !== 'paid' && (
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleCancelOrder(order._id)}
                          >
                            Hủy đơn hàng
                          </Button>
                        )}
                        {order.paymentMethod !== 'cod' && order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled' && (
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<PaymentIcon />}
                            onClick={() => handlePaymentNow(order)}
                          >
                            Thanh toán ngay
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === pagination.page ? 'contained' : 'outlined'}
              onClick={() => fetchOrders(page)}
              sx={{ mx: 0.5 }}
            >
              {page}
            </Button>
          ))}
        </Box>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialog.open} onClose={closePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon />
            Thanh toán đơn hàng #{paymentDialog.order?.orderNumber}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Tổng tiền: <strong>{formatPriceToVND(paymentDialog.order?.totalAmount || 0)}</strong>
          </Typography>
          
          {!bankingDetails ? (
            <FormControl component="fieldset">
              <FormLabel component="legend">Chọn phương thức thanh toán:</FormLabel>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              >
                <FormControlLabel
                  value="momo"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon />
                      Ví MoMo
                    </Box>
                  }
                />
                <FormControlLabel
                  value="vnpay"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CardIcon />
                      VNPay
                    </Box>
                  }
                />
                <FormControlLabel
                  value="bank_transfer"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BankIcon />
                      Chuyển khoản ngân hàng
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  💰 Thông tin chuyển khoản
                </Typography>
                <Typography variant="body2">
                  Vui lòng chọn một trong các tài khoản ngân hàng bên dưới để thực hiện chuyển khoản
                </Typography>
              </Alert>
              
              {/* Instructions */}
              {bankingDetails.instructions && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    📝 Hướng dẫn thanh toán:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    {bankingDetails.instructions.map((instruction, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                        {instruction}
                      </Typography>
                    ))}
                  </Paper>
                </Box>
              )}

              {/* Payment Summary */}
              <Paper sx={{ p: 2, bgcolor: 'error.light', mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="error.contrastText">
                      Nội dung chuyển khoản:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="error.contrastText">
                      {bankingDetails.transferContent}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography variant="subtitle2" color="error.contrastText">
                      Số tiền:
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="error.contrastText">
                      {formatPriceToVND(bankingDetails.amount / 1000000)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Bank Options */}
              <Typography variant="subtitle1" color="primary" gutterBottom sx={{ mt: 3 }}>
                🏦 Chọn tài khoản ngân hàng:
              </Typography>
              
              {bankingDetails.banks?.map((bank, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'primary.main' }}>
                  <Grid container spacing={2}>
                  <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        {bank.bankName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {bank.branch}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Số tài khoản:
                      </Typography>
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        color="primary"
                        sx={{ 
                          letterSpacing: 1,
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          p: 1,
                          borderRadius: 1
                        }}
                        onClick={() => navigator.clipboard.writeText(bank.accountNumber)}
                        title="Click để copy"
                      >
                        {bank.accountNumber}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tên tài khoản:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                        {bank.accountName}
                      </Typography>
                    </Grid>
                    {bank.swiftCode && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          SWIFT Code: <strong>{bank.swiftCode}</strong>
                    </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}

              {/* Contact Info */}
              <Paper sx={{ p: 2, bgcolor: 'success.light', mt: 3 }}>
                <Typography variant="subtitle1" color="success.contrastText" gutterBottom>
                  📞 Liên hệ hỗ trợ:
                    </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="success.contrastText">
                      Hotline: <strong>{bankingDetails.hotline}</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="success.contrastText">
                      Email: <strong>{bankingDetails.email}</strong>
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Lưu ý quan trọng:</strong> {bankingDetails.note}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentDialog}>
            {bankingDetails ? 'Đóng' : 'Hủy'}
          </Button>
          {!bankingDetails && (
            <Button
              variant="contained"
              onClick={handleProcessPayment}
              disabled={!selectedPaymentMethod || processingPayment}
            >
              {processingPayment ? <CircularProgress size={20} /> : 'Thanh toán'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Dialog xác nhận xóa đơn hàng */}
      <Dialog open={deleteConfirmDialog.open} onClose={closeDeleteConfirmDialog}>
        <DialogTitle sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Box display="flex" alignItems="center">
            <WarningIcon sx={{ mr: 1 }} />
            Xác nhận xóa
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1">
            {deleteConfirmDialog.mode === 'single' && 'Bạn có chắc chắn muốn xóa đơn hàng này?'}
            {deleteConfirmDialog.mode === 'multiple' && `Bạn có chắc chắn muốn xóa ${deleteConfirmDialog.orderIds.length} đơn hàng đã chọn?`}
            {deleteConfirmDialog.mode === 'all' && 'Bạn có chắc chắn muốn xóa tất cả đơn hàng đã hủy hoặc hoàn thành?'}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Lưu ý: Đây là hành động không thể hoàn tác. Dữ liệu đã xóa không thể khôi phục.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirmDialog}>
            Hủy bỏ
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={confirmDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrdersPage; 