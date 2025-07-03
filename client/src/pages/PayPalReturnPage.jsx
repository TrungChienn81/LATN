import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Button,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  Home as HomeIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';

const PayPalReturnPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment_status');
    const orderId = params.get('order_id');
    const paymentMethod = params.get('payment_method');
    const error = params.get('error');
    const message = params.get('message');

    // Parse the original PayPal parameters that may be included
    const token = params.get('token');
    const PayerID = params.get('PayerID');

    setPaymentInfo({
      status: paymentStatus,
      orderId,
      paymentMethod,
      error,
      message,
      token,
      PayerID
    });

    setLoading(false);
  }, [location]);

  useEffect(() => {
    if (paymentInfo?.status === 'success') {
      const timer = setTimeout(() => {
        navigate('/orders', { state: { orderNumber: paymentInfo.orderId } });
      }, 3000); // Redirect after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [paymentInfo, navigate]);

  const getStatusIcon = () => {
    switch (paymentInfo?.status) {
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50' }} />;
      case 'cancelled':
        return <CancelIcon sx={{ fontSize: 80, color: '#ff9800' }} />;
      case 'failed':
      case 'error':
        return <ErrorIcon sx={{ fontSize: 80, color: '#f44336' }} />;
      default:
        return <ErrorIcon sx={{ fontSize: 80, color: '#f44336' }} />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentInfo?.status) {
      case 'success':
        return {
          title: 'Thanh toán PayPal thành công!',
          message: 'Đơn hàng của bạn đã được thanh toán thành công qua PayPal. Chúng tôi sẽ xử lý đơn hàng và giao hàng trong thời gian sớm nhất.',
          severity: 'success'
        };
      case 'cancelled':
        return {
          title: 'Thanh toán đã bị hủy',
          message: 'Bạn đã hủy thanh toán PayPal. Đơn hàng chưa được hoàn tất. Bạn có thể thử thanh toán lại hoặc chọn phương thức thanh toán khác.',
          severity: 'warning'
        };
      case 'failed':
        return {
          title: 'Thanh toán thất bại',
          message: 'Thanh toán PayPal không thành công. Vui lòng kiểm tra lại thông tin thanh toán hoặc thử phương thức khác.',
          severity: 'error'
        };
      case 'error':
        return {
          title: 'Có lỗi xảy ra',
          message: paymentInfo?.message || 'Đã xảy ra lỗi trong quá trình xử lý thanh toán. Vui lòng liên hệ bộ phận hỗ trợ.',
          severity: 'error'
        };
      default:
        return {
          title: 'Trạng thái không xác định',
          message: 'Không thể xác định trạng thái thanh toán. Vui lòng liên hệ bộ phận hỗ trợ.',
          severity: 'error'
        };
    }
  };

  const statusInfo = getStatusMessage();

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Đang xử lý kết quả thanh toán...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Status Icon and Title */}
        <Box textAlign="center" sx={{ mb: 3 }}>
          {getStatusIcon()}
          <Typography variant="h4" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
            {statusInfo.title}
          </Typography>
          
          <Alert severity={statusInfo.severity} sx={{ mt: 2, textAlign: 'left' }}>
            {statusInfo.message}
          </Alert>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Payment Details */}
        <Typography variant="h6" gutterBottom>
          Thông tin thanh toán
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {paymentInfo?.orderId && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Mã đơn hàng
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                #{paymentInfo.orderId}
              </Typography>
            </Grid>
          )}
          
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Phương thức thanh toán
            </Typography>
            <Chip 
              label="PayPal" 
              color="primary" 
              variant="outlined" 
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Grid>

          {paymentInfo?.token && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                PayPal Token
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {paymentInfo.token}
              </Typography>
            </Grid>
          )}

          {paymentInfo?.PayerID && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Payer ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {paymentInfo.PayerID}
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            color="primary"
          >
            Về trang chủ
          </Button>
          
          {paymentInfo?.status === 'success' && (
            <Button
              variant="outlined"
              startIcon={<ReceiptIcon />}
              onClick={() => navigate('/user/orders')}
              color="primary"
            >
              Xem đơn hàng
            </Button>
          )}
          
          {(paymentInfo?.status === 'cancelled' || paymentInfo?.status === 'failed') && (
            <Button
              variant="outlined"
              onClick={() => navigate('/cart')}
              color="primary"
            >
              Thử lại
            </Button>
          )}
        </Box>

        {/* Development Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" display="block" gutterBottom>
              Debug Info (Development Only):
            </Typography>
            <Typography variant="caption" component="pre" sx={{ fontSize: '0.7rem' }}>
              {JSON.stringify(paymentInfo, null, 2)}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default PayPalReturnPage; 