// routes/userInteraction.routes.js
const express = require('express');
const router = express.Router();
const {
    logUserBehavior,
    getUserInteractionHistory,
    getUserBehaviorStats,
    generateUserEmbedding
} = require('../controllers/userInteraction.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Public/Semi-public routes
router.post('/user-behaviors', logUserBehavior); // Can be used by guests with session ID

// Private routes (authenticated users)
router.get('/user-behaviors/my-history', protect, getUserInteractionHistory);

// Admin routes
router.get('/user-behaviors/stats', protect, restrictTo('admin'), getUserBehaviorStats);
router.post('/user-behaviors/generate-embedding/:userId', protect, restrictTo('admin'), generateUserEmbedding);

module.exports = router; 