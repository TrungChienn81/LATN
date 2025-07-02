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
  Avatar
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
  MonetizationOn as MoneyIcon
} from '@mui/icons-material';
import { formatPriceToVND } from '../../utils/formatters';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PaymentManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, order: null });
  const [transactionCode, setTransactionCode] = useState('');
  const [confirmNote, setConfirmNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/admin/pending-payments?page=${page}&limit=10`);
      
      if (response.data.success) {
        setOrders(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast.error('Không thể tải danh sách đơn hàng chờ xác nhận');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionCode.trim()) {
      toast.error('Vui lòng nhập mã giao dịch');
      return;
    }

    try {
      setProcessing(true);
      const response = await api.put(`/orders/${confirmDialog.order._id}/confirm-payment`, {
        transactionCode: transactionCode.trim(),
        note: confirmNote.trim()
      });

      if (response.data.success) {
        toast.success('Đã xác nhận thanh toán thành công!');
        setConfirmDialog({ open: false, order: null });
        setTransactionCode('');
        setConfirmNote('');
        fetchPendingOrders(); // Refresh list
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận thanh toán');
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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        💳 Quản lý thanh toán chuyển khoản
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Danh sách các đơn hàng chờ xác nhận thanh toán chuyển khoản. 
        Vui lòng kiểm tra kỹ thông tin giao dịch trước khi xác nhận.
      </Alert>

      {orders.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <BankIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Không có đơn hàng nào cần xác nhận thanh toán
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tất cả đơn hàng chuyển khoản đã được xử lý
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Đơn hàng</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell align="center">Ngày đặt</TableCell>
                    <TableCell align="right">Số tiền</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
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
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                          {formatPriceToVND(order.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label="Chờ xác nhận"
                          color="warning"
                          size="small"
                          icon={<BankIcon />}
                        />
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
                          <Tooltip title="Xác nhận thanh toán">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setConfirmDialog({ open: true, order })}
                            >
                              <CheckIcon />
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
                  onClick={() => fetchPendingOrders(page)}
                  sx={{ mx: 0.5 }}
                >
                  {page}
                </Button>
              ))}
            </Box>
          )}
        </>
      )}

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, order: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon color="success" />
            Xác nhận thanh toán chuyển khoản
          </Box>
        </DialogTitle>
        <DialogContent>
          {confirmDialog.order && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Đơn hàng: <strong>#{confirmDialog.order.orderNumber}</strong>
                </Typography>
                <Typography variant="body2">
                  Khách hàng: <strong>{confirmDialog.order.customerInfo?.name || confirmDialog.order.customer?.name}</strong>
                </Typography>
                <Typography variant="body2">
                  Số tiền: <strong>{formatPriceToVND(confirmDialog.order.totalAmount)}</strong>
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Mã giao dịch *"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                placeholder="Nhập mã giao dịch từ ngân hàng"
                sx={{ mb: 2 }}
                required
              />

              <TextField
                fullWidth
                label="Ghi chú"
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                placeholder="Ghi chú thêm (tùy chọn)"
                multiline
                rows={3}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, order: null })}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConfirmPayment}
            disabled={!transactionCode.trim() || processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      {renderOrderDetailsDialog()}
    </Box>
  );
};

export default PaymentManagement; 