// src/routes/order.routes.js
const express = require('express');
const orderController = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all order routes
router.use(protect);

// Customer routes
router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getUserOrders);
router.get('/:id', orderController.getOrder);
router.put('/:id/cancel', orderController.cancelOrder);

// Shop routes
router.get('/shop/orders', orderController.getShopOrders);
router.put('/shop/:id/status', orderController.updateOrderStatus);

module.exports = router;