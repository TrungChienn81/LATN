const express = require('express');
const router = express.Router();
const vnpayController = require('../controllers/vnpay.controller');
const { asyncHandler } = require('../helpers/asyncHandler');
const { authentication } = require('../auth/authUtils');

// Các route không cần xác thực
router.get('/vnpay_return', asyncHandler(vnpayController.vnpayReturn));

// Các route cần xác thực
router.use(authentication);
router.post('/create_payment_url', asyncHandler(vnpayController.createPaymentUrl));
router.post('/create_payment', asyncHandler(vnpayController.createPayment));

module.exports = router;
