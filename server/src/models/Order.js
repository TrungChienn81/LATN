// models/Order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema cho từng sản phẩm trong đơn hàng (snapshot)
const orderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    productName: { type: String, required: true }, // Snapshot
    productImage: { type: String }, // Snapshot
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // Snapshot giá tại thời điểm đặt
    specificationsSnapshot: { type: Object } // Snapshot cấu hình
}, { _id: false });

// Schema cho địa chỉ giao hàng (snapshot)
const shippingAddressSchema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true }
}, { _id: false });

const orderSchema = new Schema({
    orderCode: { // Mã đơn hàng tự tạo, vd: HD0000123
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [orderItemSchema],
    shippingAddress: {
        type: shippingAddressSchema,
        required: true
    },
    shippingFee: {
        type: Number,
        required: true,
        default: 0
    },
    totalAmount: { // Tổng tiền hàng (chưa gồm ship, giảm giá)
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    finalAmount: { // Số tiền cuối cùng khách trả
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Momo', 'VNPay', 'BankTransfer'], // Thêm các phương thức khác nếu cần
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentTransactionId: { // Mã giao dịch từ cổng thanh toán
        type: String
    },
    orderStatus: {
        type: String,
        enum: [
            'pending_confirmation', // Chờ xác nhận (từ shop hoặc admin)
            'processing',           // Đang xử lý (shop chuẩn bị hàng)
            'shipped',              // Đã giao vận chuyển
            'delivered',            // Đã giao thành công
            'cancelled_by_user',    // Khách hủy
            'cancelled_by_seller',  // Shop hủy
            'returned'              // Trả hàng
        ],
        default: 'pending_confirmation'
    },
    /* // Optional: Nếu muốn track status theo từng shop
    shopOrderStatus: [{
        shopId: { type: Schema.Types.ObjectId, ref: 'Shop' },
        status: { type: String } // Trạng thái xử lý của shop đó
    }],
    */
    notes: { // Ghi chú của khách hàng
        type: String
    },
    trackingCode: { // Mã vận đơn
        type: String
    }
}, {
    timestamps: true
});

orderSchema.index({ orderCode: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ 'items.shopId': 1 }); // Index shopId trong items nếu cần query theo shop

const Order = mongoose.model('Order', orderSchema); // map với collection 'orders'
module.exports = Order;