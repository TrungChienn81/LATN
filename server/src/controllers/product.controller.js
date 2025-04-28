// controllers/product.controller.js
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const mongoose = require('mongoose');

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Private (Seller)
exports.createProduct = async (req, res) => {
    try {
        const loggedInUser = req.user;

        const sellerShop = await Shop.findOne({ ownerId: loggedInUser._id });
        if (!sellerShop) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn cần đăng ký và được duyệt gian hàng trước khi đăng sản phẩm.' 
            });
        }
        const shopId = sellerShop._id;

        const { 
            name, description, price, stockQuantity, 
            category, brand, specifications, 
            images, tags, originalPrice 
        } = req.body;

        if (!name || !description || !price || !stockQuantity || !category || !brand) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng cung cấp đủ thông tin bắt buộc cho sản phẩm.' 
            });
        }

        console.log('--- Preparing product data...');
        const slug = name.toLowerCase().split(' ').join('-') + '-' + Date.now();
        const productData = {
            name, description, price, stockQuantity, 
            category, brand, specifications, 
            images, tags, originalPrice,
            shopId,
            slug
        };
        console.log('--- Attempting Product.create with data:', JSON.stringify(productData, null, 2));

        const newProduct = await Product.create(productData);
        console.log('--- Product.create SUCCESS:', newProduct);

        res.status(201).json({
            success: true,
            message: 'Sản phẩm đã được tạo thành công!',
            data: newProduct
        });

    } catch (error) {
        console.error('!!! CATCH BLOCK - Error during product creation:', error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: `Sản phẩm với slug '${error.keyValue.slug}' đã tồn tại.` 
            });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join('. ') 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi Server khi tạo sản phẩm' 
        });
    }
};

// @desc    Lấy danh sách tất cả sản phẩm
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm'
        });
    }
};

// @desc    Lấy chi tiết một sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin sản phẩm'
        });
    }
};

// @desc    Cập nhật sản phẩm
// @route   PUT /api/products/:id
// @access  Private (Seller owning product)
exports.updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const loggedInUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID sản phẩm không hợp lệ' 
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: `Không tìm thấy sản phẩm với ID ${productId}` 
            });
        }

        const sellerShop = await Shop.findOne({ ownerId: loggedInUser._id });
        if (!sellerShop) {
            return res.status(403).json({ 
                success: false, 
                message: 'Không tìm thấy thông tin gian hàng của bạn.' 
            });
        }

        if (product.shopId.toString() !== sellerShop._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn không có quyền cập nhật sản phẩm này.' 
            });
        }

        delete req.body.shopId;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Cập nhật sản phẩm thành công!',
            data: updatedProduct
        });

    } catch (error) {
        console.error('!!! CATCH BLOCK - Error during product update:', error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: `Slug sản phẩm đã tồn tại.` 
            });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join('. ') 
            });
        }
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi Server khi cập nhật sản phẩm' 
        });
    }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private (Seller owning product or Admin)
exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const loggedInUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID sản phẩm không hợp lệ' 
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: `Không tìm thấy sản phẩm với ID ${productId}` 
            });
        }

        let canDelete = false;
        if (loggedInUser.role === 'admin') {
            canDelete = true;
        } else if (loggedInUser.role === 'seller') {
            const sellerShop = await Shop.findOne({ ownerId: loggedInUser._id });
            if (sellerShop && product.shopId.toString() === sellerShop._id.toString()) {
                canDelete = true;
            }
        }

        if (!canDelete) {
            return res.status(403).json({ 
                success: false, 
                message: 'Bạn không có quyền xóa sản phẩm này.' 
            });
        }

        await Product.findByIdAndDelete(productId);

        res.status(204).json({
            success: true,
            data: null
        });

    } catch (error) {
        console.error('!!! CATCH BLOCK - Error during product delete:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi Server khi xóa sản phẩm' 
        });
    }
};