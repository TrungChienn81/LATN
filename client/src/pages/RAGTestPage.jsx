import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  Divider,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Psychology as AIIcon,
  Storage as DatabaseIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import ChatWindow from '../components/Chat/ChatWindow';
import api from '../services/api';
import { formatPriceToVND } from '../utils/formatters';

const RAGTestPage = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [costStats, setCostStats] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);

  // Use formatPriceToVND from utils
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return formatPriceToVND(price);
  };

  // Extract brand from product name if brand is not populated
  const extractBrandFromName = (productName) => {
    if (!productName) return null;
    
    const nameParts = productName.split(' ');
    const knownBrands = ['MSI', 'Acer', 'ASUS', 'Dell', 'HP', 'Lenovo', 'Apple', 'Samsung', 'LG', 'Gigabyte', 'Intel', 'AMD'];
    
    // Tìm brand trong tên sản phẩm
    for (const part of nameParts) {
      if (knownBrands.some(brand => part.toLowerCase() === brand.toLowerCase())) {
        return part.toUpperCase();
      }
    }
    
    // Fallback: lấy từ đầu tiên có thể là brand
    if (nameParts.length > 0 && nameParts[0].length > 2) {
      return nameParts[0];
    }
    
    return null;
  };

  // Get secondary info for product display
  const getSecondaryInfo = (product) => {
    const price = formatPrice(product.price);
    const brand = product.brand?.name || extractBrandFromName(product.name) || 'Chưa xác định';
    const category = product.category?.name || '';
    
    return category ? `${price} • ${brand} • ${category}` : `${price} • ${brand}`;
  };

  // Load query history from localStorage
  const loadQueryHistory = () => {
    try {
      const saved = localStorage.getItem('rag_query_history');
      if (saved) {
        const history = JSON.parse(saved);
        setQueryHistory(history);
      }
    } catch (error) {
      console.error('Error loading query history:', error);
    }
  };

  // Save query to history
  const saveQueryToHistory = (query) => {
    try {
      const newHistory = [
        { query, timestamp: new Date().toISOString() },
        ...queryHistory.filter(item => item.query !== query) // Remove duplicate
      ].slice(0, 10); // Keep only last 10 queries
      
      setQueryHistory(newHistory);
      localStorage.setItem('rag_query_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving query history:', error);
    }
  };

  // Clear query history
  const clearQueryHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem('rag_query_history');
  };

  // Load products from database
  const loadProducts = async () => {
    try {
      const response = await api.get('/products/rag-test/all');
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Load cost statistics
  const loadCostStats = async () => {
    try {
      const response = await api.get('/chat/cost-stats');
      if (response.data.success) {
        setCostStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading cost stats:', error);
    }
  };

  const OPENAI_API_KEY = "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";
  // Test a specific query
  const runTestQuery = async (query) => {
    setLoading(true);
    setTestQuery(query);
    
    // Save to history
    saveQueryToHistory(query);
    
    try {
      // Create chat session
      const sessionResponse = await api.post('/chat/session', {}, {
        headers: { 'x-openai-api-key': OPENAI_API_KEY }
      });
      if (!sessionResponse.data.success) {
        throw new Error('Failed to create session');
      }

      const sessionId = sessionResponse.data.data.sessionId;

      // Send test message
      const messageResponse = await api.post('/chat/message', {
        sessionId,
        message: query
      }, {
        headers: { 'x-openai-api-key': OPENAI_API_KEY }
      });

      if (messageResponse.data.success) {
        setTestResults({
          query,
          response: messageResponse.data.data.message,
          contextProducts: messageResponse.data.data.context_products || [],
          costInfo: messageResponse.data.data.costInfo || null,
          success: true
        });
      } else {
        setTestResults({
          query,
          error: messageResponse.data.message,
          success: false
        });
      }
    } catch (error) {
      console.error('Error testing query:', error);
      setTestResults({
        query,
        error: error.message,
        success: false
      });
    } finally {
      setLoading(false);
      await loadCostStats(); // Refresh cost stats
    }
  };

  const handleCustomTest = () => {
    if (testQuery.trim()) {
      runTestQuery(testQuery);
    }
  };

  // Clear any invalid auth tokens on page load
  const clearAuthTokens = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    console.log('Auth tokens cleared for RAG testing');
  };

  useEffect(() => {
    clearAuthTokens(); // Clear tokens first
    loadProducts();
    loadCostStats();
    loadQueryHistory();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          🔍 RAG System Test Page
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Test Retrieval-Augmented Generation với Database thật
        </Typography>
      </Box>

      {/* Cost Stats */}
      {costStats && (
        <Alert severity="info" sx={{ mb: 3 }}>
          💰 OpenAI Budget: ${costStats.totalCost.toFixed(4)} / $5.00 đã sử dụng 
          ({((costStats.totalCost / 5) * 100).toFixed(1)}%)
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Database Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DatabaseIcon color="primary" />
                Database Products
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Có {products.length} sản phẩm trong database
              </Typography>
              
              <Box sx={{ 
                maxHeight: showAllProducts ? 400 : 'none', 
                overflowY: showAllProducts ? 'auto' : 'visible',
                border: showAllProducts ? '1px solid #e0e0e0' : 'none',
                borderRadius: showAllProducts ? 1 : 0,
                mt: showAllProducts ? 1 : 0
              }}>
                <List dense>
                  {(showAllProducts ? products : products.slice(0, 5)).map((product, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={product.name}
                        secondary={getSecondaryInfo(product)}
                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                        secondaryTypographyProps={{ fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
              
              {products.length > 5 && (
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                  {!showAllProducts ? (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        ... và {products.length - 5} sản phẩm khác
                      </Typography>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => setShowAllProducts(true)}
                        startIcon={<ExpandMoreIcon />}
                        sx={{ fontSize: '0.7rem' }}
                      >
                        Xem tất cả {products.length} sản phẩm
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => setShowAllProducts(false)}
                      startIcon={<ExpandLessIcon />}
                      sx={{ fontSize: '0.7rem' }}
                    >
                      Thu gọn danh sách
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Test Queries */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon color="primary" />
                Test RAG Queries
              </Typography>
              
              {/* Custom Query */}
              <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nhập câu hỏi test..."
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomTest()}
                />
                <Button 
                  variant="contained" 
                  onClick={handleCustomTest}
                  disabled={loading || !testQuery.trim()}
                >
                  Test
                </Button>
              </Box>

              {/* Query History */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2">
                    Lịch sử câu hỏi đã test:
                  </Typography>
                  {queryHistory.length > 0 && (
                    <Button 
                      size="small" 
                      onClick={clearQueryHistory}
                      sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                    >
                      Xóa lịch sử
                    </Button>
                  )}
                </Box>
                
                {queryHistory.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {queryHistory.map((historyItem, index) => (
                      <Chip
                        key={index}
                        label={historyItem.query}
                        size="small"
                        onClick={() => runTestQuery(historyItem.query)}
                        disabled={loading}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'white'
                          }
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Chưa có câu hỏi nào được test. Hãy nhập câu hỏi ở trên để bắt đầu!
                  </Typography>
                )}
              </Box>

              {/* Test Results */}
              {testResults && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    🎯 Kết quả test:
                  </Typography>
                  
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Query: "{testResults.query}"
                  </Typography>

                  {testResults.success ? (
                    <>
                      <Typography variant="body2" sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1 }}>
                        {testResults.response}
                      </Typography>

                      {testResults.contextProducts.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Sản phẩm liên quan được tìm thấy:
                          </Typography>
                          {testResults.contextProducts.map((product, index) => (
                            <Chip
                              key={index}
                              label={`${product.name} - ${formatPrice(product.price)}`}
                              size="small"
                              sx={{ mr: 0.5, mt: 0.5, fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      )}

                      {testResults.costInfo && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            icon={<CheckIcon />}
                            label={`Chi phí: $${testResults.costInfo.requestCost?.toFixed(6)}`}
                            size="small"
                            color="success"
                          />
                          <Chip
                            label={`Tokens: ${testResults.costInfo.tokensUsed}`}
                            size="small"
                            color="info"
                          />
                          <Chip
                            label={`Còn lại: $${testResults.costInfo.remainingBudget?.toFixed(4)}`}
                            size="small"
                            color={testResults.costInfo.remainingBudget > 3 ? 'success' : 'warning'}
                          />
                        </Box>
                      )}
                    </>
                  ) : (
                    <Alert severity="error">
                      Lỗi: {testResults.error}
                    </Alert>
                  )}
                </Paper>
              )}

              {loading && (
                <Alert severity="info">
                  🔄 Đang test query với OpenAI API...
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Live Chat Test */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AIIcon color="primary" />
                Live Chat Test
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Mở chat window để test trực tiếp với UI hoàn chỉnh
              </Typography>

              <Button
                variant="contained"
                size="large"
                onClick={() => setChatOpen(true)}
                startIcon={<AIIcon />}
              >
                Mở Live Chat Test
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chat Window */}
      <ChatWindow
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        minimized={chatMinimized}
        onMinimize={() => setChatMinimized(!chatMinimized)}
      />
    </Container>
  );
};

export default RAGTestPage; 