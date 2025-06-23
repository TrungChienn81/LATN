// src/routes/order.routes.js
const express = require('express');
const { 
    createOrder, 
    getUserOrders, 
    getOrder, 
    updateOrderStatus, 
    cancelOrder,
    processPayment,
    handlePaymentCallback,
    confirmBankTransferPayment
} = require('../controllers/order.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

// Customer routes
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getUserOrders);
router.get('/:orderId', protect, getOrder);
router.put('/:orderId/cancel', protect, cancelOrder);

// Payment routes
router.post('/:orderId/payment', protect, processPayment);
router.post('/payment/callback/:method', handlePaymentCallback); // Public route for payment gateway callbacks
router.put('/:orderId/confirm-payment', protect, restrictTo('admin'), confirmBankTransferPayment);

// Admin routes
router.put('/:orderId/status', protect, restrictTo('admin'), updateOrderStatus);

module.exports = router;