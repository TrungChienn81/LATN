import React, { useState } from 'react';
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
  Divider
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Chat as ChatIcon,
  Psychology as AIIcon,
  Search as SearchIcon,
  Recommend as RecommendIcon
} from '@mui/icons-material';
import ChatWindow from '../components/Chat/ChatWindow';
import { useAuth } from '../contexts/AuthContext';

const ChatTestPage = () => {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);

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

  const handleMinimizeChat = () => {
    setChatMinimized(!chatMinimized);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          🤖 AI Chatbot RAG System
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Hệ thống chatbot AI với công nghệ RAG cho tư vấn laptop và PC
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Powered by LangChain + OpenAI GPT-3.5 + Product Knowledge Base
        </Typography>
      </Box>

      {!user && (
        <Alert severity="info" sx={{ mb: 3 }}>
          💡 Đăng nhập để trải nghiệm tính năng cá nhân hóa tốt hơn
        </Alert>
      )}

      {/* Features Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Demo Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🚀 Demo Chatbot
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Nhấn nút bên dưới để mở chat và trải nghiệm AI assistant
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<BotIcon />}
              onClick={handleOpenChat}
              fullWidth
              sx={{ mb: 2 }}
            >
              Mở AI Chat Assistant
            </Button>

            <Alert severity="success">
              ✅ Chat system đã sẵn sàng! Hãy thử hỏi về laptop hoặc PC bạn cần.
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
              Thử hỏi những câu hỏi này để test khả năng của AI:
            </Typography>
            
            <List>
              {sampleQuestions.map((question, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <ChatIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={question}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  {index < sampleQuestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Technical Info */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          🔧 Thông tin kỹ thuật
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="primary">
              Backend
            </Typography>
            <Typography variant="body2">
              Node.js + Express<br/>
              LangChain Framework<br/>
              OpenAI GPT-3.5 Turbo
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="primary">
              Database
            </Typography>
            <Typography variant="body2">
              MongoDB<br/>
              Product Knowledge Base<br/>
              Chat Session Storage
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="primary">
              Frontend
            </Typography>
            <Typography variant="body2">
              React.js<br/>
              Material-UI<br/>
              Real-time Chat UI
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="primary">
              Features
            </Typography>
            <Typography variant="body2">
              RAG Pipeline<br/>
              Vietnamese Support<br/>
              Product Recommendations
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Chat Window */}
      <ChatWindow
        open={chatOpen}
        onClose={handleCloseChat}
        minimized={chatMinimized}
        onMinimize={handleMinimizeChat}
      />
    </Container>
  );
};

export default ChatTestPage;