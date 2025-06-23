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
  Radio
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as LocalShippingIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  MonetizationOn as MonetizationOnIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon
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

  // Get success message from navigation state
  const successOrderNumber = location.state?.orderNumber;

  useEffect(() => {
    if (successOrderNumber) {
      toast.success(`Đặt hàng thành công! Mã đơn hàng: ${successOrderNumber}`);
    }
    fetchOrders();
  }, []);

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

  const getPaymentStatusInfo = (paymentStatus) => {
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
      zalopay: { label: 'ZaloPay', icon: <PaymentIcon />, color: 'warning' }
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Đơn hàng của tôi
      </Typography>

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
            const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus);
            const paymentMethodInfo = getPaymentMethodInfo(order.paymentMethod);
            
            return (
              <Grid item xs={12} key={order._id}>
                <Card sx={{ boxShadow: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    {/* Order Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Đơn hàng #{order.orderNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        {/* Status Chips */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          variant="outlined"
                            size="small"
                          />
                          <Chip
                            icon={paymentStatusInfo.icon}
                            label={paymentStatusInfo.label}
                            color={paymentStatusInfo.color}
                            variant="filled"
                            size="small"
                          />
                        </Box>
                        <Typography variant="h6" color="primary">
                          {formatPriceToVND(order.totalAmount)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Payment Method */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={paymentMethodInfo.icon}
                        label={paymentMethodInfo.label}
                        color={paymentMethodInfo.color}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Order Items */}
                    <Typography variant="subtitle1" gutterBottom>
                      Sản phẩm đã đặt:
                    </Typography>
                    
                    <TableContainer>
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
                          {order.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ mr: 2 }}>
                                    <img
                                      src={item.productImage || '/placeholder-image.jpg'}
                                      alt={item.productName}
                                      style={{
                                        width: 50,
                                        height: 50,
                                        objectFit: 'contain',
                                        borderRadius: 4
                                      }}
                                    />
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {item.productName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Shop: {item.shopName}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="right">{formatPriceToVND(item.price)}</TableCell>
                              <TableCell align="right">{formatPriceToVND(item.totalPrice)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Divider sx={{ my: 2 }} />

                    {/* Shipping Address */}
                    <Typography variant="subtitle2" gutterBottom>
                      Địa chỉ giao hàng:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {order.shippingAddress.fullName} - {order.shippingAddress.phoneNumber}
                      <br />
                      {order.shippingAddress.address.street}, {order.shippingAddress.address.ward}, {order.shippingAddress.address.district}, {order.shippingAddress.address.city}
                    </Typography>

                    {/* Order Notes */}
                    {order.notes && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          Ghi chú:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {order.notes}
                        </Typography>
                      </>
                    )}

                    {/* Order Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                      {order.orderStatus === 'pending' && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleCancelOrder(order._id)}
                        >
                          Hủy đơn hàng
                        </Button>
                      )}
                      
                      {/* Payment Button - Show if payment is pending and order is not COD */}
                      {order.paymentStatus === 'pending' && order.paymentMethod !== 'cod' && 
                       ['pending', 'confirmed'].includes(order.orderStatus) && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<PaymentIcon />}
                          onClick={() => handlePaymentNow(order)}
                        >
                          Thanh toán ngay
                        </Button>
                      )}
                      
                      <Button variant="outlined">
                        Xem chi tiết
                      </Button>
                      
                      {order.orderStatus === 'delivered' && (
                        <Button variant="contained">
                          Đánh giá
                        </Button>
                      )}
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
                  Thông tin chuyển khoản
                </Typography>
              </Alert>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ngân hàng:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {bankingDetails.bankName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tài khoản:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      {bankingDetails.accountNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tên tài khoản:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {bankingDetails.accountName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nội dung chuyển khoản:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="error">
                      {bankingDetails.transferContent}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Số tiền:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatPriceToVND(bankingDetails.amount / 1000000)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                {bankingDetails.note}
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
    </Container>
  );
};

export default OrdersPage; 