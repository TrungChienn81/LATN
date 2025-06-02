// src/controllers/order.controller.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Shop = require('../models/Shop');
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');

// Helper function to generate a simple order code (bạn có thể làm phức tạp hơn)
const generateOrderCode = () => {
    return `HD${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
}

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