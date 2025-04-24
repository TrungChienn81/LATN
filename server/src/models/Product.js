// models/Product.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true }, // Sẽ cần tạo slug tự động
    description: { type: String, required: true },
    brand: { type: String }, // Hoặc ObjectId nếu tham chiếu Brands collection
    category: { type: String }, // Hoặc ObjectId nếu tham chiếu Categories collection
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }], // Mảng các URL ảnh
    specifications: { type: Object }, // Lưu cấu hình dạng object
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'active', 'inactive', 'out_of_stock'], default: 'draft' },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    // ... thêm các trường khác nếu cần
}, { timestamps: true,
    collection: 'Products'
 },
);

const Product = mongoose.model('Product', productSchema); // map với collection 'products'
module.exports = Product;