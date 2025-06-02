// models/Cart.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        required: true // Lưu giá tại thời điểm thêm vào giỏ hàng
    },
    shop: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    }
}, {
    timestamps: true
});

const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // Mỗi user chỉ có 1 giỏ hàng
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0
    },
    totalItems: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'Carts'
});

// Middleware để tính toán tổng tiền và số lượng
cartSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
    next();
});

// Methods
cartSchema.methods.addItem = function(productId, quantity, price, shopId) {
    const existingItemIndex = this.items.findIndex(
        item => item.product.toString() === productId.toString()
    );

    if (existingItemIndex >= 0) {
        // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
        this.items[existingItemIndex].quantity += quantity;
    } else {
        // Nếu chưa có, thêm sản phẩm mới
        this.items.push({
            product: productId,
            quantity: quantity,
            price: price,
            shop: shopId
        });
    }
    return this.save();
};

cartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(item => item.product.toString() !== productId.toString());
    return this.save();
};

cartSchema.methods.updateItemQuantity = function(productId, quantity) {
    const itemIndex = this.items.findIndex(
        item => item.product.toString() === productId.toString()
    );
    
    if (itemIndex >= 0) {
        if (quantity <= 0) {
            this.items.splice(itemIndex, 1);
        } else {
            this.items[itemIndex].quantity = quantity;
        }
    }
    return this.save();
};

cartSchema.methods.clearCart = function() {
    this.items = [];
    return this.save();
};

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;