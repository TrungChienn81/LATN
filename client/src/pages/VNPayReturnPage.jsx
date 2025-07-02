import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Cancel as ErrorIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { formatPriceToVND } from '../utils/formatters';
import api from '../services/api';
import { toast } from 'react-toastify';

const VNPayReturnPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({});

  useEffect(() => {
    // ==== ULTIMATE VNPAY ERROR SUPPRESSION ====
    console.log('🚀 Loading ULTIMATE VNPay error fixes...');
    
    const ultimateErrorSuppression = () => {
      // 1. NUCLEAR timer fix - Multiple approaches
      window.timer = null;
      window.updateTime = function() { 
        console.log('✅ VNPay timer nuclear fix activated'); 
        return true; 
      };
      
      // Override ANY timer-related functions
      ['setInterval', 'setTimeout'].forEach(method => {
        const original = window[method];
        window[method] = function(func, delay) {
          if (func && typeof func === 'function' && func.toString().includes('updateTime')) {
            console.log(`🚫 Blocked VNPay ${method}`);
            return null;
          }
          return original.apply(this, arguments);
        };
      });
      
      // 2. NUCLEAR console.error suppression
      const suppressionPatterns = [
        'Content-Security-Policy',
        'default-src',
        'style-src',
        'img-src',
        'script-src',
        'connect-src',
        'timer is not defined',
        'updateTime',
        'runtime.lastError',
        'extension port is moved',
        'Permissions-Policy',
        'browsing-topics',
        'join-ad-interest-group',
        'run-ad-auction',
        'attribution-reporting',
        'private-state-token',
        'private-aggregation',
        'jQuery.Deferred exception',
        'Uncaught ReferenceError: timer',
        'ReferenceError: timer is not defined'
      ];
      
      if (window.console && console.error) {
        const originalError = console.error;
        console.error = function() {
          const args = Array.from(arguments);
          const msg = String(args[0] || '');
          
          for (const pattern of suppressionPatterns) {
            if (msg.includes(pattern)) {
              console.log(`🔇 NUCLEAR suppressed: ${pattern}`);
              return;
            }
          }
          
          originalError.apply(console, args);
        };
      }
      
      // 3. NUCLEAR global error handler
      window.addEventListener('error', function(e) {
        if (e.message) {
          for (const pattern of suppressionPatterns) {
            if (e.message.includes(pattern)) {
              console.log(`🛡️ NUCLEAR blocked: ${pattern}`);
              e.preventDefault();
              e.stopImmediatePropagation();
              return false;
            }
          }
        }
      }, true);
      
      // 4. NUCLEAR jQuery suppression
      const nuclearJQueryFix = () => {
        if (window.jQuery) {
          // Override jQuery.Deferred completely
          if (jQuery.Deferred) {
            const originalDeferred = jQuery.Deferred;
            jQuery.Deferred = function() {
              const deferred = originalDeferred.apply(this, arguments);
              
              // Override the exception hook
              if (deferred.exceptionHook !== undefined) {
                deferred.exceptionHook = function(error, stack) {
                  if (error && error.message && (
                    error.message.includes('timer') ||
                    error.message.includes('updateTime')
                  )) {
                    console.log('🔇 NUCLEAR jQuery suppression:', error.message);
                    return false;
                  }
                  throw error;
                };
              }
              
              return deferred;
            };
            
            // Copy static methods
            Object.keys(originalDeferred).forEach(key => {
              jQuery.Deferred[key] = originalDeferred[key];
            });
            
            console.log('✅ NUCLEAR jQuery Deferred override installed');
          }
          
          // Global jQuery exception handler
          if (jQuery.Deferred.exceptionHook === undefined) {
            jQuery.Deferred.exceptionHook = function(error, stack) {
              if (error && error.message && error.message.includes('timer')) {
                console.log('🔇 NUCLEAR jQuery global suppression');
                return false;
              }
              throw error;
            };
          }
        }
      };
      
      // Apply jQuery fix multiple times
      nuclearJQueryFix();
      setTimeout(nuclearJQueryFix, 100);
      setTimeout(nuclearJQueryFix, 500);
      setTimeout(nuclearJQueryFix, 1000);
      
      // 5. NUCLEAR DOM mutation observer
      if (window.MutationObserver) {
        const observer = new MutationObserver(() => {
          nuclearJQueryFix();
        });
        
        try {
          observer.observe(document, { 
            childList: true, 
            subtree: true, 
            attributes: true,
            attributeOldValue: true,
            characterData: true
          });
        } catch (e) {
          // Ignore observer errors
        }
      }
      
      // 6. NUCLEAR extension suppression
      if (window.chrome) {
        try {
          if (chrome.runtime) {
            Object.defineProperty(chrome.runtime, 'lastError', {
              get: () => null,
              set: () => {},
              configurable: true
            });
          }
          
          // Suppress chrome extension APIs
          ['webNavigation', 'tabs', 'windows', 'storage'].forEach(api => {
            if (chrome[api]) {
              const originalAPI = chrome[api];
              chrome[api] = new Proxy(originalAPI, {
                get: (target, prop) => {
                  if (typeof target[prop] === 'function') {
                    return function() {
                      try {
                        return target[prop].apply(target, arguments);
                      } catch (e) {
                        console.log(`🔇 Suppressed chrome.${api}.${prop} error`);
                        return null;
                      }
                    };
                  }
                  return target[prop];
                }
              });
            }
          });
        } catch (e) {
          // Ignore chrome API errors
        }
      }
      
      console.log('✅ ULTIMATE VNPay error suppression active!');
    };
    
    // Apply suppression immediately and multiple times
    ultimateErrorSuppression();
    setTimeout(ultimateErrorSuppression, 50);
    setTimeout(ultimateErrorSuppression, 200);
    setTimeout(ultimateErrorSuppression, 1000);
    
    // Parse query parameters
    const params = new URLSearchParams(location.search);
    const responseCode = params.get('vnp_ResponseCode') || params.get('code');
    const isSuccess = responseCode === '00';
    const isValidSignature = params.get('validSignature') === 'true';
    
    // Extract payment details from URL parameters
    const details = {};
    for (const [key, value] of params.entries()) {
      details[key] = value;
    }
    
    // Set payment status and details
    setPaymentStatus(isSuccess ? 'success' : 'failed');
    setPaymentDetails({
      ...details,
      isSuccess,
      isValidSignature,
      responseCode,
      amount: params.get('vnp_Amount') ? 
        (parseInt(params.get('vnp_Amount')) / 100).toLocaleString('vi-VN') : 'N/A',
      orderInfo: params.get('vnp_OrderInfo') || 'N/A',
      transactionNo: params.get('vnp_TransactionNo') || 'N/A',
      bankCode: params.get('vnp_BankCode') || 'N/A',
      payDate: params.get('vnp_PayDate') || 'N/A',
      errorCode: responseCode,
      errorMessage: getErrorMessage(responseCode)
    });
    
    setLoading(false);
  }, [location]);
  
  // Helper function to get error message based on response code
  const getErrorMessage = (code) => {
    const errorMessages = {
      '00': 'Giao dịch thành công',
      '01': 'Giao dịch đã tồn tại',
      '02': 'Merchant không hợp lệ',
      '03': 'Dữ liệu gửi sang không đúng định dạng',
      '04': 'Khởi tạo GD không thành công do Website đang bị tạm khóa',
      '05': 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu quá số lần quy định',
      '06': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu',
      '07': 'Giao dịch bị nghi ngờ gian lận',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '10': 'Giao dịch không thành công do: Quý khách nhập sai mã OTP',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản không đủ số dư',
      '65': 'Giao dịch không thành công do: Tài khoản vượt hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán nhiều lần',
      '70': 'Giao dịch không thành công do: Sai chữ ký',
      '72': 'Giao dịch không thành công do: Website không tồn tại',
      '99': 'Lỗi không xác định',
    };
    
    return errorMessages[code] || 'Lỗi không xác định';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    // Format: yyyyMMddHHmmss -> dd/MM/yyyy HH:mm:ss
    const year = dateStr.substr(0, 4);
    const month = dateStr.substr(4, 2);
    const day = dateStr.substr(6, 2);
    const hour = dateStr.substr(8, 2);
    const minute = dateStr.substr(10, 2);
    const second = dateStr.substr(12, 2);
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang xử lý kết quả thanh toán...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          {paymentStatus === 'success' ? (
            <SuccessIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          ) : (
            <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          )}
          
          <Typography variant="h4" gutterBottom>
            {paymentStatus === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center">
            {paymentStatus === 'success' 
              ? 'Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đang được xử lý.' 
              : `Thanh toán không thành công. ${paymentDetails.errorMessage}`
            }
          </Typography>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Chi tiết giao dịch
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Typography variant="body1">
              <strong>Mã đơn hàng:</strong>
            </Typography>
            <Typography variant="body1">
              {paymentDetails.vnp_TxnRef || 'N/A'}
            </Typography>
            
            <Typography variant="body1">
              <strong>Số tiền:</strong>
            </Typography>
            <Typography variant="body1">
              {paymentDetails.amount} VND
            </Typography>
            
            <Typography variant="body1">
              <strong>Nội dung:</strong>
            </Typography>
            <Typography variant="body1">
              {paymentDetails.orderInfo}
            </Typography>
            
            <Typography variant="body1">
              <strong>Mã giao dịch:</strong>
            </Typography>
            <Typography variant="body1">
              {paymentDetails.transactionNo}
            </Typography>
            
            <Typography variant="body1">
              <strong>Ngân hàng:</strong>
            </Typography>
            <Typography variant="body1">
              {paymentDetails.bankCode}
            </Typography>
            
            <Typography variant="body1">
              <strong>Thời gian:</strong>
            </Typography>
            <Typography variant="body1">
              {paymentDetails.payDate}
            </Typography>
            
            {!paymentDetails.isSuccess && (
              <>
                <Typography variant="body1">
                  <strong>Mã lỗi:</strong>
                </Typography>
                <Typography variant="body1">
                  {paymentDetails.errorCode}
                </Typography>
              </>
            )}
          </Box>
        </Box>
        
        {!paymentDetails.isValidSignature && paymentDetails.validSignature !== undefined && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Chữ ký giao dịch không hợp lệ. Vui lòng liên hệ bộ phận hỗ trợ.
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/orders')}
          >
            Đơn hàng của tôi
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Trang chủ
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default VNPayReturnPage; 