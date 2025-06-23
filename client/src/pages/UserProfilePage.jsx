import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Favorite as FavoriteIcon,
  RateReview as RateReviewIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ReviewCard from '../components/ReviewCard';
import { reviewService } from '../services/reviewApi';

const UserProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: ''
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPagination, setReviewsPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0
  });
  
  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender || ''
      });
    }
  }, [user]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await api.put('/users/profile', profileData);
      
      if (response.data.success) {
        updateUser(response.data.user);
        setEditMode(false);
        setSnackbar({
          open: true,
          message: 'Cập nhật thông tin thành công!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePassword = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Mật khẩu xác nhận không khớp',
        severity: 'error'
      });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        severity: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        setPasswordDialogOpen(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSnackbar({
          open: true,
          message: 'Đổi mật khẩu thành công!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const ProfileTab = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar 
            sx={{ width: 80, height: 80, mr: 2 }}
            src={user?.avatar}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tham gia từ: {new Date(user?.createdAt).toLocaleDateString('vi-VN')}
            </Typography>
          </Box>
          <Box>
            {!editMode ? (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
              >
                Chỉnh sửa
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : 'Lưu'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    setEditMode(false);
                    // Reset data
                    setProfileData({
                      name: user.name || '',
                      email: user.email || '',
                      phone: user.phone || '',
                      address: user.address || '',
                      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
                      gender: user.gender || ''
                    });
                  }}
                >
                  Hủy
                </Button>
              </Box>
            )}
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Họ và tên"
              name="name"
              value={profileData.name}
              onChange={handleProfileInputChange}
              disabled={!editMode}
              variant={editMode ? "outlined" : "filled"}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={profileData.email}
              onChange={handleProfileInputChange}
              disabled={true} // Email không cho phép sửa
              variant="filled"
              helperText="Email không thể thay đổi"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Số điện thoại"
              name="phone"
              value={profileData.phone}
              onChange={handleProfileInputChange}
              disabled={!editMode}
              variant={editMode ? "outlined" : "filled"}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ngày sinh"
              name="dateOfBirth"
              type="date"
              value={profileData.dateOfBirth}
              onChange={handleProfileInputChange}
              disabled={!editMode}
              variant={editMode ? "outlined" : "filled"}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Địa chỉ"
              name="address"
              value={profileData.address}
              onChange={handleProfileInputChange}
              disabled={!editMode}
              variant={editMode ? "outlined" : "filled"}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<LockIcon />}
            onClick={() => setPasswordDialogOpen(true)}
          >
            Đổi mật khẩu
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
  
  const OrderHistoryTab = () => {
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [orderPagination, setOrderPagination] = useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    });
    const [statusFilter, setStatusFilter] = useState('all');
    
    useEffect(() => {
      fetchOrders();
    }, [orderPagination.page, statusFilter]);
    
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const params = new URLSearchParams({
          page: orderPagination.page,
          limit: orderPagination.limit
        });
        
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        const response = await api.get(`/users/orders?${params}`);
        if (response.data.success) {
          setOrders(response.data.data);
          setOrderPagination(prev => ({
            ...prev,
            total: response.data.total,
            totalPages: response.data.totalPages
          }));
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setSnackbar({
          open: true,
          message: 'Không thể tải danh sách đơn hàng',
          severity: 'error'
        });
      } finally {
        setOrdersLoading(false);
      }
    };
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'warning';
        case 'confirmed': return 'info';
        case 'processing': return 'primary';
        case 'shipping': return 'secondary';
        case 'delivered': return 'success';
        case 'cancelled': return 'error';
        default: return 'default';
      }
    };
    
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return 'Chờ xác nhận';
        case 'confirmed': return 'Đã xác nhận';
        case 'processing': return 'Đang xử lý';
        case 'shipping': return 'Đang giao';
        case 'delivered': return 'Đã giao';
        case 'cancelled': return 'Đã hủy';
        default: return status;
      }
    };
    
    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    };
    
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Lịch sử đơn hàng
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="pending">Chờ xác nhận</MenuItem>
                <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                <MenuItem value="processing">Đang xử lý</MenuItem>
                <MenuItem value="shipping">Đang giao</MenuItem>
                <MenuItem value="delivered">Đã giao</MenuItem>
                <MenuItem value="cancelled">Đã hủy</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {ordersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Không có đơn hàng nào
              </Typography>
            </Box>
          ) : (
            <Box>
              {orders.map((order) => (
                <Paper key={order._id} variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Đơn hàng #{order._id?.slice(-8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Shop: {order.shopId?.shopName || 'Không xác định'}
                      </Typography>
                    </Box>
                    <Chip 
                      label={getStatusText(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box>
                    {order.items?.slice(0, 2).map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar 
                          src={item.productId?.images?.[0]} 
                          variant="rounded"
                          sx={{ width: 40, height: 40, mr: 2 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" noWrap>
                            {item.productId?.name || 'Sản phẩm không xác định'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Số lượng: {item.quantity} × {formatPrice(item.price)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    {order.items?.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        và {order.items.length - 2} sản phẩm khác...
                      </Typography>
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">
                      Tổng tiền: <strong>{formatPrice(order.totalAmount)}</strong>
                    </Typography>
                    <Button size="small" variant="outlined">
                      Xem chi tiết
                    </Button>
                  </Box>
                </Paper>
              ))}
              
              {/* Pagination */}
              {orderPagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={orderPagination.totalPages}
                    page={orderPagination.page}
                    onChange={(e, page) => setOrderPagination(prev => ({ ...prev, page }))}
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
    };

  const ReviewsTab = () => {
    // Fetch user reviews
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await reviewService.getUserReviews({
          page: reviewsPagination.page,
          limit: 10
        });
        
        setReviews(response.data.data);
        setReviewsPagination(prev => ({
          ...prev,
          totalPages: response.data.totalPages,
          total: response.data.total
        }));
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setSnackbar({
          open: true,
          message: 'Không thể tải danh sách đánh giá',
          severity: 'error'
        });
      } finally {
        setReviewsLoading(false);
      }
    };

    useEffect(() => {
      if (tabValue === 3) { // Reviews tab index
        fetchReviews();
      }
    }, [tabValue, reviewsPagination.page]);

    const handleDeleteReview = async (reviewId) => {
      if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

      try {
        await reviewService.deleteReview(reviewId);
        setReviews(prev => prev.filter(review => review._id !== reviewId));
        setReviewsPagination(prev => ({
          ...prev,
          total: prev.total - 1
        }));
        setSnackbar({
          open: true,
          message: 'Xóa đánh giá thành công',
          severity: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Không thể xóa đánh giá',
          severity: 'error'
        });
      }
    };

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Đánh giá của tôi ({reviewsPagination.total} đánh giá)
          </Typography>
          
          {reviewsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reviews.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Bạn chưa có đánh giá nào
              </Typography>
              <Button variant="outlined" sx={{ mt: 2 }} href="/products">
                Khám phá sản phẩm
              </Button>
            </Box>
          ) : (
            <Box>
              {reviews.map((review) => (
                <Box key={review._id} sx={{ mb: 2 }}>
                  {/* Product info */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar
                        variant="rounded"
                        src={review.productId?.images?.[0]}
                        sx={{ width: 60, height: 60 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {review.productId?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Shop: {review.shopId?.shopName}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(review.productId?.price || 0)}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        href={`/product/${review.productId?._id}`}
                      >
                        Xem sản phẩm
                      </Button>
                    </Box>
                  </Box>
                  
                  {/* Review content */}
                  <ReviewCard
                    review={review}
                    currentUser={user}
                    onDelete={handleDeleteReview}
                    showShopReply={true}
                  />
                </Box>
              ))}
              
              {/* Pagination */}
              {reviewsPagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={reviewsPagination.totalPages}
                    page={reviewsPagination.page}
                    onChange={(e, page) => setReviewsPagination(prev => ({ ...prev, page }))}
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const WishlistTab = () => {
    const [wishlist, setWishlist] = useState([]);
    const [wishlistLoading, setWishlistLoading] = useState(true);
    const [wishlistPagination, setWishlistPagination] = useState({
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0
    });
    
    useEffect(() => {
      fetchWishlist();
    }, [wishlistPagination.page]);
    
    const fetchWishlist = async () => {
      try {
        setWishlistLoading(true);
        const params = new URLSearchParams({
          page: wishlistPagination.page,
          limit: wishlistPagination.limit
        });
        
        const response = await api.get(`/users/wishlist?${params}`);
        if (response.data.success) {
          setWishlist(response.data.data);
          setWishlistPagination(prev => ({
            ...prev,
            total: response.data.total,
            totalPages: response.data.totalPages
          }));
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setSnackbar({
          open: true,
          message: 'Không thể tải danh sách yêu thích',
          severity: 'error'
        });
      } finally {
        setWishlistLoading(false);
      }
    };
    
    const handleRemoveFromWishlist = async (productId) => {
      try {
        const response = await api.delete(`/users/wishlist/${productId}`);
        if (response.data.success) {
          setWishlist(prev => prev.filter(item => item._id !== productId));
          setSnackbar({
            open: true,
            message: 'Đã xóa khỏi danh sách yêu thích',
            severity: 'success'
          });
        }
      } catch (error) {
        console.error('Error removing from wishlist:', error);
        setSnackbar({
          open: true,
          message: 'Không thể xóa khỏi wishlist',
          severity: 'error'
        });
      }
    };
    
    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    };
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Danh sách yêu thích ({wishlistPagination.total} sản phẩm)
          </Typography>
          
          {wishlistLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : wishlist.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Chưa có sản phẩm yêu thích nào
              </Typography>
              <Button variant="outlined" sx={{ mt: 2 }} href="/products">
                Khám phá sản phẩm
              </Button>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2}>
                {wishlist.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product._id}>
                    <Card variant="outlined">
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          variant="rounded"
                          src={product.images?.[0]}
                          sx={{ 
                            width: '100%', 
                            height: 140, 
                            borderRadius: 1,
                            mb: 1
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
                          }}
                          onClick={() => handleRemoveFromWishlist(product._id)}
                        >
                          <FavoriteIcon color="error" />
                        </IconButton>
                      </Box>
                      
                      <CardContent sx={{ pt: 0 }}>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          noWrap
                          title={product.name}
                        >
                          {product.name}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {product.category?.name || 'Không xác định'} • {product.brand?.name || 'Không xác định'}
                        </Typography>
                        
                        <Typography variant="body1" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                          {formatPrice(product.price)}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button 
                            size="small" 
                            variant="contained" 
                            fullWidth
                            href={`/product/${product._id}`}
                          >
                            Xem chi tiết
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {/* Pagination */}
              {wishlistPagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={wishlistPagination.totalPages}
                    page={wishlistPagination.page}
                    onChange={(e, page) => setWishlistPagination(prev => ({ ...prev, page }))}
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Tài khoản của tôi
      </Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<PersonIcon />} label="Thông tin cá nhân" />
          <Tab icon={<HistoryIcon />} label="Lịch sử đơn hàng" />
          <Tab icon={<FavoriteIcon />} label="Yêu thích" />
          <Tab icon={<RateReviewIcon />} label="Đánh giá của tôi" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && <ProfileTab />}
          {tabValue === 1 && <OrderHistoryTab />}
          {tabValue === 2 && <WishlistTab />}
          {tabValue === 3 && <ReviewsTab />}
        </Box>
      </Paper>
      
      {/* Password Change Dialog */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Mật khẩu hiện tại"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Mật khẩu mới"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleChangePassword}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Đổi mật khẩu'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserProfilePage; 