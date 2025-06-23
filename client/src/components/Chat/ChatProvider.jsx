import React, { useState } from 'react';
import ChatWindow from './ChatWindow';
import ChatButton from './ChatButton';

const ChatProvider = ({ children }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const handleOpenChat = () => {
    setChatOpen(true);
    setChatMinimized(false);
    setHasNewMessages(false);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    setChatMinimized(false);
  };

  const handleMinimizeChat = () => {
    setChatMinimized(!chatMinimized);
  };

  return (
    <>
      {children}
      
      {/* Chat Button - only show when chat is closed */}
      {!chatOpen && (
        <ChatButton
          onClick={handleOpenChat}
          hasNewMessages={hasNewMessages}
        />
      )}
      
      {/* Chat Window */}
      <ChatWindow
        open={chatOpen}
        onClose={handleCloseChat}
        minimized={chatMinimized}
        onMinimize={handleMinimizeChat}
      />
    </>
  );
};

export default ChatProvider; 