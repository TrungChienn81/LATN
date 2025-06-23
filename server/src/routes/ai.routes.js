const express = require('express');
const router = express.Router();
const {
    getPersonalizedRecommendations,
    getSimilarProducts,
    getTrendingProducts,
    getSearchSuggestions
} = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

// AI Recommendation routes
router.get('/recommendations', protect, getPersonalizedRecommendations);
router.get('/similar-products/:productId', getSimilarProducts);
router.get('/trending-products', getTrendingProducts);
router.get('/search-suggestions', getSearchSuggestions);

module.exports = router; 