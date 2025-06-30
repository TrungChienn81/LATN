// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    street: { type: String, required: false }, // Có thể không bắt buộc nếu bạn muốn linh hoạt
    city: { type: String, required: false },
    district: { type: String, required: false },
    ward: { type: String, required: false },
    isDefault: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false // Hide password from queries by default
        // Nhớ hash mật khẩu trước khi lưu
    },
    role: {
        type: String,
        enum: ['customer', 'seller', 'admin'],
        default: 'customer'
    },
    name: {
        type: String,
        required: false,
        trim: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    avatarUrl: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: null
    },
    addresses: [addressSchema],
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending_verification'],
        default: 'active'
    },
    shopId: {
        type: Schema.Types.ObjectId,
        ref: 'Shop', // Tham chiếu đến model 'Shop' (sẽ tạo sau)
        default: null
    },
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    userEmbedding: {
        type: [Number],
        default: undefined
    }
}, {
    timestamps: true,
    collection: 'Users'  // Tự động thêm createdAt và updatedAt
});

const User = mongoose.model('User', userSchema); // Tên model là 'User', map với collection 'users'

module.exports = User;
