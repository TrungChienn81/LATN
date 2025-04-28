// src/routes/order.routes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(protect);

// Create new order (Customers only)
router.post(
    '/', 
    restrictTo('customer'), 
    orderController.createOrder
);

// Get user's order history
router.get(
    '/my', 
    orderController.getMyOrders
);

// Get specific order details
router.get(
    '/:orderId', 
    orderController.getOrderById
);

// Update order status (Admin/Seller only)
router.put(
    '/:orderId/status',
    restrictTo('admin', 'seller'),
    orderController.updateOrderStatus
);

module.exports = router;