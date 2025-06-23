// src/controllers/cart.controller.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const catchAsync = require('../utils/catchAsync');

// Get user's cart
exports.getCart = catchAsync(async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Cần đăng nhập để xem giỏ hàng'
    });
  }

  let cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: 'items.product',
      select: 'name price images stockQuantity',
      populate: {
        path: 'shopId',
        select: 'shopName'
      }
    })
    .populate('items.shop', 'shopName');

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({
    success: true,
    data: cart
  });
});

// Add item to cart
exports.addToCart = catchAsync(async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Cần đăng nhập để thêm sản phẩm vào giỏ hàng'
    });
  }

  const { productId, quantity = 1 } = req.body;

  // Validate input
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID là bắt buộc'
    });
  }

  if (quantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Số lượng phải lớn hơn 0'
    });
  }

  // Check if product exists and is available
  const product = await Product.findById(productId).populate('shopId', 'shopName');
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy sản phẩm'
    });
  }

  if (product.stockQuantity < quantity) {
    return res.status(400).json({
      success: false,
      message: `Chỉ còn ${product.stockQuantity} sản phẩm trong kho`
    });
  }

  // Get or create cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId.toString()
  );

  if (existingItemIndex >= 0) {
    // Update quantity if item exists
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (newQuantity > product.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Tổng số lượng vượt quá hàng có sẵn (${product.stockQuantity})`
      });
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity: quantity,
      price: product.price,
      shop: product.shopId
    });
  }

  await cart.save();

  // Populate cart for response
  cart = await Cart.findById(cart._id)
    .populate({
      path: 'items.product',
      select: 'name price images stockQuantity'
    })
    .populate('items.shop', 'shopName');

  res.status(200).json({
    success: true,
    message: 'Đã thêm sản phẩm vào giỏ hàng',
    data: cart
  });
});

// Update item quantity in cart
exports.updateCartItem = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ'
    });
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy giỏ hàng'
    });
  }

  if (quantity === 0) {
    // Remove item if quantity is 0
    cart.items = cart.items.filter(item => item.product.toString() !== productId.toString());
  } else {
    // Check stock availability
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    if (quantity > product.stockQuantity) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn ${product.stockQuantity} sản phẩm trong kho`
      });
    }

    // Update quantity
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId.toString());
    if (itemIndex >= 0) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }
  }

  await cart.save();

  // Populate cart for response
  const updatedCart = await Cart.findById(cart._id)
    .populate({
      path: 'items.product',
      select: 'name price images stockQuantity'
    })
    .populate('items.shop', 'shopName');

  res.status(200).json({
    success: true,
    message: 'Đã cập nhật giỏ hàng',
    data: updatedCart
  });
});

// Remove item from cart
exports.removeFromCart = catchAsync(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy giỏ hàng'
    });
  }

  cart.items = cart.items.filter(item => item.product.toString() !== productId.toString());
  await cart.save();

  // Populate cart for response
  const updatedCart = await Cart.findById(cart._id)
    .populate({
      path: 'items.product',
      select: 'name price images stockQuantity'
    })
    .populate('items.shop', 'shopName');

  res.status(200).json({
    success: true,
    message: 'Đã xóa sản phẩm khỏi giỏ hàng',
    data: updatedCart
  });
});

// Clear entire cart
exports.clearCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy giỏ hàng'
    });
  }

  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Đã xóa tất cả sản phẩm trong giỏ hàng',
    data: cart
  });
});

// Get cart count (for navbar badge)
exports.getCartCount = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  const count = cart ? cart.totalItems : 0;

  res.status(200).json({
    success: true,
    data: { count }
  });
});