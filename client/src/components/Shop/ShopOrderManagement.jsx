import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Pagination,
  Tabs,
  Tab,
  Box as MuiBox
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { formatPriceToVND, convertVNDToMillions, formatVNDDirectly } from '../../utils/formatters';
import api from '../../services/api';
import { toast } from 'react-toastify';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`orders-tabpanel-${index}`}
      aria-labelledby={`orders-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const ShopOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Order status configurations
  const statusConfig = {
    pending: { label: 'Chờ xác nhận', color: 'warning', icon: <PendingIcon /> },
    confirmed: { label: 'Đã xác nhận', color: 'info', icon: <CompleteIcon /> },
    processing: { label: 'Đang xử lý', color: 'primary', icon: <EditIcon /> },
    shipping: { label: 'Đang giao', color: 'secondary', icon: <ShippingIcon /> },
    delivered: { label: 'Đã giao', color: 'success', icon: <CompleteIcon /> },
    cancelled: { label: 'Đã hủy', color: 'error', icon: <CancelIcon /> }
  };

  const tabLabels = [
    { label: 'Tất cả', status: '' },
    { label: 'Chờ xác nhận', status: 'pending' },
    { label: 'Đã xác nhận', status: 'confirmed' },
    { label: 'Đang xử lý', status: 'processing' },
    { label: 'Đang giao', status: 'shipping' },
    { label: 'Đã giao', status: 'delivered' },
    { label: 'Đã hủy', status: 'cancelled' }
  ];

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, tabValue, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(tabLabels[tabValue].status && { status: tabLabels[tabValue].status }),
        ...filters
      });

      const response = await api.get(`/shops/my-shop/orders?${params}`);
      if (response.data.success) {
        setOrders(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.shops?.find(shop => shop.shop === order.shopId)?.status || order.orderStatus);
    setStatusUpdateDialogOpen(true);
  };

  const handleStatusSubmit = async () => {
    try {
      const updateData = {
        status: newStatus,
        ...(trackingNumber && { trackingNumber }),
        ...(cancelReason && { cancelReason })
      };

      const response = await api.put(`/shops/my-shop/orders/${selectedOrder._id}/status`, updateData);
      
      if (response.data.success) {
        toast.success('Cập nhật trạng thái đơn hàng thành công');
        setStatusUpdateDialogOpen(false);
        setTrackingNumber('');
        setCancelReason('');
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const getOrderStatusInfo = (order) => {
    // Get shop-specific status if available
    const shopOrder = order.shops?.find(shop => shop.shop._id === order.shopId);
    const status = shopOrder?.status || order.orderStatus;
    return statusConfig[status] || statusConfig.pending;
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

  const calculateShopTotal = (order) => {
    if (!order.items) return 0;
    return order.items
      .filter(item => item.shop === order.shopId)
      .reduce((sum, item) => sum + item.totalPrice, 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Quản lý đơn hàng
      </Typography>

      {/* Tabs for order status */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabLabels.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>

        <CardContent>
          {/* Search and filters */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={fetchOrders}
              >
                Tìm kiếm
              </Button>
            </Grid>
          </Grid>

          {/* Orders Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Alert severity="info">
              Không có đơn hàng nào {tabLabels[tabValue].status && `ở trạng thái "${tabLabels[tabValue].label}"`}
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã đơn hàng</TableCell>
                    <TableCell>Khách hàng</TableCell>
                    <TableCell>Ngày đặt</TableCell>
                    <TableCell>Sản phẩm</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                    <TableCell align="right">Tổng tiền</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => {
                    const statusInfo = getOrderStatusInfo(order);
                    const shopItems = order.items?.filter(item => item.shop === order.shopId) || [];
                    
                    return (
                      <TableRow key={order._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            #{order.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {order.customerInfo?.name || order.shippingAddress?.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.customerInfo?.phone || order.shippingAddress?.phoneNumber}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(order.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {shopItems.length} sản phẩm
                          </Typography>
                          {shopItems.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {shopItems[0].productName}
                              {shopItems.length > 1 && ` và ${shopItems.length - 1} SP khác`}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatPriceToVND(calculateShopTotal(order))}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleViewOrder(order)}
                            title="Xem chi tiết"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateStatus(order)}
                            title="Cập nhật trạng thái"
                            disabled={statusInfo.label === 'Đã giao' || statusInfo.label === 'Đã hủy'}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết đơn hàng #{selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Thông tin khách hàng
                  </Typography>
                  <Typography variant="body2">
                    Tên: {selectedOrder.customerInfo?.name || selectedOrder.shippingAddress?.fullName}
                  </Typography>
                  <Typography variant="body2">
                    SĐT: {selectedOrder.customerInfo?.phone || selectedOrder.shippingAddress?.phoneNumber}
                  </Typography>
                  <Typography variant="body2">
                    Email: {selectedOrder.customerInfo?.email || 'Chưa có'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Địa chỉ giao hàng
                  </Typography>
                  <Typography variant="body2">
                    {selectedOrder.shippingAddress?.address?.street}, {' '}
                    {selectedOrder.shippingAddress?.address?.ward}, {' '}
                    {selectedOrder.shippingAddress?.address?.district}, {' '}
                    {selectedOrder.shippingAddress?.address?.city}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Sản phẩm trong đơn hàng
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell align="center">Số lượng</TableCell>
                      <TableCell align="right">Giá</TableCell>
                      <TableCell align="right">Thành tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items
                      ?.filter(item => item.shop === selectedOrder.shopId)
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {formatPriceToVND(item.price)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPriceToVND(item.totalPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {selectedOrder.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Ghi chú
                  </Typography>
                  <Typography variant="body2">{selectedOrder.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialogOpen}
        onClose={() => setStatusUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cập nhật trạng thái đơn hàng</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Trạng thái mới</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Trạng thái mới"
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {newStatus === 'shipping' && (
              <TextField
                fullWidth
                label="Mã vận đơn"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}

            {newStatus === 'cancelled' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Lý do hủy đơn"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                sx={{ mb: 2 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusUpdateDialogOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleStatusSubmit} variant="contained">
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShopOrderManagement; 