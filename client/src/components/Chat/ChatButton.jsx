import React from 'react';
import {
  Fab,
  Badge,
  Zoom
} from '@mui/material';
import {
  SmartToy as ChatIcon
} from '@mui/icons-material';

const ChatButton = ({ onClick, hasNewMessages = false }) => {
  return (
    <Zoom in={true}>
      <Fab
        color="primary"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1200,
          '&:hover': {
            transform: 'scale(1.1)',
            transition: 'transform 0.2s ease-in-out'
          }
        }}
      >
        <Badge
          color="error"
          variant="dot"
          invisible={!hasNewMessages}
        >
          <ChatIcon />
        </Badge>
      </Fab>
    </Zoom>
  );
};

export default ChatButton; 