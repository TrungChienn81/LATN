const express = require('express');
const router = express.Router();
const {
    createChatSession,
    sendMessage,
    getChatHistory,
    endChatSession
} = require('../controllers/mockAI.controller');

// Mock Chat routes
router.post('/session', createChatSession);
router.post('/message', sendMessage);
router.get('/history/:sessionId', getChatHistory);
router.put('/session/:sessionId/end', endChatSession);

module.exports = router; 