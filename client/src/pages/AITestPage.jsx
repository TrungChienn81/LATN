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
  CircularProgress,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  SmartToy as AIIcon,
  TrendingUp as TrendingIcon,
  Recommend as RecommendIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { 
  logUserBehavior, 
  getPersonalizedRecommendations, 
  getTrendingProducts 
} from '../utils/analytics';
import api from '../services/api';
import ProductCardNew from '../components/product/ProductCardNew';

const AITestPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [behaviorStats, setBehaviorStats] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAIData();
    }
  }, [user]);

  const fetchAIData = async () => {
    setLoading(true);
    try {
      // Fetch personalized recommendations
      const recResponse = await getPersonalizedRecommendations(4);
      if (recResponse.success) {
        setRecommendations(recResponse.data.recommendations || []);
      }

      // Fetch trending products
      const trendResponse = await getTrendingProducts(4);
      if (trendResponse.success) {
        setTrendingProducts(trendResponse.data.trending_products || []);
      }

      // Fetch user behavior stats (if authenticated)
      if (user) {
        try {
          const statsResponse = await api.get('/user-behaviors/my-history?limit=10');
          if (statsResponse.data.success) {
            setUserStats(statsResponse.data);
          }
        } catch (error) {
          console.log('User stats not available:', error);
        }
      }

    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTestBehavior = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Generate some test interactions
      const testActions = [
        { action: 'view', productId: null },
        { action: 'search', productId: null, metadata: { searchQuery: 'laptop gaming' } },
        { action: 'view', productId: null },
        { action: 'add_to_cart', productId: null }
      ];

      // Get some random products first
      const productsResponse = await api.get('/products?limit=5');
      if (productsResponse.data.success && productsResponse.data.data.length > 0) {
        const products = productsResponse.data.data;
        
        for (const testAction of testActions) {
          if (testAction.action !== 'search') {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            testAction.productId = randomProduct._id;
          }
          
          await logUserBehavior(testAction.action, testAction.productId, testAction.metadata);
          // Small delay between actions
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Refresh data
      await fetchAIData();
      
    } catch (error) {
      console.error('Error generating test behavior:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUserEmbedding = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await api.post(`/user-behaviors/generate-embedding/${user._id}`);
      if (response.data.success) {
        alert('User embedding generated successfully!');
        await fetchAIData();
      }
    } catch (error) {
      console.error('Error generating user embedding:', error);
      alert('Error generating user embedding. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🤖 AI System Demo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Trang demo các tính năng AI recommendation system
        </Typography>
      </Box>

      {!user && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Vui lòng đăng nhập để sử dụng đầy đủ tính năng AI personalization
        </Alert>
      )}

      {/* Control Panel */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🎮 Control Panel
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={fetchAIData}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AIIcon />}
          >
            Refresh AI Data
          </Button>
          
          {user && (
            <>
              <Button
                variant="outlined"
                onClick={generateTestBehavior}
                disabled={loading}
                startIcon={<AnalyticsIcon />}
              >
                Generate Test Behavior
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={generateUserEmbedding}
                disabled={loading}
                startIcon={<RecommendIcon />}
              >
                Generate User Embedding
              </Button>
            </>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Personalized Recommendations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Personalized Recommendations
              </Typography>
              
              {recommendations.length > 0 ? (
                <Grid container spacing={2}>
                  {recommendations.map((product) => (
                    <Grid item xs={12} sm={6} key={product._id}>
                      <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Score: {product.recommendation_score || 'N/A'}
                        </Typography>
                        {product.price && (
                          <Typography variant="body2" color="primary">
                            {(product.price * 1000000).toLocaleString('vi-VN')} đ
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  {user ? 'Chưa có recommendations. Hãy tương tác với sản phẩm để tạo dữ liệu.' : 'Cần đăng nhập để xem recommendations'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Trending Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Trending Products
              </Typography>
              
              {trendingProducts.length > 0 ? (
                <Grid container spacing={2}>
                  {trendingProducts.map((product) => (
                    <Grid item xs={12} sm={6} key={product._id}>
                      <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {product.name}
                        </Typography>
                        {product.trending_stats && (
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              size="small" 
                              label={`Score: ${product.trending_stats.trend_score}`}
                              color="primary"
                            />
                            <Chip 
                              size="small" 
                              label={`Users: ${product.trending_stats.unique_users}`}
                              color="secondary"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  Chưa có trending data. Cần có user interactions để tạo trending stats.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* User Behavior History */}
        {user && userStats && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Your Recent Activity
                </Typography>
                
                <List>
                  {userStats.data.slice(0, 5).map((interaction, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              size="small" 
                              label={interaction.eventType}
                              color={
                                interaction.eventType === 'purchase' ? 'success' :
                                interaction.eventType === 'add_to_cart' ? 'warning' :
                                'default'
                              }
                            />
                            {interaction.productId && (
                              <Typography variant="body2">
                                {interaction.productId.name}
                              </Typography>
                            )}
                            {interaction.searchQuery && (
                              <Typography variant="body2" color="text.secondary">
                                Search: "{interaction.searchQuery}"
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={new Date(interaction.timestamp).toLocaleString('vi-VN')}
                      />
                    </ListItem>
                  ))}
                </List>
                
                <Typography variant="caption" color="text.secondary">
                  Total interactions: {userStats.pagination?.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* AI System Info */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          ℹ️ AI System Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2">Recommendation Algorithm:</Typography>
            <Typography variant="body2">Collaborative Filtering + Content-based</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2">User Behavior Tracking:</Typography>
            <Typography variant="body2">View, Click, Add to Cart, Purchase, Search</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2">Trending Analysis:</Typography>
            <Typography variant="body2">7-day weighted scoring system</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AITestPage; 