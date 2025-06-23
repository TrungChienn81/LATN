const express = require('express');
const router = express.Router();

const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  voteReview,
  getUserReviews,
  getShopReviews,
  replyToReview
} = require('../controllers/review.controller');

const { protect: auth, restrictTo } = require('../middleware/auth.middleware');

// Public routes (no auth required)
router.get('/product/:productId', getProductReviews); // Get reviews for a product

// User routes (require authentication)
router.use(auth); // All routes below require authentication

router.post('/', createReview); // Create a new review
router.get('/user', getUserReviews); // Get user's reviews
router.put('/:reviewId', updateReview); // Update user's review
router.delete('/:reviewId', deleteReview); // Delete user's review
router.post('/:reviewId/vote', voteReview); // Vote helpful/unhelpful

// Shop owner routes
router.get('/shop', getShopReviews); // Get shop's reviews
router.post('/:reviewId/reply', replyToReview); // Reply to a review

module.exports = router; 