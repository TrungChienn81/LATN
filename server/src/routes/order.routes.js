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
    momoReturn
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
router.get('/:orderId', getOrder);
router.put('/:orderId/cancel', cancelOrder);
router.post('/', createOrder);
router.post('/create-payment-url', createPaymentUrl);

// Shop routes
router.get('/shop/orders', authorize('shop'), getShopOrders);
router.put('/:orderId/shop/status', authorize('shop'), updateShopOrderStatus);

// Additional payment callback routes
router.get('/payment/callback/vnpay', vnpayReturn);
router.post('/payment/callback/vnpay', vnpayReturn);
router.get('/payment/callback/momo', momoReturn);
router.post('/payment/callback/momo', momoReturn);

module.exports = router;