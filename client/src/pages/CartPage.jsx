import React, { useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  TextField,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  Stack,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepConnector
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowBack as ArrowBackIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPriceToVND } from '../utils/formatters';
import { ImageWithFallback } from '../components/common/ImageWithFallback';

// Custom Step Connector
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: '#e53e3e',
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: '#e53e3e',
  },
}));

// Custom Step Icon
const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: ownerState.completed || ownerState.active ? '#e53e3e' : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
}));

function ColorlibStepIcon(props) {
  const { active, completed, className } = props;

  const icons = {
    1: <ShoppingCartIcon />,
    2: <PaymentIcon />,
    3: <PaymentIcon />,
    4: <CheckCircleOutlineIcon />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

const steps = [
  'Giỏ hàng',
  'Thông tin đặt hàng', 
  'Thanh toán',
  'Hoàn tất'
];

const CartPage = () => {
  const { cart, loading, updateCartItem, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateCartItem(productId, newQuantity);
  };

  const handleRemoveItem = async (productId) => {
    await removeFromCart(productId);
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      await clearCart();
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingCartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Giỏ hàng của bạn đang trống
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Hãy thêm một số sản phẩm vào giỏ hàng để tiếp tục mua sắm
          </Typography>
          <Button
            variant="contained"
            component={RouterLink}
            to="/products"
            startIcon={<ArrowBackIcon />}
          >
            Tiếp tục mua sắm
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* Progress Stepper */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper 
          activeStep={0} 
          connector={<ColorlibConnector />}
          sx={{ mb: 2 }}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel StepIconComponent={ColorlibStepIcon}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: index === 0 ? 'bold' : 'normal',
                    color: index === 0 ? '#e53e3e' : 'text.secondary'
                  }}
                >
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Cart Header - Full Width */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Giỏ hàng của bạn
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {cart.totalItems} sản phẩm trong giỏ hàng
        </Typography>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 3 
      }}>
        {/* Left Column - Cart Items */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '2 1 66.666%' } }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Sản phẩm</Typography>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClearCart}
                disabled={cart.items.length === 0}
              >
                Xóa tất cả
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />

            {cart.items.map((item) => (
              <Card key={item._id} sx={{ mb: 2, boxShadow: 1 }}>
                <Box sx={{ display: 'flex', p: 2 }}>
                  {/* Product Image */}
                  <Box sx={{ width: 120, height: 120, mr: 2 }}>
                    <ImageWithFallback
                      src={item.product?.images?.[0] || ''}
                      alt={item.product?.name || 'Product'}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: 1
                      }}
                    />
                  </Box>

                  {/* Product Info */}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      component={RouterLink}
                      to={`/product/${item.product?._id}`}
                      sx={{
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {item.product?.name || 'Tên sản phẩm không có'}
                    </Typography>
                    
                    {item.shop && (
                      <Chip
                        label={item.shop.shopName}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 1, mb: 1 }}
                      />
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Giá: {formatPriceToVND(item.price)}
                    </Typography>

                    {/* Quantity Controls */}
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <TextField
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            handleQuantityChange(item.product._id, value);
                          }}
                          inputProps={{
                            min: 1,
                            style: { textAlign: 'center', width: '60px' }
                          }}
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': { display: 'none' },
                            '& .MuiInput-underline:after': { display: 'none' }
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>

                      <Typography variant="body2" sx={{ minWidth: 100 }}>
                        Thành tiền: <strong>{formatPriceToVND(item.price * item.quantity)}</strong>
                      </Typography>

                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(item.product._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                </Box>
              </Card>
            ))}
          </Paper>
        </Box>

        {/* Right Column - Order Summary */}
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33.333%' } }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h6" gutterBottom>
              Tóm tắt đơn hàng
            </Typography>
            
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Tạm tính:</Typography>
                <Typography variant="body2">{formatPriceToVND(cart.totalAmount)}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Phí vận chuyển:</Typography>
                <Typography variant="body2">Miễn phí</Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Tổng cộng:</Typography>
              <Typography variant="h6" color="primary">
                {formatPriceToVND(cart.totalAmount)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleCheckout}
              sx={{ mb: 2 }}
            >
              Tiến hành thanh toán
            </Button>

            <Button
              variant="outlined"
              fullWidth
              component={RouterLink}
              to="/products"
              startIcon={<ArrowBackIcon />}
            >
              Tiếp tục mua sắm
            </Button>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default CartPage; 