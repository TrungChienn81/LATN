const express = require('express');
const router = express.Router();
const {
    createChatSession,
    sendMessage,
    getChatHistory,
    endChatSession,
    getCostStatistics,
    resetCosts
} = require('../controllers/chat.controller');

// Chat routes
router.post('/session', createChatSession);
router.post('/message', sendMessage);
router.get('/history/:sessionId', getChatHistory);
router.put('/session/:sessionId/end', endChatSession);

// Cost monitoring routes
router.get('/cost-stats', getCostStatistics);
router.post('/reset-costs', resetCosts);

module.exports = router; 