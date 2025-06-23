import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon
} from '@mui/icons-material';

const ChatInput = ({ onSendMessage, disabled = false, loading = false }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !loading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        bgcolor: 'background.paper'
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Nhập tin nhắn của bạn..."
        disabled={disabled || loading}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2
          }
        }}
      />
      
      <IconButton
        onClick={handleSubmit}
        disabled={!message.trim() || loading || disabled}
        color="primary"
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': {
            bgcolor: 'primary.dark'
          },
          '&:disabled': {
            bgcolor: 'grey.300',
            color: 'grey.500'
          }
        }}
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <SendIcon />
        )}
      </IconButton>
    </Paper>
  );
};

export default ChatInput; 