// models/Brand.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: { // URL-friendly name
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    logoUrl: {
        type: String
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Không cần index slug vì đã được đánh index tự động qua unique: true

const Brand = mongoose.model('Brand', brandSchema); // map với collection 'brands'
module.exports = Brand;