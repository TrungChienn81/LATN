import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Check if this is a VNPay related error that should be suppressed
    const isVNPayError = error.message && (
      error.message.includes('timer is not defined') ||
      error.message.includes('updateTime') ||
      error.message.includes('Content-Security-Policy') ||
      error.message.includes('runtime.lastError')
    );

    if (isVNPayError) {
      console.log('✅ Suppressed VNPay error in ErrorBoundary:', error.message);
      // Reset error state for VNPay errors
      this.setState({ hasError: false, error: null, errorInfo: null });
      return;
    }

    // Log other errors normally
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 600,
              bgcolor: 'error.light',
              color: 'error.contrastText'
            }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Oops! Có lỗi xảy ra
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Ứng dụng gặp lỗi không mong muốn. Vui lòng thử lại.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </Button>
            
            {this.props.showDetails && this.state.error && (
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <strong>Error:</strong> {this.state.error.toString()}
                  <br />
                  <strong>Stack:</strong> {this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 