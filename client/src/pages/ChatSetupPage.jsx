import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip
} from '@mui/material';
import {
  Settings as SetupIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  Code as CodeIcon
} from '@mui/icons-material';

const ChatSetupPage = () => {
  const setupSteps = [
    {
      title: "1. Đăng ký OpenAI API",
      description: "Tạo tài khoản tại platform.openai.com",
      status: "required",
      details: [
        "Truy cập https://platform.openai.com/",
        "Đăng ký tài khoản mới hoặc đăng nhập",
        "Xác thực số điện thoại",
        "Nạp credit tối thiểu $5"
      ]
    },
    {
      title: "2. Tạo API Key",
      description: "Tạo API key trong phần API Keys",
      status: "required",
      details: [
        "Vào mục 'API Keys' trong dashboard",
        "Click 'Create new secret key'",
        "Copy API key (chỉ hiển thị 1 lần)",
        "Lưu trữ an toàn"
      ]
    },
    {
      title: "3. Cấu hình Server",
      description: "Thêm API key vào file .env",
      status: "required",
      details: [
        "Tạo file .env trong thư mục server/",
        "Thêm dòng: OPENAI_API_KEY=your-api-key-here",
        "Restart server",
        "Kiểm tra logs không có lỗi"
      ]
    },
    {
      title: "4. Kích hoạt Real AI",
      description: "Chuyển từ Mock AI sang OpenAI",
      status: "optional",
      details: [
        "Mở file server/src/app.js",
        "Comment dòng mockChatRoutes",
        "Uncomment dòng chatRoutes",
        "Restart server"
      ]
    }
  ];

  const costInfo = [
    {
      model: "GPT-3.5 Turbo",
      inputCost: "$0.0015 / 1K tokens",
      outputCost: "$0.002 / 1K tokens",
      recommended: true
    },
    {
      model: "GPT-4",
      inputCost: "$0.03 / 1K tokens", 
      outputCost: "$0.06 / 1K tokens",
      recommended: false
    }
  ];

  const alternatives = [
    {
      name: "Mock AI (Hiện tại)",
      cost: "Miễn phí",
      pros: ["Không cần API key", "Demo được ngay", "Phản hồi nhanh"],
      cons: ["Không thông minh", "Câu trả lời cố định", "Không học được"]
    },
    {
      name: "OpenAI GPT-3.5",
      cost: "~$5-20/tháng",
      pros: ["Thông minh cao", "Hiểu ngữ cảnh", "Phản hồi tự nhiên"],
      cons: ["Cần trả phí", "Cần internet", "Có thể chậm"]
    },
    {
      name: "Local LLM",
      cost: "Miễn phí",
      pros: ["Không cần internet", "Bảo mật cao", "Không giới hạn"],
      cons: ["Cần GPU mạnh", "Setup phức tạp", "Hiệu suất thấp hơn"]
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          ⚙️ Cấu hình AI Chatbot
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Hướng dẫn setup OpenAI API cho chatbot thông minh
        </Typography>
      </Box>

      {/* Current Status */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🤖 Trạng thái hiện tại: Mock AI System
        </Typography>
        <Typography variant="body2">
          Chatbot đang sử dụng hệ thống Mock AI với câu trả lời được lập trình sẵn. 
          Để có trải nghiệm AI thông minh, bạn cần cấu hình OpenAI API.
        </Typography>
      </Alert>

      {/* Setup Steps */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          📋 Các bước cấu hình
        </Typography>
        
        <Grid container spacing={2}>
          {setupSteps.map((step, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SetupIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      {step.title}
                    </Typography>
                    <Chip
                      label={step.status === 'required' ? 'Bắt buộc' : 'Tùy chọn'}
                      color={step.status === 'required' ? 'error' : 'warning'}
                      size="small"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                  
                  <List dense>
                    {step.details.map((detail, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={detail}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Cost Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          💰 Chi phí sử dụng OpenAI
        </Typography>
        
        <Grid container spacing={2}>
          {costInfo.map((info, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ 
                height: '100%',
                border: info.recommended ? '2px solid' : 'none',
                borderColor: info.recommended ? 'success.main' : 'transparent'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {info.model}
                    </Typography>
                    {info.recommended && (
                      <Chip
                        label="Khuyến nghị"
                        color="success"
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Input:</strong> {info.inputCost}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Output:</strong> {info.outputCost}
                  </Typography>
                  
                  <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                    Ước tính: ~100-500 tin nhắn/ngày ≈ $2-10/tháng
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Alternatives Comparison */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          🔄 So sánh các lựa chọn
        </Typography>
        
        <Grid container spacing={2}>
          {alternatives.map((alt, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {alt.name}
                  </Typography>
                  
                  <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                    {alt.cost}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    ✅ Ưu điểm:
                  </Typography>
                  <List dense>
                    {alt.pros.map((pro, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <ListItemText 
                          primary={`• ${pro}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Typography variant="subtitle2" color="error.main" gutterBottom sx={{ mt: 1 }}>
                    ❌ Nhược điểm:
                  </Typography>
                  <List dense>
                    {alt.cons.map((con, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <ListItemText 
                          primary={`• ${con}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          🚀 Hành động nhanh
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<LaunchIcon />}
              href="https://platform.openai.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Đăng ký OpenAI
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CodeIcon />}
              href="/chat-test"
            >
              Test Mock AI
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<InfoIcon />}
              href="/ai-test"
            >
              AI Recommendations
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<WarningIcon />}
              disabled
            >
              Real AI (Cần setup)
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ChatSetupPage; 