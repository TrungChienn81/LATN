// src/controllers/order.controller.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Shop = require('../models/Shop');
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');

// Removed unused generateOrderCode function - using orderNumber from model instead

// @desc    Tạo đơn hàng mới từ giỏ hàng
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = catchAsync(async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Lấy thông tin từ request body
        const { customerInfo, shippingAddress, paymentMethod, notes, needInvoice, items } = req.body;

        console.log('=== DEBUG REQUEST ===');
        console.log('Items received:', items?.length);
        console.log('First item:', items?.[0]);
        console.log('====================');

        if (!shippingAddress || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Thông tin đặt hàng không đầy đủ' });
        }

        // 2. Validate sản phẩm và tính toán (simplified)
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            
            console.log('=== DEBUG PRODUCT ===');
            console.log('Product ID:', item.product);
            console.log('Product found:', !!product);
            console.log('Product status:', product?.status);
            console.log('Product name:', product?.name);
            console.log('===================');

            if (!product) {
                return res.status(400).json({ success: false, message: `Sản phẩm "${item.productName}" không tồn tại.` });
            }

            // Tạo item cho đơn hàng theo Order model schema
            orderItems.push({
                product: product._id,
                productName: product.name,
                productImage: item.productImage || product.images[0] || null,
                shop: item.shop,
                shopName: item.shopName,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.totalPrice
            });

            totalAmount += item.totalPrice;
        }

        // 3. Group items by shop
        const shopGroups = {};
        orderItems.forEach(item => {
            if (!shopGroups[item.shop]) {
                shopGroups[item.shop] = {
                    shop: item.shop,
                    items: [],
                    subtotal: 0
                };
            }
            shopGroups[item.shop].items.push(item.product);
            shopGroups[item.shop].subtotal += item.totalPrice;
        });

        // 4. Tạo đơn hàng mới theo Order model schema
        const orderData = {
            orderNumber: `ORD${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            customer: userId,
            customerInfo: {
                name: customerInfo.name,
                email: req.user.email,
                phone: customerInfo.phone
            },
            items: orderItems,
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethod,
            subtotal: totalAmount,
            shippingFee: 0,
            totalAmount: totalAmount,
            notes: notes,
            shops: Object.values(shopGroups)
        };
        
        const newOrder = await Order.create(orderData);
        console.log(`Order ${newOrder.orderNumber} created successfully.`);

        // 5. Clear cart (simplified)
        await Cart.deleteOne({ userId: userId });
        console.log(`Cart cleared for user ${userId}.`);

        res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công!',
            data: newOrder
        });

    } catch (error) {
        console.error('!!! Error creating order:', error);
        res.status(500).json({ success: false, message: 'Lỗi Server khi tạo đơn hàng: ' + error.message });
    }
});

// @desc    Lấy danh sách đơn hàng của người dùng
// @route   GET /api/orders/my-orders
// @access  Private (Customer)
exports.getUserOrders = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer: req.user._id })
        .populate('items.product', 'name images')
        .populate('items.shop', 'shopName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Order.countDocuments({ customer: req.user._id });

    res.status(200).json({
        success: true,
        data: orders,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Lấy chi tiết đơn hàng theo ID
// @route   GET /api/orders/:orderId
// @access  Private
exports.getOrder = catchAsync(async (req, res) => {
    const order = await Order.findOne({
        _id: req.params.id,
        customer: req.user._id
    })
        .populate('customer', 'firstName lastName email phoneNumber')
        .populate('items.product', 'name images')
        .populate('items.shop', 'shopName')
        .populate('shops.shop', 'shopName');

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy đơn hàng'
        });
    }

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc    Hủy đơn hàng
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = catchAsync(async (req, res) => {
    const { cancelReason } = req.body;

    const order = await Order.findOne({
        _id: req.params.id,
        customer: req.user._id
    });

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy đơn hàng'
        });
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = cancelReason;
    order.cancelledAt = new Date();

    // Restore product stock
    for (let item of order.items) {
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stockQuantity: item.quantity } }
        );
    }

    await order.save();

    res.status(200).json({
        success: true,
        message: 'Đã hủy đơn hàng thành công',
        data: order
    });
});

// @desc    Lấy đơn hàng của shop
// @route   GET /api/orders/shop/orders
// @access  Private (Shop)
exports.getShopOrders = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Find shop by owner
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy cửa hàng'
        });
    }

    let query = { 'shops.shop': shop._id };
    if (status) {
        query['shops.status'] = status;
    }

    const orders = await Order.find(query)
        .populate('customer', 'firstName lastName email phoneNumber')
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Order.countDocuments(query);

    res.status(200).json({
        success: true,
        data: orders,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Cập nhật trạng thái đơn hàng của shop
// @route   PUT /api/orders/shop/:id/status
// @access  Private (Shop)
exports.updateOrderStatus = catchAsync(async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    // Find shop by owner
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy cửa hàng'
        });
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Không tìm thấy đơn hàng'
        });
    }

    // Check if shop has items in this order
    const shopOrder = order.shops.find(s => s.shop.toString() === shop._id.toString());
    if (!shopOrder) {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền cập nhật đơn hàng này'
        });
    }

    await order.updateStatus(status, shop._id);

    res.status(200).json({
        success: true,
        message: 'Đã cập nhật trạng thái đơn hàng',
        data: order
    });
});

// @desc    Xử lý thanh toán đơn hàng
// @route   POST /api/orders/:orderId/payment
// @access  Private (Customer)
exports.processPayment = catchAsync(async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.orderId;
        const { paymentMethod } = req.body;

        // Validate payment method
        const validMethods = ['momo', 'vnpay', 'bank_transfer', 'zalopay'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: 'Phương thức thanh toán không hợp lệ'
            });
        }

        // Find order and verify ownership
        const order = await Order.findOne({
            _id: orderId,
            customer: userId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Check if order can be paid
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng đã được thanh toán'
            });
        }

        if (order.orderStatus === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Không thể thanh toán đơn hàng đã bị hủy'
            });
        }

        let paymentResult = {};

        switch (paymentMethod) {
            case 'momo':
                paymentResult = await processMoMoPayment(order);
                break;
            case 'vnpay':
                paymentResult = await processVNPayPayment(order);
                break;
            case 'bank_transfer':
                paymentResult = await processBankTransferPayment(order);
                break;
            case 'zalopay':
                paymentResult = await processZaloPayPayment(order);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Phương thức thanh toán chưa được hỗ trợ'
                });
        }

        // Update order payment method
        order.paymentMethod = paymentMethod;
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Khởi tạo thanh toán thành công',
            data: paymentResult
        });

    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xử lý thanh toán: ' + error.message
        });
    }
});

// Helper functions for payment processing
const processMoMoPayment = async (order) => {
    // TODO: Implement real MoMo API integration
    // For now, return mock payment URL
    const paymentUrl = `https://test-payment.momo.vn/v2/gateway/api/create?orderId=${order.orderNumber}&amount=${order.totalAmount * 1000000}&orderInfo=Thanh toán đơn hàng ${order.orderNumber}`;
    
    return {
        paymentUrl,
        paymentMethod: 'momo',
        orderId: order._id,
        amount: order.totalAmount * 1000000
    };
};

const processVNPayPayment = async (order) => {
    // TODO: Implement real VNPay API integration
    // For now, return mock payment URL
    const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?orderId=${order.orderNumber}&amount=${order.totalAmount * 100}&orderInfo=Thanh toán đơn hàng ${order.orderNumber}`;
    
    return {
        paymentUrl,
        paymentMethod: 'vnpay',
        orderId: order._id,
        amount: order.totalAmount * 1000000
    };
};

const processBankTransferPayment = async (order) => {
    // For bank transfer, just provide banking details
    return {
        paymentMethod: 'bank_transfer',
        orderId: order._id,
        amount: order.totalAmount * 1000000,
        bankingDetails: {
            bankName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)',
            accountNumber: '1234567890',
            accountName: 'CONG TY TNHH LATN SHOP',
            transferContent: `Thanh toan don hang ${order.orderNumber}`,
            note: 'Vui lòng chuyển khoản đúng nội dung để được xử lý nhanh chóng'
        }
    };
};

const processZaloPayPayment = async (order) => {
    // TODO: Implement real ZaloPay API integration
    const paymentUrl = `https://sb-openapi.zalopay.vn/v2/create?orderId=${order.orderNumber}&amount=${order.totalAmount * 1000000}`;
    
    return {
        paymentUrl,
        paymentMethod: 'zalopay',
        orderId: order._id,
        amount: order.totalAmount * 1000000
    };
};

// @desc    Xử lý callback từ payment gateway
// @route   POST /api/orders/payment/callback/:method
// @access  Public (Payment Gateway)
exports.handlePaymentCallback = catchAsync(async (req, res) => {
    try {
        const { method } = req.params;
        const callbackData = req.body;

        console.log(`Payment callback received for ${method}:`, callbackData);

        let orderId;
        let paymentStatus = 'failed';

        switch (method) {
            case 'momo':
                orderId = callbackData.orderId;
                paymentStatus = callbackData.resultCode === 0 ? 'paid' : 'failed';
                break;
            case 'vnpay':
                orderId = callbackData.vnp_TxnRef;
                paymentStatus = callbackData.vnp_ResponseCode === '00' ? 'paid' : 'failed';
                break;
            case 'zalopay':
                orderId = callbackData.app_trans_id;
                paymentStatus = callbackData.return_code === 1 ? 'paid' : 'failed';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Unsupported payment method'
                });
        }

        // Find order by orderNumber
        const order = await Order.findOne({ orderNumber: orderId });
        
        if (order) {
            order.paymentStatus = paymentStatus;
            if (paymentStatus === 'paid') {
                order.orderStatus = 'confirmed'; // Auto confirm when paid
            }
            await order.save();

            console.log(`Order ${orderId} payment status updated to ${paymentStatus}`);
        }

        res.status(200).json({
            success: true,
            message: 'Payment callback processed'
        });

    } catch (error) {
        console.error('Error handling payment callback:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment callback'
        });
    }
});

// @desc    Xác nhận thanh toán chuyển khoản
// @route   PUT /api/orders/:orderId/confirm-payment
// @access  Private (Admin)
exports.confirmBankTransferPayment = catchAsync(async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { transactionCode, note } = req.body;

        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        if (order.paymentMethod !== 'bank_transfer') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng không phải thanh toán chuyển khoản'
            });
        }

        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.notes = (order.notes || '') + `\nXác nhận chuyển khoản - Mã GD: ${transactionCode}. ${note || ''}`;
        
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Đã xác nhận thanh toán chuyển khoản',
            data: order
        });

    } catch (error) {
        console.error('Error confirming bank transfer:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xác nhận thanh toán'
        });
    }
});