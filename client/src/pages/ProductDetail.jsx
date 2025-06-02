import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Rating,
  TextField,
  Card,
  CardContent,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Compare as CompareIcon,
  Star as StarIcon
} from '@mui/icons-material';
import api from '../services/api';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useCompare } from '../contexts/CompareContext';


import { logUserBehavior } from '../utils/analytics';

// Component để hiển thị thông số kỹ thuật
const SpecificationTable = ({ specs }) => (
  <Box sx={{ mt: 3 }}>
    <Typography variant="h6" gutterBottom>Thông số kỹ thuật</Typography>
    <Paper elevation={0} variant="outlined">
      <List disablePadding>
        {Object.entries(specs).map(([key, value], index) => (
          <React.Fragment key={key}>
            <ListItem sx={{ py: 1, px: 2, bgcolor: index % 2 === 0 ? 'background.default' : 'white' }}>
              <Grid container>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">{key}</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{value}</Typography>
                </Grid>
              </Grid>
            </ListItem>
            {index < Object.entries(specs).length - 1 && (
              <Divider component="li" />
            )}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  </Box>
);

// Component đánh giá sản phẩm
const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState({ rating: 0, comment: '' });
  const [filter, setFilter] = useState('latest');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/products/${productId}/reviews?filter=${filter}`);
        if (response.data.success) {
          setReviews(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId, filter]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Vui lòng đăng nhập để đánh giá sản phẩm',
        severity: 'warning'
      });
      return;
    }

    if (userReview.rating === 0) {
      setSnackbar({
        open: true,
        message: 'Vui lòng chọn số sao đánh giá',
        severity: 'warning'
      });
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await api.post(`/products/${productId}/reviews`, {
        rating: userReview.rating,
        comment: userReview.comment
      });

      if (response.data.success) {
        setUserReview({ rating: 0, comment: '' });
        setSnackbar({
          open: true,
          message: 'Đánh giá của bạn đã được gửi thành công',
          severity: 'success'
        });
        
        // Refresh đánh giá
        const reviewsResponse = await api.get(`/products/${productId}/reviews?filter=${filter}`);
        if (reviewsResponse.data.success) {
          setReviews(reviewsResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setSnackbar({
        open: true,
        message: 'Đã xảy ra lỗi khi gửi đánh giá',
        severity: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Đánh giá từ khách hàng</Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sắp xếp theo</InputLabel>
          <Select
            value={filter}
            label="Sắp xếp theo"
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="latest">Mới nhất</MenuItem>
            <MenuItem value="highest">Đánh giá cao nhất</MenuItem>
            <MenuItem value="lowest">Đánh giá thấp nhất</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Form đánh giá */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Viết đánh giá của bạn</Typography>
        <Box component="form" onSubmit={handleSubmitReview}>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend" variant="body2" gutterBottom>
              Đánh giá của bạn:
            </Typography>
            <Rating
              name="rating"
              value={userReview.rating}
              onChange={(event, newValue) => {
                setUserReview({ ...userReview, rating: newValue });
              }}
              precision={1}
            />
          </Box>
          <TextField
            fullWidth
            label="Nhận xét của bạn"
            multiline
            rows={4}
            value={userReview.comment}
            onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            disabled={submitLoading}
            endIcon={submitLoading ? <CircularProgress size={20} /> : null}
          >
            Gửi đánh giá
          </Button>
        </Box>
      </Paper>

      {/* Danh sách đánh giá */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      ) : reviews.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body1">Chưa có đánh giá nào cho sản phẩm này</Typography>
        </Box>
      ) : (
        <Box>
          {reviews.map((review) => (
            <Card key={review._id} sx={{ mb: 2 }} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle1">{review.user?.name || 'Khách hàng ẩn danh'}</Typography>
                    <Rating value={review.rating} readOnly size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
                <Typography variant="body2">{review.comment}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Tab panels
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Component chính
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [compareSnackbar, setCompareSnackbar] = useState(false);
  
  const { addToCart } = useCart();
  const { addToCompare, compareItems } = useCompare();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProductDetail = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data.success) {
          setProduct(response.data.data);
          
          // Log user behavior
          if (user) {
            logUserBehavior('view', id);
          }
          
          // Check if in favorites
          if (user) {
            const favResponse = await api.get('/users/favorites');
            if (favResponse.data.success) {
              setIsFavorite(favResponse.data.data.some(fav => fav._id === id));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id, user]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    
    // Log user behavior
    if (user) {
      logUserBehavior('add_to_cart', id, { quantity });
    }
    
    setSnackbar({
      open: true,
      message: 'Sản phẩm đã được thêm vào giỏ hàng',
      severity: 'success'
    });
  };

  const handleAddToCompare = () => {
    // Kiểm tra nếu sản phẩm đã có trong danh sách so sánh
    if (compareItems.some(item => item._id === product._id)) {
      setSnackbar({
        open: true,
        message: 'Sản phẩm đã có trong danh sách so sánh',
        severity: 'info'
      });
      return;
    }

    // Thêm vào danh sách so sánh
    addToCompare(product);
    setCompareSnackbar(true);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      setSnackbar({
        open: true,
        message: 'Vui lòng đăng nhập để thêm sản phẩm vào yêu thích',
        severity: 'warning'
      });
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/users/favorites/${id}`);
      } else {
        await api.post('/users/favorites', { productId: id });
      }
      
      // Toggle favorite state
      setIsFavorite(!isFavorite);
      
      setSnackbar({
        open: true,
        message: isFavorite 
          ? 'Đã xóa sản phẩm khỏi danh sách yêu thích' 
          : 'Đã thêm sản phẩm vào danh sách yêu thích',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setSnackbar({
        open: true,
        message: 'Đã xảy ra lỗi, vui lòng thử lại sau',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container>
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>Không tìm thấy sản phẩm</Typography>
          <Button variant="contained" onClick={() => navigate('/products')}>
            Quay lại danh sách sản phẩm
          </Button>
        </Box>
      </Container>
    );
  }

  // Prepare specifications data
  const specifications = {
    'Thương hiệu': product.brand?.name || 'Không xác định',
    'Danh mục': product.category?.name || 'Không xác định',
    'Kho hàng': product.stockQuantity > 0 ? `Còn ${product.stockQuantity} sản phẩm` : 'Hết hàng',
    // Parse technical specs from proloop fields
    ...(product.technicalSpecs || {})
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={6}>
          <Box sx={{ aspectRatio: '1/1', width: '100%' }}>
            <ImageWithFallback
              src={product.images?.[0] || ''}
              alt={product.name}
              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
          
          {/* Thumbnails của các hình ảnh khác nếu có */}
          {product.images && product.images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              {product.images.map((image, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" gutterBottom>
            {product.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating value={product.rating || 0} precision={0.5} readOnly />
            <Typography variant="body2" sx={{ ml: 1 }}>
              ({product.numReviews || 0} đánh giá)
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Chip 
              label={product.category?.name || 'Không phân loại'} 
              size="small" 
              sx={{ mr: 1 }} 
            />
            <Chip 
              label={product.brand?.name || 'Không xác định'} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          </Box>
          
          <Typography variant="h5" color="primary" gutterBottom>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
              .format(product.price * 1000000)}
          </Typography>
          
          {product.originalPrice && product.originalPrice > product.price && (
            <Typography 
              variant="body2" 
              sx={{ textDecoration: 'line-through', color: 'text.secondary', mb: 2 }}
            >
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                .format(product.originalPrice * 1000000)}
            </Typography>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              Tình trạng: 
              <Chip 
                label={product.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'} 
                color={product.stockQuantity > 0 ? 'success' : 'error'} 
                size="small" 
                sx={{ ml: 1 }} 
              />
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Short Description */}
          <Typography variant="body1" paragraph>
            {product.description}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Quantity and Add to Cart */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>Số lượng:</Typography>
            <TextField
              type="number"
              value={quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value > 0 && value <= product.stockQuantity) {
                  setQuantity(value);
                }
              }}
              InputProps={{ inputProps: { min: 1, max: product.stockQuantity } }}
              size="small"
              sx={{ width: 80 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<CartIcon />} 
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              fullWidth
            >
              Thêm vào giỏ hàng
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<CompareIcon />}
              onClick={handleAddToCompare}
              fullWidth
            >
              So sánh
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color={isFavorite ? 'error' : 'primary'}
              startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              onClick={handleToggleFavorite}
            >
              {isFavorite ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
            </Button>
            
            <IconButton color="primary" aria-label="share">
              <ShareIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>
      
      {/* Tabs for more information */}
      <Box sx={{ mt: 6 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Mô tả chi tiết" />
            <Tab label="Thông số kỹ thuật" />
            <Tab label="Đánh giá" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {product.description}
          </Typography>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <SpecificationTable specs={specifications} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <ProductReviews productId={product._id} />
        </TabPanel>
      </Box>
      
      {/* Related Products */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>Sản phẩm tương tự</Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={6} sm={3} key={item}>
              <Card sx={{ height: '100%' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Snackbars */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={compareSnackbar}
        autoHideDuration={6000}
        onClose={() => setCompareSnackbar(false)}
        message="Đã thêm sản phẩm vào danh sách so sánh"
        action={
          <Button 
            color="inherit" 
            size="small"
            onClick={() => {
              setCompareSnackbar(false);
              navigate('/compare');
            }}
          >
            Xem so sánh
          </Button>
        }
      />
    </Container>
  );
};

export default ProductDetail;
