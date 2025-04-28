// src/controllers/shop.controller.js
const Shop = require('../models/Shop');
const User = require('../models/User'); // Import User model để cập nhật shopId cho user
const mongoose = require('mongoose');

// @desc    Seller tạo gian hàng mới
// @route   POST /api/shops
// @access  Private (Seller)
exports.createShop = async (req, res) => {
    try {
        const loggedInUserId = req.user._id; // Lấy ID của seller đang đăng nhập từ middleware protect

        // --- 1. Kiểm tra xem seller này đã có shop chưa ---
        const existingShop = await Shop.findOne({ ownerId: loggedInUserId });
        if (existingShop) {
            return res.status(400).json({ success: false, message: 'Bạn đã có một gian hàng rồi.' });
        }

        // --- 2. Lấy thông tin shop từ request body ---
        const { shopName, description, contactPhone, contactEmail, address } = req.body;

        // Validate dữ liệu cơ bản
        if (!shopName || !contactPhone || !contactEmail) { // Thêm các trường bắt buộc khác nếu cần
             return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên gian hàng, SĐT và email liên hệ.' });
        }

        // --- 3. Chuẩn bị dữ liệu để tạo shop ---
        const shopData = {
            shopName,
            description,
            contactPhone,
            contactEmail,
            address, // address là object { street, city, ... }
            ownerId: loggedInUserId, // Quan trọng: Gán ownerId là ID của seller đang đăng nhập
            status: 'pending_approval' // Hoặc 'active' luôn nếu không cần duyệt
            // Các trường logoUrl, bannerUrl sẽ được cập nhật sau
        };

        // --- 4. Tạo shop mới trong DB ---
        const newShop = await Shop.create(shopData);

        // --- 5. (Quan trọng) Cập nhật lại User document, thêm shopId vào ---
        // Việc này giúp truy vấn shop của user dễ dàng hơn sau này
        await User.findByIdAndUpdate(loggedInUserId, { shopId: newShop._id });

        res.status(201).json({
            success: true,
            message: 'Tạo gian hàng thành công!', // Có thể thêm: "Chờ phê duyệt." nếu status là pending
            data: newShop
        });

    } catch (error) {
        console.error('!!! CATCH BLOCK - Error creating shop:', error);
         if (error.code === 11000) { // Lỗi trùng tên shop nếu bạn đặt unique index cho shopName
            return res.status(400).json({ success: false, message: `Tên gian hàng '${error.keyValue.shopName}' đã tồn tại.` });
         }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        res.status(500).json({ success: false, message: 'Lỗi Server khi tạo gian hàng' });
    }
};

// TODO: Implement các hàm khác: getMyShop, updateMyShop, getShopById...