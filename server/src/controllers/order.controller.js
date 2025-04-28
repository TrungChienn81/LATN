// src/controllers/order.controller.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Shop = require('../models/Shop');
const mongoose = require('mongoose');

// Helper function to generate a simple order code (bạn có thể làm phức tạp hơn)
const generateOrderCode = () => {
    return `HD${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
}

// @desc    Tạo đơn hàng mới từ giỏ hàng
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = async (req, res) => {
    const session = await mongoose.startSession(); // Bắt đầu một transaction để đảm bảo tính nhất quán
    session.startTransaction();
    try {
        const userId = req.user._id;

        // 1. Lấy thông tin từ request body (địa chỉ giao hàng, phương thức thanh toán)
        const { shippingAddress, paymentMethod } = req.body; // shippingAddress có thể là ID hoặc object

        if (!shippingAddress || !paymentMethod) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ giao hàng và phương thức thanh toán.' });
        }

        // 2. Tìm giỏ hàng của user
        const cart = await Cart.findOne({ userId: userId }).session(session); // Thực hiện trong transaction
        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống.' });
        }

        // 3. Chuẩn bị thông tin chi tiết cho đơn hàng (Lấy thông tin product, kiểm tra tồn kho, tính tiền)
        let totalAmount = 0;
        const orderItems = [];
        const productUpdates = []; // Mảng lưu các cập nhật tồn kho

        for (const item of cart.items) {
            const product = await Product.findById(item.productId).session(session); // Thực hiện trong transaction

            // Kiểm tra sản phẩm tồn tại và active
            if (!product || product.status !== 'active') {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ success: false, message: `Sản phẩm "${item.productId}" không tồn tại hoặc không hoạt động.` });
            }

            // Kiểm tra tồn kho
            if (product.stockQuantity < item.quantity) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ success: false, message: `Sản phẩm "${product.name}" không đủ số lượng tồn kho (chỉ còn ${product.stockQuantity}).` });
            }

            // Tạo item cho đơn hàng (snapshot)
            orderItems.push({
                productId: product._id,
                shopId: product.shopId,
                productName: product.name,
                productImage: product.images[0] || null, // Lấy ảnh đầu tiên
                quantity: item.quantity,
                price: product.price, // Lấy giá hiện tại của sản phẩm
                specificationsSnapshot: product.specifications // Snapshot cấu hình (tùy chọn)
            });

            // Tính tổng tiền
            totalAmount += item.quantity * product.price;

            // Chuẩn bị lệnh cập nhật tồn kho
            productUpdates.push({
                updateOne: {
                    filter: { _id: product._id },
                    update: { $inc: { stockQuantity: -item.quantity, soldCount: +item.quantity } } // Giảm tồn kho, tăng SL đã bán
                }
            });
        }

        // 4. Xử lý địa chỉ giao hàng (nếu gửi ID hoặc object)
        let finalShippingAddress;
        // Ví dụ: nếu FE gửi object địa chỉ trực tiếp
        if (typeof shippingAddress === 'object' && shippingAddress.street) {
             // TODO: Validate object địa chỉ này
             finalShippingAddress = shippingAddress;
        } else if (mongoose.Types.ObjectId.isValid(shippingAddress)) {
             // Nếu FE gửi ID của địa chỉ đã lưu trong profile user
             const user = await User.findById(userId).select('addresses').session(session);
             const foundAddress = user.addresses.id(shippingAddress); // Tìm sub-document bằng ID
             if (!foundAddress) {
                  await session.abortTransaction();
                  session.endSession();
                  return res.status(400).json({ success: false, message: 'Không tìm thấy địa chỉ giao hàng đã chọn.' });
             }
             finalShippingAddress = foundAddress.toObject(); // Chuyển thành object thường
             delete finalShippingAddress._id; // Bỏ _id của sub-document address
        } else {
             await session.abortTransaction();
             session.endSession();
             return res.status(400).json({ success: false, message: 'Định dạng địa chỉ giao hàng không hợp lệ.' });
        }


        // 5. Tính phí ship, giảm giá (Tạm thời bỏ qua, gán mặc định)
        const shippingFee = 0; // Tạm thời
        const discountAmount = 0; // Tạm thời
        const finalAmount = totalAmount + shippingFee - discountAmount;

        // 6. Tạo đơn hàng mới
        const orderData = {
            orderCode: generateOrderCode(),
            userId: userId,
            items: orderItems,
            shippingAddress: finalShippingAddress,
            shippingFee,
            totalAmount,
            discountAmount,
            finalAmount,
            paymentMethod,
            paymentStatus: 'pending', // Chờ thanh toán
            orderStatus: 'pending_confirmation' // Chờ shop/admin xác nhận
        };
        const newOrder = (await Order.create([orderData], { session: session }))[0]; // Thực hiện trong transaction
        console.log(`Order ${newOrder.orderCode} created successfully.`);

        // 7. Cập nhật tồn kho sản phẩm (Bulk Write)
        if (productUpdates.length > 0) {
             await Product.bulkWrite(productUpdates, { session: session }); // Thực hiện trong transaction
             console.log(`Stock updated for order ${newOrder.orderCode}.`);
        }

        // 8. Xóa giỏ hàng của user
        await Cart.deleteOne({ userId: userId }).session(session); // Thực hiện trong transaction
        console.log(`Cart cleared for user ${userId}.`);


        // 9. Commit transaction nếu mọi thứ thành công
        await session.commitTransaction();
        session.endSession();

        console.log(`Transaction committed for order ${newOrder.orderCode}.`);
        res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công!',
            data: newOrder
        });

    } catch (error) {
        // Nếu có lỗi ở bất kỳ bước nào, hủy bỏ transaction
        await session.abortTransaction();
        session.endSession();
        console.error('!!! CATCH BLOCK - Error creating order:', error);
        res.status(500).json({ success: false, message: 'Lỗi Server khi tạo đơn hàng' });
    }
};

// @desc    Lấy danh sách đơn hàng của người dùng
// @route   GET /api/orders/my-orders
// @access  Private (Customer)
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error("!!! CATCH BLOCK - Error fetching user orders:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi Server khi lấy lịch sử đơn hàng' 
        });
    }
};

// @desc    Lấy chi tiết đơn hàng theo ID
// @route   GET /api/orders/:orderId
// @access  Private
exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const loggedInUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID đơn hàng không hợp lệ' 
            });
        }

        const order = await Order.findById(orderId)
            .populate({
                path: 'items.productId',
                select: 'name images slug'
            })
            .populate({
                path: 'items.shopId',
                select: 'shopName'
            });

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy đơn hàng.' 
            });
        }

        let canAccess = false;
        if (order.userId.toString() === loggedInUser._id.toString()) {
            canAccess = true;
        } else if (loggedInUser.role === 'admin') {
            canAccess = true;
        } else if (loggedInUser.role === 'seller') {
            const sellerShop = await Shop.findOne({ ownerId: loggedInUser._id });
            if (sellerShop && order.items.some(item => 
                item.shopId._id.toString() === sellerShop._id.toString()
            )) {
                canAccess = true;
            }
        }

        if (!canAccess) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn không có quyền xem đơn hàng này.' 
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error("!!! CATCH BLOCK - Error fetching order details:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi Server khi lấy chi tiết đơn hàng' 
        });
    }
};

// @desc    Cập nhật trạng thái đơn hàng
// @route   PUT /api/orders/:orderId/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const loggedInUser = req.user;
        const { orderStatus, paymentStatus } = req.body;

        const allowedOrderStatuses = Order.schema.path('orderStatus').enumValues;
        const allowedPaymentStatuses = Order.schema.path('paymentStatus').enumValues;

        if (orderStatus && !allowedOrderStatuses.includes(orderStatus)) {
            return res.status(400).json({ 
                success: false, 
                message: `Trạng thái đơn hàng không hợp lệ: ${orderStatus}` 
            });
        }
        if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({ 
                success: false, 
                message: `Trạng thái thanh toán không hợp lệ: ${paymentStatus}` 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID đơn hàng không hợp lệ' 
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy đơn hàng.' 
            });
        }

        let canUpdate = false;
        if (loggedInUser.role === 'admin') {
            canUpdate = true;
        } else if (loggedInUser.role === 'seller') {
            const sellerShop = await Shop.findOne({ ownerId: loggedInUser._id });
            if (sellerShop && order.items.some(item => 
                item.shopId.toString() === sellerShop._id.toString()
            )) {
                canUpdate = true;
            }
        }

        if (!canUpdate) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn không có quyền cập nhật trạng thái đơn hàng này.' 
            });
        }

        let updated = false;
        if (orderStatus && order.orderStatus !== orderStatus) {
            order.orderStatus = orderStatus;
            updated = true;
        }
        if (paymentStatus && order.paymentStatus !== paymentStatus) {
            order.paymentStatus = paymentStatus;
            updated = true;
        }

        if (!updated) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không có thông tin trạng thái mới để cập nhật.' 
            });
        }

        const updatedOrder = await order.save();

        res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái đơn hàng thành công!',
            data: updatedOrder
        });

    } catch (error) {
        console.error("!!! CATCH BLOCK - Error updating order status:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join('. ') 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi Server khi cập nhật trạng thái đơn hàng' 
        });
    }
};