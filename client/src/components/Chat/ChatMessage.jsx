import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Person as UserIcon
} from '@mui/icons-material';

const ChatMessage = ({ message, isBot = false, timestamp, contextProducts = [], costInfo = null }) => {
  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isBot ? 'flex-start' : 'flex-end',
        mb: 2,
        alignItems: 'flex-start'
      }}
    >
      {isBot && (
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 32,
            height: 32,
            mr: 1,
            mt: 0.5
          }}
        >
          <BotIcon fontSize="small" />
        </Avatar>
      )}
      
      <Box sx={{ maxWidth: '70%' }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isBot ? 'grey.100' : 'primary.main',
            color: isBot ? 'text.primary' : 'white',
            borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px'
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message}
          </Typography>
          
          {/* Show context products if available */}
          {isBot && contextProducts && contextProducts.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Sản phẩm liên quan:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {contextProducts.slice(0, 3).map((product, index) => (
                  <Chip
                    key={index}
                    label={`${product.name} - ${product.price?.toLocaleString('vi-VN')}đ`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Show cost info if available */}
          {isBot && costInfo && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`💰 Chi phí: $${costInfo.requestCost?.toFixed(6)} | Còn lại: $${costInfo.remainingBudget?.toFixed(4)}`}
                size="small"
                color={costInfo.remainingBudget > 3 ? 'success' : costInfo.remainingBudget > 1 ? 'warning' : 'error'}
                sx={{ fontSize: '0.6rem' }}
              />
            </Box>
          )}
        </Paper>
        
        {timestamp && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              textAlign: isBot ? 'left' : 'right',
              mt: 0.5,
              ml: isBot ? 1 : 0,
              mr: isBot ? 0 : 1
            }}
          >
            {formatTime(timestamp)}
          </Typography>
        )}
      </Box>
      
      {!isBot && (
        <Avatar
          sx={{
            bgcolor: 'secondary.main',
            width: 32,
            height: 32,
            ml: 1,
            mt: 0.5
          }}
        >
          <UserIcon fontSize="small" />
        </Avatar>
      )}
    </Box>
  );
};

export default ChatMessage; 