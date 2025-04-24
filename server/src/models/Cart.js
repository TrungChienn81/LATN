// models/Cart.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    shopId: { // Lưu shopId để tiện nhóm hoặc xử lý logic sau này
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    priceAtAddition: { // Lưu giá sản phẩm tại thời điểm thêm vào giỏ
        type: Number,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false }); // Không cần _id cho từng item trong giỏ

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi user chỉ có 1 giỏ hàng
    },
    items: [cartItemSchema] // Mảng các sản phẩm trong giỏ
}, {
    timestamps: true // createdAt và updatedAt cho cả giỏ hàng
});

const Cart = mongoose.model('Cart', cartSchema); // map với collection 'carts'
module.exports = Cart;