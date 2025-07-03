import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  MonetizationOn as MoneyIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { formatPriceToVND } from '../../utils/formatters';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PaymentManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [shippingDialog, setShippingDialog] = useState({ open: false, order: null });
  const [newStatus, setNewStatus] = useState('');
  const [shippingNote, setShippingNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async (page = 1) => {
    try {
      setLoading(true);
      // Lấy danh sách đơn hàng đã thanh toán
      const response = await api.get(`/orders/admin?page=${page}&limit=10&paymentStatus=paid`);
      
      if (response.data.success) {
        setOrders(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching paid orders:', error);
      toast.error('Không thể tải danh sách đơn hàng đã thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShippingStatus = async () => {
    if (!newStatus) {
      toast.error('Vui lòng chọn trạng thái giao hàng');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.put(`/orders/${shippingDialog.order._id}/status`, {
        orderStatus: newStatus,
        note: shippingNote.trim()
      });

      if (response.data.success) {
        toast.success('Đã cập nhật trạng thái giao hàng thành công!');
        setShippingDialog({ open: false, order: null });
        setNewStatus('');
        setShippingNote('');
        fetchPendingOrders(); // Refresh list
      }
    } catch (error) {
      console.error('Error updating shipping status:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái giao hàng');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setViewDialog(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderDetailsDialog = () => (
    <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon />
          Chi tiết đơn hàng #{selectedOrder?.orderNumber}
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedOrder && (
          <Grid container spacing={3}>
            {/* Customer Info */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    👤 Thông tin khách hàng
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="body1">
                      {selectedOrder.customerInfo?.name || selectedOrder.customer?.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {selectedOrder.customerInfo?.email || selectedOrder.customer?.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" />
                    <Typography variant="body2" color="text.secondary">
                      {selectedOrder.customerInfo?.phone || 'Chưa có số điện thoại'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Info */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📦 Thông tin đơn hàng
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Ngày đặt:</strong> {formatDate(selectedOrder.createdAt)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Trạng thái:</strong>{' '}
                    <Chip 
                      label={selectedOrder.orderStatus} 
                      size="small" 
                      color={selectedOrder.orderStatus === 'confirmed' ? 'success' : 'warning'}
                    />
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Tổng tiền:</strong>{' '}
                    <Typography component="span" variant="h6" color="primary">
                      {formatPriceToVND(selectedOrder.totalAmount)}
                    </Typography>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Shipping Address */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    🚚 Địa chỉ giao hàng
                  </Typography>
                  <Typography variant="body1">
                    {selectedOrder.shippingAddress?.fullAddress || 
                     `${selectedOrder.shippingAddress?.street}, ${selectedOrder.shippingAddress?.ward}, ${selectedOrder.shippingAddress?.district}, ${selectedOrder.shippingAddress?.province}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Items */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    🛍️ Sản phẩm đã đặt
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
                        {selectedOrder.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                  src={item.productImage}
                                  alt={item.productName}
                                  sx={{ width: 40, height: 40 }}
                                  variant="rounded"
                                />
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {item.productName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Shop: {item.shopName || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">{formatPriceToVND(item.price)}</TableCell>
                            <TableCell align="right">
                              <Typography fontWeight="bold">
                                {formatPriceToVND(item.price * item.quantity)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewDialog(false)}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        💳 Quản lý đơn hàng đã thanh toán
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Danh sách các đơn hàng đã thanh toán. Vui lòng kiểm tra kỹ thông tin đơn hàng trước khi cập nhật trạng thái giao hàng.
      </Alert>

      {orders.length === 0 ? (
        <Alert severity="info">Không có đơn hàng đã thanh toán nào cần xử lý</Alert>
      ) : (
        <>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã đơn hàng</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell align="center">Ngày đặt</TableCell>
                    <TableCell align="center">Trạng thái giao hàng</TableCell>
                    <TableCell align="right">Tổng tiền</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            #{order.orderNumber}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.items?.length || 0} sản phẩm
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {order.customerInfo?.name || order.customer?.name || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.customerInfo?.email || order.customer?.email || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {formatDate(order.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={order.orderStatus === 'pending' ? 'Chờ xử lý' :
                                 order.orderStatus === 'processing' ? 'Đang xử lý' :
                                 order.orderStatus === 'shipped' ? 'Đang giao hàng' :
                                 order.orderStatus === 'delivered' ? 'Đã giao hàng' :
                                 order.orderStatus === 'completed' ? 'Hoàn thành' :
                                 order.orderStatus === 'cancelled' ? 'Đã hủy' : order.orderStatus}
                          color={order.orderStatus === 'pending' ? 'warning' :
                                order.orderStatus === 'processing' ? 'info' :
                                order.orderStatus === 'shipped' ? 'primary' :
                                order.orderStatus === 'delivered' ? 'success' :
                                order.orderStatus === 'completed' ? 'success' :
                                'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">
                          {formatPriceToVND(order.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Xem chi tiết">
                            <IconButton
                              size="small"
                              onClick={() => handleViewOrderDetails(order)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cập nhật trạng thái giao hàng">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setShippingDialog({ open: true, order });
                                setNewStatus(order.orderStatus);
                              }}
                            >
                              <ShippingIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === pagination.page ? 'contained' : 'outlined'}
                  onClick={() => fetchPaidOrders(page)}
                  sx={{ mx: 0.5 }}
                >
                  {page}
                </Button>
              ))}
            </Box>
          )}
        </>
      )}

      {/* Update Shipping Status Dialog */}
      <Dialog open={shippingDialog.open} onClose={() => setShippingDialog({ open: false, order: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShippingIcon color="primary" />
            Cập nhật trạng thái giao hàng
          </Box>
        </DialogTitle>
        <DialogContent>
          {shippingDialog.order && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Đơn hàng: <strong>#{shippingDialog.order.orderNumber}</strong>
                </Typography>
                <Typography variant="body2">
                  Khách hàng: <strong>{shippingDialog.order.customerInfo?.name || shippingDialog.order.customer?.name}</strong>
                </Typography>
                <Typography variant="body2">
                  Số tiền: <strong>{formatPriceToVND(shippingDialog.order.totalAmount)}</strong>
                </Typography>
                <Typography variant="body2">
                  Phương thức thanh toán: <strong>
                    {shippingDialog.order.paymentMethod === 'bankTransfer' ? 'Chuyển khoản' : 
                     shippingDialog.order.paymentMethod === 'momo' ? 'MoMo' :
                     shippingDialog.order.paymentMethod === 'cod' ? 'Tiền mặt khi nhận hàng' : 
                     shippingDialog.order.paymentMethod}
                  </strong>
                </Typography>
                <Typography variant="body2" color="success.main">
                  <CheckIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Đã thanh toán
                </Typography>
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="shipping-status-label">Trạng thái giao hàng *</InputLabel>
                <Select
                  labelId="shipping-status-label"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  label="Trạng thái giao hàng *"
                  required
                >
                  <MenuItem value="processing">Đang xử lý</MenuItem>
                  <MenuItem value="shipped">Đang giao hàng</MenuItem>
                  <MenuItem value="delivered">Đã giao hàng</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Ghi chú"
                value={shippingNote}
                onChange={(e) => setShippingNote(e.target.value)}
                placeholder="Ghi chú thêm về việc giao hàng (tùy chọn)"
                multiline
                rows={3}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShippingDialog({ open: false, order: null })}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateShippingStatus}
            disabled={!newStatus || processing}
            startIcon={processing ? <CircularProgress size={20} /> : <ShippingIcon />}
          >
            {processing ? 'Đang xử lý...' : 'Cập nhật trạng thái'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      {renderOrderDetailsDialog()}
    </Box>
  );
};

export default PaymentManagement; 