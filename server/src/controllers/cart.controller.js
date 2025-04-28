// src/controllers/cart.controller.js
const Cart = require('../models/Cart');
const Product = require('../models/Product'); // Cần để lấy thông tin sản phẩm
const mongoose = require('mongoose');

// --- Helper function để lấy hoặc tạo giỏ hàng ---
const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = await Cart.create({ userId, items: [] });
    }
    return cart;
};

// @desc    Lấy giỏ hàng của user
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId', // Populate thông tin sản phẩm cho từng item
            select: 'name price images slug shopId stockQuantity' // Chọn các trường cần thiết của Product
            // Thêm populate cho shopId nếu muốn hiển thị tên shop trong giỏ hàng
            // populate: { path: 'shopId', select: 'shopName' }
        });

        if (!cart) {
            // Nếu user chưa có cart (chưa từng thêm gì), trả về giỏ hàng rỗng
            return res.status(200).json({ success: true, data: { items: [], _id: null, userId } });
        }

        // TODO: Có thể tính tổng tiền giỏ hàng ở đây và trả về cùng

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        console.error("Error getting cart:", error);
        res.status(500).json({ success: false, message: 'Lỗi Server khi lấy giỏ hàng' });
    }
};

// @desc    Thêm sản phẩm vào giỏ hàng
// @route   POST /api/cart/items
// @access  Private
exports.addItemToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID sản phẩm và số lượng hợp lệ (lớn hơn 0).' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
         return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    try {
        // 1. Kiểm tra sản phẩm có tồn tại và còn hàng không
        const product = await Product.findById(productId);
        if (!product || product.status !== 'active') {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm hoặc sản phẩm không hoạt động.' });
        }
        if (product.stockQuantity < quantity) {
             return res.status(400).json({ success: false, message: `Số lượng tồn kho không đủ (còn ${product.stockQuantity}).` });
        }

        // 2. Lấy hoặc tạo giỏ hàng cho user
        const cart = await getOrCreateCart(userId);

        // 3. Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (existingItemIndex > -1) {
            // Nếu đã có -> Cập nhật số lượng
            cart.items[existingItemIndex].quantity += quantity;
            // TODO: Kiểm tra lại tổng số lượng với tồn kho sau khi cộng dồn
            if(cart.items[existingItemIndex].quantity > product.stockQuantity) {
                 return res.status(400).json({ success: false, message: `Số lượng tồn kho không đủ (còn ${product.stockQuantity}). Bạn đã có sản phẩm này trong giỏ.` });
            }
            // Cập nhật lại giá tại thời điểm thêm (nếu giá sản phẩm có thể thay đổi) - Tùy chọn
             cart.items[existingItemIndex].priceAtAddition = product.price;

        } else {
            // Nếu chưa có -> Thêm item mới
            cart.items.push({
                productId: productId,
                quantity: quantity,
                shopId: product.shopId, // Lấy shopId từ sản phẩm
                priceAtAddition: product.price, // Lưu giá tại thời điểm thêm
                addedAt: Date.now()
            });
        }

        // 4. Lưu lại giỏ hàng
        await cart.save();

        // 5. Lấy lại giỏ hàng đầy đủ thông tin để trả về
        const updatedCart = await Cart.findById(cart._id).populate({
             path: 'items.productId',
             select: 'name price images slug shopId stockQuantity'
        });

        res.status(200).json({ success: true, message: 'Thêm vào giỏ hàng thành công!', data: updatedCart });

    } catch (error) {
        console.error("Error adding item to cart:", error);
        res.status(500).json({ success: false, message: 'Lỗi Server khi thêm vào giỏ hàng' });
    }
};


// @desc    Cập nhật số lượng item trong giỏ
// @route   PUT /api/cart/items/:productId
// @access  Private
exports.updateCartItem = async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0.' });
    }
     if (!mongoose.Types.ObjectId.isValid(productId)) {
         return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    try {
         // Kiểm tra tồn kho của sản phẩm trước
         const product = await Product.findById(productId).select('stockQuantity');
         if (!product) {
             return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
         }
         if (product.stockQuantity < quantity) {
              return res.status(400).json({ success: false, message: `Số lượng tồn kho không đủ (còn ${product.stockQuantity}).` });
         }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng.' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
             return res.status(404).json({ success: false, message: 'Sản phẩm này không có trong giỏ hàng của bạn.' });
        }

        // Cập nhật số lượng
        cart.items[itemIndex].quantity = quantity;
        // Có thể cập nhật lại giá nếu cần
        // cart.items[itemIndex].priceAtAddition = product.price; // Nếu cần cập nhật giá mới nhất

        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
             path: 'items.productId',
             select: 'name price images slug shopId stockQuantity'
        });

        res.status(200).json({ success: true, message: 'Cập nhật giỏ hàng thành công!', data: updatedCart });

    } catch (error) {
        console.error("Error updating cart item:", error);
        res.status(500).json({ success: false, message: 'Lỗi Server khi cập nhật giỏ hàng' });
    }
};

// @desc    Xóa item khỏi giỏ hàng
// @route   DELETE /api/cart/items/:productId
// @access  Private
exports.removeCartItem = async (req, res) => {
    const { productId } = req.params;
    const userId = req.user._id;

     if (!mongoose.Types.ObjectId.isValid(productId)) {
         return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
             return res.status(404).json({ success: false, message: 'Không tìm thấy giỏ hàng.' });
        }

        // Lọc ra những item không phải là productId cần xóa
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        await cart.save();

         const updatedCart = await Cart.findById(cart._id).populate({
             path: 'items.productId',
             select: 'name price images slug shopId stockQuantity'
        });


        res.status(200).json({ success: true, message: 'Xóa sản phẩm khỏi giỏ hàng thành công!', data: updatedCart });

    } catch (error) {
        console.error("Error removing cart item:", error);
        res.status(500).json({ success: false, message: 'Lỗi Server khi xóa khỏi giỏ hàng' });
    }
};

// @desc    Xóa sạch giỏ hàng
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
    const userId = req.user._id;
    try {
         const cart = await Cart.findOne({ userId });
         if (cart) {
             cart.items = []; // Gán mảng items thành rỗng
             await cart.save();
         }
        // Nếu không có cart thì cũng coi như thành công (giỏ đã sạch)
         res.status(200).json({ success: true, message: 'Xóa sạch giỏ hàng thành công!', data: { items: [], userId } });
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).json({ success: false, message: 'Lỗi Server khi xóa sạch giỏ hàng' });
    }
};