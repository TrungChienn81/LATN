import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Divider,
  Alert,
  Fade,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as BotIcon,
  Minimize as MinimizeIcon
} from '@mui/icons-material';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import chatService from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

const ChatWindow = ({ open, onClose, minimized, onMinimize }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && !sessionStarted) {
      initializeChat();
    }
  }, [open, sessionStarted]);

  const initializeChat = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await chatService.createSession(user?._id);
      if (result.success) {
        setMessages([{
          id: Date.now(),
          text: result.welcomeMessage,
          sender: 'bot',
          timestamp: new Date(),
          contextProducts: []
        }]);
        setSessionStarted(true);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Không thể khởi tạo chat. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      contextProducts: []
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const result = await chatService.sendMessage(messageText, user?._id);
      
      if (result.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: result.message,
          sender: 'bot',
          timestamp: new Date(),
          contextProducts: result.contextProducts || []
        };
        
        setMessages(prev => [...prev, botMessage]);
      } else {
        setError(result.message);
        // Add error message
        const errorMessage = {
          id: Date.now() + 1,
          text: 'Xin lỗi, tôi gặp sự cố khi xử lý tin nhắn của bạn. Vui lòng thử lại.',
          sender: 'bot',
          timestamp: new Date(),
          contextProducts: []
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (sessionStarted) {
      await chatService.endSession();
      setSessionStarted(false);
      setMessages([]);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <Fade in={open}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: minimized ? -400 : 20,
          right: 20,
          width: { xs: '90vw', sm: 400 },
          height: minimized ? 60 : 500,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1300,
          transition: 'all 0.3s ease-in-out',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon />
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              AI Assistant
            </Typography>
            <Chip
              label="Online"
              size="small"
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
          </Box>
          
          <Box>
            <IconButton
              size="small"
              onClick={onMinimize}
              sx={{ color: 'white', mr: 0.5 }}
            >
              <MinimizeIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {!minimized && (
          <>
            <Divider />
            
            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                onClose={() => setError(null)}
                sx={{ m: 1 }}
              >
                {error}
              </Alert>
            )}

            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                bgcolor: 'grey.50'
              }}
            >
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message.text}
                  isBot={message.sender === 'bot'}
                  timestamp={message.timestamp}
                  contextProducts={message.contextProducts}
                />
              ))}
              
              {loading && (
                <ChatMessage
                  message="Đang suy nghĩ..."
                  isBot={true}
                  timestamp={new Date()}
                />
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            <Divider />

            {/* Input Area */}
            <Box sx={{ p: 2 }}>
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={!sessionStarted}
                loading={loading}
              />
            </Box>
          </>
        )}
      </Paper>
    </Fade>
  );
};

export default ChatWindow; 