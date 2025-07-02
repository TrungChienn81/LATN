import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  Alert,
  Chip,
  Divider,
  Stack,
  Paper
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

const DemoPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [paymentStatus, setPaymentStatus] = useState('processing'); // processing, success, failed
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    // Lấy thông tin order từ URL params hoặc state
    const urlParams = new URLSearchParams(location.search);
    const amount = urlParams.get('amount') || '10000';
    const orderId = urlParams.get('orderId') || 'DEMO123456';
    const orderInfo = urlParams.get('orderInfo') || 'Demo thanh toán đơn hàng';

    setOrderInfo({
      amount: parseInt(amount),
      orderId,
      orderInfo: decodeURIComponent(orderInfo),
      formattedAmount: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(parseInt(amount))
    });

    // Simulate payment processing
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Random success/failure for demo
          const isSuccess = Math.random() > 0.2; // 80% success rate
          setPaymentStatus(isSuccess ? 'success' : 'failed');
          
          // Auto redirect after 3 seconds
          setTimeout(() => {
            const returnUrl = isSuccess 
              ? '/vnpay-return?vnp_ResponseCode=00&vnp_TransactionStatus=00&vnp_TxnRef=' + orderId
              : '/vnpay-return?vnp_ResponseCode=24&vnp_TransactionStatus=02&vnp_TxnRef=' + orderId;
            navigate(returnUrl);
          }, 3000);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  const handleManualReturn = (success) => {
    const returnUrl = success 
      ? '/vnpay-return?vnp_ResponseCode=00&vnp_TransactionStatus=00&vnp_TxnRef=' + orderInfo?.orderId
      : '/vnpay-return?vnp_ResponseCode=24&vnp_TransactionStatus=02&vnp_TxnRef=' + orderInfo?.orderId;
    navigate(returnUrl);
  };

  if (!orderInfo) {
    return (
      <Container>
        <Box py={4}>
          <Alert severity="error">Không tìm thấy thông tin đơn hàng</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box py={4}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <PaymentIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h4" component="h1" color="primary">
              🏦 Demo Payment Gateway
            </Typography>
          </Box>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            🚀 <strong>Đây là trang demo thanh toán</strong> - Mô phỏng flow VNPay hoàn chỉnh cho mục đích test!
          </Alert>
        </Paper>

        {/* Order Information */}
        <Card elevation={3} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              📋 Thông tin đơn hàng
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Mã đơn hàng:</Typography>
                <Typography variant="h6" color="primary">{orderInfo.orderId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Số tiền:</Typography>
                <Typography variant="h6" color="error">{orderInfo.formattedAmount}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">Nội dung:</Typography>
                <Typography variant="body1">{orderInfo.orderInfo}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card elevation={3}>
          <CardContent>
            {paymentStatus === 'processing' && (
              <>
                <Box textAlign="center" py={3}>
                  <AccessTimeIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>
                    🔄 Đang xử lý thanh toán...
                  </Typography>
                  <Typography variant="body1" color="textSecondary" mb={3}>
                    Vui lòng chờ trong giây lát. Tự động chuyển trang sau:
                  </Typography>
                  <Chip 
                    label={`${countdown} giây`} 
                    color="warning" 
                    size="large"
                    sx={{ fontSize: '1.2rem', py: 2 }}
                  />
                </Box>
              </>
            )}

            {paymentStatus === 'success' && (
              <Box textAlign="center" py={3}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom color="success.main">
                  ✅ Thanh toán thành công!
                </Typography>
                <Typography variant="body1" color="textSecondary" mb={3}>
                  Đơn hàng <strong>{orderInfo.orderId}</strong> đã được thanh toán thành công.
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Tự động chuyển về trang kết quả sau 3 giây...
                </Alert>
              </Box>
            )}

            {paymentStatus === 'failed' && (
              <Box textAlign="center" py={3}>
                <CancelIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom color="error.main">
                  ❌ Thanh toán thất bại!
                </Typography>
                <Typography variant="body1" color="textSecondary" mb={3}>
                  Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
                </Typography>
                <Alert severity="error" sx={{ mb: 2 }}>
                  Tự động chuyển về trang kết quả sau 3 giây...
                </Alert>
              </Box>
            )}

            {/* Manual Controls for Testing */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" textAlign="center" mb={2}>
              🧪 Test Controls (Chỉ dành cho Demo)
            </Typography>
            
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleManualReturn(true)}
                size="large"
              >
                Mô phỏng Thành công
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleManualReturn(false)}
                size="large"
              >
                Mô phỏng Thất bại
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="textSecondary">
            💡 <strong>Ghi chú:</strong> Đây là trang demo mô phỏng hoàn toàn flow thanh toán VNPay.<br/>
            Trong production, đây sẽ là trang thanh toán thật của VNPay.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default DemoPaymentPage; 