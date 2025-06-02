// src/routes/cart.routes.js
const express = require('express');
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all cart routes
router.use(protect);

// Cart routes
router.route('/')
  .get(cartController.getCart)
  .delete(cartController.clearCart);

router.post('/add', cartController.addToCart);
router.put('/update', cartController.updateCartItem);
router.delete('/remove/:productId', cartController.removeFromCart);
router.get('/count', cartController.getCartCount);

module.exports = router;