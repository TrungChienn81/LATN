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
  ListItemIcon,
  Divider,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Chat as ChatIcon,
  Psychology as AIIcon,
  Search as SearchIcon,
  Recommend as RecommendIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import ChatWindow from '../components/Chat/ChatWindow';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ChatTestPage = () => {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [costStats, setCostStats] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Reset costs (for testing)
  const resetCosts = async () => {
    setLoading(true);
    try {
      const response = await api.post('/chat/reset-costs');
      if (response.data.success) {
        await loadCostStats();
        alert('✅ Đã reset bộ đếm chi phí!');
      }
    } catch (error) {
      console.error('Error resetting costs:', error);
      alert('❌ Lỗi reset chi phí!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCostStats();
    
    // Auto refresh cost stats every 30 seconds
    const interval = setInterval(loadCostStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const sampleQuestions = [
    "Tôi cần laptop gaming giá khoảng 20 triệu",
    "Laptop nào tốt cho sinh viên?",
    "So sánh laptop Dell và HP",
    "PC gaming cấu hình cao nhất",
    "Laptop văn phòng pin trâu",
    "Máy tính cho đồ họa 3D"
  ];

  const features = [
    {
      icon: <AIIcon color="primary" />,
      title: "RAG Technology",
      description: "Sử dụng Retrieval-Augmented Generation để tìm kiếm thông tin sản phẩm chính xác"
    },
    {
      icon: <SearchIcon color="primary" />,
      title: "Smart Search",
      description: "Tìm kiếm thông minh dựa trên ngữ cảnh và từ khóa tiếng Việt"
    },
    {
      icon: <RecommendIcon color="primary" />,
      title: "Product Recommendations",
      description: "Đề xuất sản phẩm phù hợp dựa trên nhu cầu và ngân sách"
    },
    {
      icon: <ChatIcon color="primary" />,
      title: "Natural Conversation",
      description: "Trò chuyện tự nhiên bằng tiếng Việt với AI assistant"
    }
  ];

  const handleOpenChat = () => {
    setChatOpen(true);
    setChatMinimized(false);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setChatMinimized(false);
  };

  const getCostColor = () => {
    if (!costStats) return 'success';
    const usedPercentage = (costStats.totalCost / costStats.budget) * 100;
    if (usedPercentage >= 90) return 'error';
    if (usedPercentage >= 70) return 'warning';
    return 'success';
  };

  const getCostProgress = () => {
    if (!costStats) return 0;
    return Math.min((costStats.totalCost / costStats.budget) * 100, 100);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          🤖 AI Chatbot Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Trải nghiệm AI assistant với OpenAI GPT-4o-mini - Tiết kiệm nhất!
        </Typography>
      </Box>

      {/* Cost Monitoring Section */}
      {costStats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: getCostColor() === 'error' ? 'error.light' : 'background.paper' }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon />
                💰 Theo dõi Chi phí OpenAI
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h6">Ngân sách</Typography>
                      <Typography variant="h4">${costStats.budget}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: getCostColor() === 'error' ? 'error.main' : 'success.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h6">Đã dùng</Typography>
                      <Typography variant="h4">${costStats.totalCost.toFixed(4)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h6">Còn lại</Typography>
                      <Typography variant="h4">${costStats.remainingBudget.toFixed(4)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h6">Tokens</Typography>
                      <Typography variant="h4">{costStats.totalTokensUsed}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Tiến trình sử dụng ngân sách ({getCostProgress().toFixed(1)}%)
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getCostProgress()} 
                  color={getCostColor()}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<CheckIcon />}
                  label={`Model: GPT-4o-mini (Rẻ nhất!)`}
                  color="success"
                  variant="outlined"
                />
                <Chip 
                  icon={<WarningIcon />}
                  label={`Chi phí/tin nhắn: ~$0.001-0.005`}
                  color="warning"
                  variant="outlined"
                />
                <Button 
                  size="small" 
                  onClick={resetCosts}
                  disabled={loading}
                  variant="outlined"
                >
                  Reset Chi phí
                </Button>
                <Button 
                  size="small" 
                  onClick={loadCostStats}
                  variant="outlined"
                >
                  Refresh
                </Button>
              </Box>

              {/* Tips */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>💡 Tips tiết kiệm:</Typography>
                <List dense>
                  {costStats.tips.map((tip, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={`• ${tip}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Demo Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🚀 Demo Chatbot
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Nhấn nút bên dưới để mở chat và trải nghiệm AI assistant với OpenAI thật!
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<BotIcon />}
              onClick={handleOpenChat}
              fullWidth
              sx={{ mb: 2 }}
            >
              Mở Real AI Chat Assistant 🔥
            </Button>

            <Alert severity="success">
              ✅ OpenAI GPT-4o-mini đã được kích hoạt! Chi phí siêu thấp chỉ $0.15/1M tokens đầu vào.
            </Alert>
          </Paper>
        </Grid>

        {/* Sample Questions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              💬 Câu hỏi mẫu
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Thử các câu hỏi này để test chatbot:
            </Typography>
            
            <List>
              {sampleQuestions.map((question, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText 
                    primary={`"${question}"`} 
                    sx={{ 
                      '& .MuiListItemText-primary': { 
                        fontStyle: 'italic',
                        fontSize: '0.9rem'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Features */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            ⚡ Tính năng AI
          </Typography>
          <Grid container spacing={2}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {feature.icon}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Chat Window */}
      <ChatWindow
        open={chatOpen}
        onClose={handleCloseChat}
        minimized={chatMinimized}
        onMinimize={() => setChatMinimized(!chatMinimized)}
      />
    </Container>
  );
};

export default ChatTestPage;