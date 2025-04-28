// models/UserInteraction.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userInteractionSchema = new Schema({
    userId: { // Có thể null nếu là khách vãng lai
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true // Index userId
    },
    sessionId: { // Dùng cho khách vãng lai
        type: String,
        index: true
    },
    eventType: {
        type: String,
        enum: ['view_product', 'search', 'add_to_cart', 'remove_from_cart', 'purchase', 'view_category', 'view_brand', 'view_shop'],
        required: true
    },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', index: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', index: true },
    searchQuery: { type: String },
    context: { // Thông tin thêm về ngữ cảnh
        device: { type: String },
        ipAddress: { type: String },
        userAgent: { type: String }
        // Thêm các trường context khác nếu cần
    },
    timestamp: { // Thời điểm xảy ra sự kiện
        type: Date,
        required: true,
        default: Date.now,
        index: true // Rất quan trọng để sắp xếp theo thời gian
    },
    collection: 'UserInteractions'
});

// Không cần timestamps: true vì đã có trường timestamp riêng
// Cân nhắc dùng Capped Collection nếu chỉ cần lưu N sự kiện gần nhất và hiệu năng ghi cao
// Hoặc Time Series Collection nếu dùng MongoDB 5.0+ và tập trung vào dữ liệu chuỗi thời gian

const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema); // map với 'userinteractions'
module.exports = UserInteraction;