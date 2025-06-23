import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  Info as InfoIcon,
  Payment as PaymentIcon,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatPriceToVND } from '../utils/formatters';
import api from '../services/api';
import { toast } from 'react-toastify';

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

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    customerType: 'Anh',
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    phoneNumber: user?.phoneNumber || '',
    deliveryMethod: 'home_delivery',
    province: '',
    district: '',
    ward: '',
    address: '',
    notes: '',
    needInvoice: false,
    paymentMethod: 'cod'
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [isAuthenticated, cart, navigate]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleCheckboxChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const validateForm = () => {
    const required = ['fullName', 'phoneNumber', 'province', 'district', 'ward', 'address'];
    for (let field of required) {
      if (!formData[field]) {
        toast.error(`Vui lòng điền ${field === 'fullName' ? 'họ tên' : 
          field === 'phoneNumber' ? 'số điện thoại' :
          field === 'province' ? 'tỉnh/thành phố' :
          field === 'district' ? 'quận/huyện' :
          field === 'ward' ? 'phường/xã' : 'địa chỉ'}`);
        return false;
      }
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const orderData = {
        customerInfo: {
          name: formData.fullName,
          phone: formData.phoneNumber
        },
        shippingAddress: {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: {
            street: formData.address,
            city: formData.province,
            district: formData.district,
            ward: formData.ward
          }
        },
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        needInvoice: formData.needInvoice,
        items: cart.items.map(item => ({
          product: item.product._id,
          productName: item.product.name,
          productImage: item.product.images?.[0] || '',
          shop: item.shop._id,
          shopName: item.shop.shopName,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity
        })),
        subtotal: cart.totalAmount,
        shippingFee: 0,
        totalAmount: cart.totalAmount
      };

      console.log('=== DEBUG ORDER DATA ===');
      console.log('formData:', formData);
      console.log('cart:', cart);
      console.log('cart.items:', cart.items);
      console.log('orderData:', orderData);
      console.log('items count:', orderData.items?.length);
      console.log('first item:', orderData.items?.[0]);
      console.log('========================');

      const response = await api.post('/orders', orderData);
      
      if (response.data.success) {
        await clearCart();
        toast.success('Đặt hàng thành công!');
        navigate('/orders', { 
          state: { orderNumber: response.data.data.orderNumber }
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Progress Steps */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper 
          activeStep={1} 
          connector={<ColorlibConnector />}
          sx={{ mb: 2 }}
        >
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel StepIconComponent={ColorlibStepIcon}>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - Order Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {/* Customer Information */}
            <Typography variant="h6" gutterBottom>
              Thông tin khách mua hàng
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                row
                value={formData.customerType}
                onChange={handleInputChange('customerType')}
              >
                <FormControlLabel value="Anh" control={<Radio />} label="Anh" />
                <FormControlLabel value="Chị" control={<Radio />} label="Chị" />
              </RadioGroup>
            </FormControl>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nhập họ tên"
                  value={formData.fullName}
                  onChange={handleInputChange('fullName')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nhập số điện thoại"
                  value={formData.phoneNumber}
                  onChange={handleInputChange('phoneNumber')}
                  required
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Delivery Method */}
            <Typography variant="h6" gutterBottom>
              Chọn cách nhận hàng
            </Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                value={formData.deliveryMethod}
                onChange={handleInputChange('deliveryMethod')}
              >
                <FormControlLabel 
                  value="home_delivery" 
                  control={<Radio />} 
                  label="Giao hàng tận nơi" 
                />
              </RadioGroup>
            </FormControl>

            {/* Address Form */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Tỉnh, Thành phố"
                  value={formData.province}
                  onChange={handleInputChange('province')}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Quận, Huyện"
                  value={formData.district}
                  onChange={handleInputChange('district')}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Phường, Xã"
                  value={formData.ward}
                  onChange={handleInputChange('ward')}
                  required
                />
              </Grid>
            </Grid>

            {/* Temporary: Keep the street address field */}
            <TextField
              fullWidth
              label="Số nhà, tên đường"
              value={formData.address}
              onChange={handleInputChange('address')}
              required
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Lưu ý, yêu cầu khác (Không bắt buộc)"
              value={formData.notes}
              onChange={handleInputChange('notes')}
              sx={{ mb: 3 }}
            />

            <FormGroup sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.needInvoice}
                    onChange={handleCheckboxChange('needInvoice')}
                  />
                }
                label="Xuất hoá đơn cho đơn hàng"
              />
            </FormGroup>

            {/* Payment Method Selection */}
            <Typography variant="h6" gutterBottom>
              Phương thức thanh toán
            </Typography>
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup
                value={formData.paymentMethod || 'cod'}
                onChange={handleInputChange('paymentMethod')}
              >
                <FormControlLabel
                  value="cod"
                  control={<Radio />}
                  label="Thanh toán khi nhận hàng (COD)"
                />
                <FormControlLabel
                  value="momo"
                  control={<Radio />}
                  label="Ví MoMo"
                />
                <FormControlLabel
                  value="vnpay"
                  control={<Radio />}
                  label="VNPay"
                />
                <FormControlLabel
                  value="bank_transfer"
                  control={<Radio />}
                  label="Chuyển khoản ngân hàng"
                />
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            {/* Shipping Service */}
            <Typography variant="h6" gutterBottom>
              Dịch vụ giao hàng
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Miễn phí giao hàng toàn quốc
            </Alert>
          </Paper>
        </Grid>

        {/* Right Column - Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h6" gutterBottom>
              Đơn hàng ({cart.totalItems} sản phẩm)
            </Typography>
            
            {cart.items.map((item) => (
              <Box key={item._id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                <Typography variant="body2" fontWeight="bold">
                  {item.product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Số lượng: {item.quantity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatPriceToVND(item.price * item.quantity)}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">Tổng tiền:</Typography>
              <Typography variant="h6" color="primary">
                {formatPriceToVND(cart.totalAmount)}
              </Typography>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handlePlaceOrder}
              disabled={loading}
              sx={{ 
                backgroundColor: '#e53e3e',
                '&:hover': { backgroundColor: '#d32f2f' },
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'ĐẶT HÀNG NGAY'
              )}
            </Button>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
              Bạn có thể chọn hình thức thanh toán sau khi đặt hàng
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPage; 