// src/routes/order.routes.js
const express = require('express');
const { 
    getUserOrders, 
    getOrder, 
    cancelOrder,
    getShopOrders,
    updateShopOrderStatus,
    createOrder,
    createPaymentUrl,
    vnpayReturn,
    momoReturn,
    paypalSuccess,
    paypalCancel,
    deleteOrder,
    deleteMultipleOrders,
    deleteAllOrders,
    updateOrderStatus,
    getAdminOrders
} = require('../controllers/order.controller');
const protect = require('../middleware/protect');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Public routes
router.get('/vnpay_return', vnpayReturn);
router.get('/momo_return', momoReturn);
router.post('/momo_return', momoReturn);

// Protected routes
router.use(protect);

// Customer routes
router.get('/my-orders', getUserOrders);
router.post('/', createOrder);
router.post('/create-payment-url', createPaymentUrl);

// Delete order routes - thứ tự rất quan trọng, route cụ thể phải đứng trước route với tham số
router.delete('/all', deleteAllOrders);
router.delete('/multiple', deleteMultipleOrders);

// Admin routes - đặt trước routes có tham số động
router.get('/admin', authorize('admin'), getAdminOrders);
router.put('/:orderId/status', authorize('admin'), updateOrderStatus);

// Shop routes - đặt trước routes có tham số động
router.get('/shop/orders', authorize('shop'), getShopOrders);
router.put('/:orderId/shop/status', authorize('shop'), updateShopOrderStatus);

// Order specific routes - đặt sau các routes cố định
router.get('/:orderId', getOrder);
router.put('/:orderId/cancel', cancelOrder);
router.delete('/:orderId', deleteOrder);

// Additional payment callback routes
router.get('/payment/callback/vnpay', vnpayReturn);
router.post('/payment/callback/vnpay', vnpayReturn);
router.get('/payment/callback/momo', momoReturn);
router.post('/payment/callback/momo', momoReturn);
router.get('/payment/callback/paypal/success', paypalSuccess);
router.get('/payment/callback/paypal/cancel', paypalCancel);

module.exports = router;