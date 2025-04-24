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
    // TODO:
    // 1. Lấy productId từ req.params.id
    // 2. Lấy userId từ req.user (middleware)
    // 3. Validate productId
    // 4. Tìm sản phẩm bằng findById
    // 5. Kiểm tra sản phẩm có tồn tại không
    // 6. Kiểm tra xem user có phải là chủ shop của sản phẩm không (product.shopId so với shop của user)
    // 7. Lấy dữ liệu cần cập nhật từ req.body
    // 8. Cập nhật slug nếu name thay đổi
    // 9. Dùng findByIdAndUpdate để cập nhật, nhớ tùy chọn { new: true, runValidators: true }
    // 10. Xử lý lỗi và trả về response
    res.status(501).json({ success: false, message: 'Update product not implemented yet' });
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private (Seller owning product or Admin)
exports.deleteProduct = async (req, res) => {
    // TODO:
    // 1. Lấy productId từ req.params.id
    // 2. Lấy user (userId, role) từ req.user (middleware)
    // 3. Validate productId
    // 4. Tìm sản phẩm bằng findById
    // 5. Kiểm tra sản phẩm có tồn tại không
    // 6. Kiểm tra quyền:
    //    - Nếu user là 'admin', cho phép xóa.
    //    - Nếu user là 'seller', kiểm tra xem user có phải chủ shop của sản phẩm không.
    //    - Nếu không phải cả hai, từ chối.
    // 7. Dùng findByIdAndDelete hoặc product.remove() để xóa
    // 8. Xử lý lỗi và trả về response (status 204 nếu thành công và không có content trả về)
    res.status(501).json({ success: false, message: 'Delete product not implemented yet' });
};