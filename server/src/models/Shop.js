// models/Shop.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shopSchema = new Schema({
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu đến User model
        required: true
    },
    shopName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    logoUrl: {
        type: String
    },
    bannerUrl: {
        type: String
    },
    address: { // Địa chỉ kho/liên hệ của shop
        street: { type: String },
        city: { type: String },
        district: { type: String },
        ward: { type: String }
    },
    contactPhone: {
        type: String
    },
    contactEmail: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending_approval', 'approved', 'rejected', 'active', 'inactive'],
        default: 'pending_approval'
    },
    rating: { // Có thể tính toán sau dựa trên reviews
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
}, {
    timestamps: true, // Tự động thêm createdAt và updatedAt
    collection: 'Shops' 
});

const Shop = mongoose.model('Shop', shopSchema); // map với collection 'shops'
module.exports = Shop;