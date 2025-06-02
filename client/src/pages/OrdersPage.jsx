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
  TableRow
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocalShipping as LocalShippingIcon,
  Schedule as ScheduleIcon
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
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="h6" color="primary">
                          {formatPriceToVND(order.totalAmount)}
                        </Typography>
                      </Box>
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
    </Container>
  );
};

export default OrdersPage; 