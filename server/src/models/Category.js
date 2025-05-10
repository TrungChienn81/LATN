// models/Category.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: { // URL-friendly name, nên tự động tạo từ name và đảm bảo unique
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: 'Category', // Tham chiếu đến chính nó cho danh mục cha
        default: null
    },
    description: {
        type: String,
        trim: true
    },
    iconUrl: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'Categories'
});

// Không cần index slug vì đã được đánh index tự động qua unique: true

const Category = mongoose.model('Category', categorySchema); // map với collection 'categories'
module.exports = Category;