// models/Review.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shopId: { // Lưu lại shopId để tiện query review theo shop
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    orderId: { // Liên kết với đơn hàng để xác thực người mua
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    },
    images: [{ // Ảnh do người dùng đăng kèm review
        type: String
    }],
    isApproved: { // Nếu cần duyệt review
        type: Boolean,
        default: true // Hoặc false nếu mặc định là chờ duyệt
    }
}, {
    timestamps: true
});

// Index để tìm kiếm review nhanh hơn
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true }); // 1 user chỉ review 1 sp 1 lần
reviewSchema.index({ productId: 1 });
reviewSchema.index({ shopId: 1 });

// Middleware hoặc logic để cập nhật averageRating/reviewCount trong Product/Shop sau khi review được tạo/xóa
// (Sẽ thực hiện ở tầng controller/service)

const Review = mongoose.model('Review', reviewSchema); // map với collection 'reviews'
module.exports = Review;