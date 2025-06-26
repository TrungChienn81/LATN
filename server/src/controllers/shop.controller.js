// src/controllers/shop.controller.js
const Shop = require('../models/Shop');
const User = require('../models/User'); // Import User model để cập nhật shopId cho user
const Order = require('../models/Order'); // Import Order model
const mongoose = require('mongoose');

// Middleware kiểm tra quyền sở hữu shop
exports.checkShopOwnership = async (req, res, next) => {
  try {
    const shopId = req.params.id;
    const userId = req.user._id;
    
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy shop'
      });
    }
    
    // Kiểm tra xem người dùng hiện tại có phải chủ shop không
    if (shop.ownerId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }
    
    // Lưu shop vào request để sử dụng ở middleware tiếp theo
    req.shop = shop;
    next();
  } catch (error) {
    console.error('Error in checkShopOwnership:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

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
        const { shopName, description, contactPhone, contactEmail, address, adminPassword } = req.body;

        // --- 2.1. Validate mật khẩu admin để tạo shop ---
        const SHOP_CREATION_PASSWORD = process.env.SHOP_CREATION_PASSWORD || 'LATN';
        
        // console.log('Password check:', { 
        //     received: adminPassword, 
        //     expected: SHOP_CREATION_PASSWORD,
        //     match: adminPassword === SHOP_CREATION_PASSWORD 
        // });
        
        if (!adminPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng nhập mật khẩu tạo shop do admin cung cấp.' 
            });
        }

        if (adminPassword !== SHOP_CREATION_PASSWORD) {
            return res.status(403).json({ 
                success: false, 
                message: 'Sai mật khẩu tạo shop, hãy nhập lại.' 
            });
        }

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
            status: 'approved' // Thay đổi thành approved để shop có thể hiển thị ngay
            // Các trường logoUrl, bannerUrl sẽ được cập nhật sau
        };

        // --- 4. Tạo shop mới trong DB ---
        const newShop = await Shop.create(shopData);

        // --- 5. (Quan trọng) Cập nhật lại User document, thêm shopId và set role thành seller ---
        // Việc này giúp truy vấn shop của user dễ dàng hơn sau này
        await User.findByIdAndUpdate(loggedInUserId, { 
            shopId: newShop._id,
            role: 'seller' // Cập nhật role thành seller khi tạo shop
        });

        res.status(201).json({
            success: true,
            message: 'Tạo gian hàng thành công! Bạn đã trở thành Seller và vẫn có thể mua sản phẩm như trước.',
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

// Lấy shop của người dùng đang đăng nhập
exports.getMyShop = async (req, res) => {
  try {
    const userId = req.user._id;
    const shop = await Shop.findOne({ ownerId: userId });
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa có shop nào'
      });
    }
    
    // Kiểm tra và cập nhật role nếu user có shop nhưng vẫn là customer
    if (req.user.role === 'customer') {
      console.log('Updating user role to seller as they have a shop');
      await User.findByIdAndUpdate(userId, { role: 'seller' });
    }
    
    res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Error in getMyShop:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy shop theo owner ID
exports.getShopByOwnerId = async (req, res) => {
  try {
    const ownerId = req.params.userId;
    const shop = await Shop.findOne({ ownerId });
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy shop của người dùng này'
      });
    }
    
    res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Error in getShopByOwnerId:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy tất cả shops
exports.getAllShops = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Chỉ lấy những shop đã được phê duyệt
    const shops = await Shop.find({ status: 'approved' })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Shop.countDocuments({ status: 'approved' });
    
    res.status(200).json({
      success: true,
      data: shops,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllShops:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy shop theo ID
exports.getShopById = async (req, res) => {
  try {
    const shopId = req.params.id;
    const shop = await Shop.findById(shopId);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy shop'
      });
    }
    
    res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Error in getShopById:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy shop theo ID với thống kê
exports.getShopByIdWithStats = async (req, res) => {
  try {
    const shopId = req.params.id;
    const shop = await Shop.findById(shopId);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy shop'
      });
    }

    // Đếm số sản phẩm của shop
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ shopId: shopId });

    // Tính thời gian tham gia (số tháng từ khi tạo shop)
    const joinedMonths = Math.max(1, Math.floor((Date.now() - shop.createdAt) / (1000 * 60 * 60 * 24 * 30)));

    // Thêm thống kê vào response
    const shopWithStats = {
      ...shop.toObject(),
      stats: {
        productCount,
        joinedMonths,
        rating: shop.rating || 4.5, // Default rating
        ratingCount: Math.floor(productCount * 2.3) || 1, // Mock rating count
        responseRate: Math.min(100, 85 + Math.random() * 15), // Mock response rate 85-100%
        responseTime: `${Math.floor(Math.random() * 3) + 1} giờ`, // Mock response time
        followerCount: Math.floor(productCount * 8.5) || 1 // Mock follower count
      }
    };
    
    res.status(200).json({
      success: true,
      data: shopWithStats
    });
  } catch (error) {
    console.error('Error in getShopByIdWithStats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Cập nhật shop của mình (dùng userId để tìm shop)
exports.updateMyShop = async (req, res) => {
  try {
    const { shopName, description, contactPhone, contactEmail, address } = req.body;
    const userId = req.user._id;
    
    // Tìm shop của user
    const shop = await Shop.findOne({ ownerId: userId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa có shop nào'
      });
    }
    
    // Nếu có cập nhật tên shop, kiểm tra xem tên đã tồn tại chưa
    if (shopName && shopName !== shop.shopName) {
      const shopNameExists = await Shop.findOne({ 
        shopName, 
        _id: { $ne: shop._id } // Loại trừ shop hiện tại
      });
      
      if (shopNameExists) {
        return res.status(400).json({
          success: false,
          message: 'Tên shop đã tồn tại, vui lòng chọn tên khác'
        });
      }
    }
    
    // Xử lý ảnh mới nếu có
    const updateData = {
      shopName,
      description,
      contactPhone,
      contactEmail,
      address
    };
    
    if (req.files) {
      if (req.files.logo) {
        updateData.logoUrl = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files.banner) {
        updateData.bannerUrl = `/uploads/${req.files.banner[0].filename}`;
      }
    }
    
    // Cập nhật shop
    const updatedShop = await Shop.findByIdAndUpdate(
      shop._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật shop thành công',
      data: updatedShop
    });
  } catch (error) {
    console.error('Error in updateMyShop:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật shop'
    });
  }
};

// Cập nhật thông tin shop (dùng cho admin)
exports.updateShop = async (req, res) => {
  try {
    const { shopName, description, contactPhone, contactEmail, address } = req.body;
    const shopId = req.params.id;
    
    // Nếu có cập nhật tên shop, kiểm tra xem tên đã tồn tại chưa
    if (shopName && shopName !== req.shop.shopName) {
      const shopNameExists = await Shop.findOne({ 
        shopName, 
        _id: { $ne: shopId } // Loại trừ shop hiện tại
      });
      
      if (shopNameExists) {
        return res.status(400).json({
          success: false,
          message: 'Tên shop đã tồn tại, vui lòng chọn tên khác'
        });
      }
    }
    
    // Xử lý ảnh mới nếu có
    const updateData = {
      shopName,
      description,
      contactPhone,
      contactEmail,
      address
    };
    
    if (req.files) {
      if (req.files.logo) {
        updateData.logoUrl = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files.banner) {
        updateData.bannerUrl = `/uploads/${req.files.banner[0].filename}`;
      }
    }
    
    // Cập nhật shop
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật shop thành công',
      data: updatedShop
    });
  } catch (error) {
    console.error('Error in updateShop:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật shop'
    });
  }
};

// Lấy danh sách sản phẩm của shop mình
exports.getMyShopProducts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Tìm shop của user
    const shop = await Shop.findOne({ ownerId: userId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa có shop nào'
      });
    }

    // Lấy thông tin phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Tìm sản phẩm thuộc shop này
    const Product = require('../models/Product');
    const Category = require('../models/Category');
    const Brand = require('../models/Brand');

    const products = await Product.find({ shopId: shop._id })
      .populate('category', 'name')
      .populate('brand', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments({ shopId: shop._id });

    res.status(200).json({
      success: true,
      data: products,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error in getMyShopProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy sản phẩm'
    });
  }
};

// Tạo sản phẩm mới cho shop
exports.createShopProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Tìm shop của user
    const shop = await Shop.findOne({ ownerId: userId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa có shop nào'
      });
    }

    const { name, description, price, stockQuantity, category, brand } = req.body;
    
    // Validate dữ liệu cơ bản
    if (!name || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm (tên, mô tả, giá)'
      });
    }

    // Xử lý images từ upload
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }
    
    // Xử lý existing images từ URLs (cho import từ CSV/Excel)
    if (req.body.existingImages) {
      const existingImageUrls = Array.isArray(req.body.existingImages) 
        ? req.body.existingImages 
        : [req.body.existingImages];
      
      // Validate và thêm các URLs hợp lệ
      existingImageUrls.forEach(url => {
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          images.push(url);
        }
      });
    }

    // Xử lý category - tìm hoặc tạo mới
    const Category = require('../models/Category');
    const Brand = require('../models/Brand');
    const mongoose = require('mongoose');
    
    let categoryId = null;
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryId = category;
      } else {
        // Tìm category theo tên
        let existingCategory = await Category.findOne({ 
          name: { $regex: new RegExp('^' + category + '$', 'i') } 
        });
        
        if (!existingCategory) {
          // Tạo category mới
          existingCategory = await Category.create({
            name: category,
            slug: category.toLowerCase().split(' ').join('-') + '-' + Date.now()
          });
        }
        categoryId = existingCategory._id;
      }
    }

    // Xử lý brand - tìm hoặc tạo mới
    let brandId = null;
    if (brand) {
      if (mongoose.Types.ObjectId.isValid(brand)) {
        brandId = brand;
      } else {
        // Tìm brand theo tên
        let existingBrand = await Brand.findOne({ 
          name: { $regex: new RegExp('^' + brand + '$', 'i') } 
        });
        
        if (!existingBrand) {
          // Tạo brand mới
          existingBrand = await Brand.create({
            name: brand,
            slug: brand.toLowerCase().split(' ').join('-') + '-' + Date.now()
          });
        }
        brandId = existingBrand._id;
      }
    }

    // Tạo slug cho sản phẩm
    const slug = name.toLowerCase().split(' ').join('-') + '-' + Date.now();

    // Tạo sản phẩm mới
    const Product = require('../models/Product');
    const newProduct = await Product.create({
      name,
      slug,
      description,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity) || 0,
      category: categoryId,
      brand: brandId,
      images,
      shopId: shop._id
    });

    // Populate dữ liệu để trả về
    const populatedProduct = await Product.findById(newProduct._id)
      .populate('category', 'name')
      .populate('brand', 'name');

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công!',
      data: populatedProduct
    });
  } catch (error) {
    console.error('Error in createShopProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sản phẩm: ' + error.message
    });
  }
};

// Fix user role cho những user đã có shop nhưng vẫn là customer
exports.fixUserRole = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Tìm shop của user
    const shop = await Shop.findOne({ ownerId: userId });
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa có shop nào'
      });
    }
    
    // Cập nhật role thành seller
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { role: 'seller' },
      { new: true }
    );
    
    console.log(`Updated user ${userId} role from ${req.user.role} to seller`);
    
    res.status(200).json({
      success: true,
      message: 'Đã kích hoạt quyền Seller! Bạn có thể quản lý shop và vẫn mua sản phẩm như Customer.',
      data: {
        userId: updatedUser._id,
        newRole: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error in fixUserRole:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// Lấy thống kê shop dashboard
exports.getShopStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Tìm shop của user
    const shop = await Shop.findOne({ ownerId: userId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa có shop nào'
      });
    }

    const Product = require('../models/Product');
    const Order = require('../models/Order');
    
    // Thống kê sản phẩm
    const totalProducts = await Product.countDocuments({ shopId: shop._id });
    const activeProducts = await Product.countDocuments({ 
      shopId: shop._id, 
      status: 'active' 
    });
    const outOfStockProducts = await Product.countDocuments({ 
      shopId: shop._id, 
      stockQuantity: { $lte: 0 } 
    });

    // Thống kê đơn hàng
    const totalOrders = await Order.countDocuments({ 
      'shops.shop': shop._id 
    });
    const pendingOrders = await Order.countDocuments({ 
      'shops.shop': shop._id,
      'shops.status': 'pending'
    });
    const completedOrders = await Order.countDocuments({ 
      'shops.shop': shop._id,
      'shops.status': 'delivered'
    });

    // Thống kê doanh thu
    const revenueAggregation = await Order.aggregate([
      { 
        $match: { 
          'shops.shop': shop._id,
          orderStatus: { $in: ['delivered', 'confirmed', 'processing', 'shipping'] }
        } 
      },
      { $unwind: '$shops' },
      { 
        $match: { 
          'shops.shop': shop._id 
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$shops.subtotal' },
          avgOrderValue: { $avg: '$shops.subtotal' }
        }
      }
    ]);

    const revenue = revenueAggregation.length > 0 ? revenueAggregation[0] : {
      totalRevenue: 0,
      avgOrderValue: 0
    };

    // Thống kê khách hàng duy nhất
    const uniqueCustomersAggregation = await Order.aggregate([
      { 
        $match: { 
          'shops.shop': shop._id 
        } 
      },
      {
        $group: {
          _id: '$customer'
        }
      },
      {
        $count: 'totalCustomers'
      }
    ]);

    const totalCustomers = uniqueCustomersAggregation.length > 0 
      ? uniqueCustomersAggregation[0].totalCustomers 
      : 0;

    // Thống kê theo tháng (6 tháng gần nhất)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Order.aggregate([
      { 
        $match: { 
          'shops.shop': shop._id,
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      { $unwind: '$shops' },
      { 
        $match: { 
          'shops.shop': shop._id 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$shops.subtotal' }
        }
      },
      { 
        $sort: { '_id.year': 1, '_id.month': 1 } 
      }
    ]);

    // Top sản phẩm bán chạy
    const topProducts = await Order.aggregate([
      { $match: { 'shops.shop': shop._id } },
      { $unwind: '$items' },
      { $match: { 'items.shop': shop._id } },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.totalPrice' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts,
          activeProducts,
          outOfStockProducts,
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue: revenue.totalRevenue || 0,
          avgOrderValue: revenue.avgOrderValue || 0,
          totalCustomers
        },
        monthlyStats,
        topProducts,
        shop: {
          id: shop._id,
          name: shop.shopName,
          status: shop.status,
          createdAt: shop.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error in getShopStats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê shop'
    });
  }
};

// Lấy đơn hàng của shop
exports.getShopOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Tìm shop của user
    const shop = await Shop.findOne({ ownerId: userId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa có shop nào'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    // Build query cho đơn hàng có sản phẩm của shop này
    let matchQuery = {
      'shops.shop': shop._id
    };

    // Filter theo status nếu có
    if (status) {
      matchQuery['shops.status'] = status;
    }

    // Build aggregation pipeline
    let pipeline = [
      {
        $match: matchQuery
      },
      {
        $lookup: {
          from: 'users',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerDetails'
        }
      },
      {
        $unwind: {
          path: '$customerDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'customerInfo.name': { $regex: search, $options: 'i' } },
            { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
            { 'customerDetails.firstName': { $regex: search, $options: 'i' } },
            { 'customerDetails.lastName': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add shopId for easier frontend processing
    pipeline.push({
      $addFields: {
        shopId: shop._id
      }
    });

    // Sort by creation date
    pipeline.push({
      $sort: { createdAt: -1 }
    });

    // Get total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Order.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Add pagination
    pipeline.push(
      { $skip: skip },
      { $limit: limit }
    );

    const orders = await Order.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: orders,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error in getShopOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đơn hàng'
    });
  }
};

// Cập nhật trạng thái đơn hàng của shop
exports.updateShopOrderStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.orderId;
    const { status, trackingNumber, cancelReason } = req.body;

    // Tìm shop của user
    const shop = await Shop.findOne({ ownerId: userId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa có shop nào'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }
    
    // Tìm đơn hàng và kiểm tra shop có quyền update không
    const order = await Order.findOne({
      _id: orderId,
      'shops.shop': shop._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền cập nhật'
      });
    }

    // Update shop-specific status
    const updateData = {
      $set: {
        'shops.$.status': status
      }
    };

    // Add tracking number for shipping status
    if (status === 'shipping' && trackingNumber) {
      updateData.$set.trackingNumber = trackingNumber;
      updateData.$set.shippedAt = new Date();
    }

    // Add cancel reason for cancelled status
    if (status === 'cancelled' && cancelReason) {
      updateData.$set.cancelReason = cancelReason;
      updateData.$set.cancelledAt = new Date();
    }

    // Set delivery date for delivered status
    if (status === 'delivered') {
      updateData.$set.deliveredAt = new Date();
    }

    // Set confirmation date for confirmed status
    if (status === 'confirmed') {
      updateData.$set.confirmedAt = new Date();
    }

    // Update the order
    await Order.updateOne(
      { 
        _id: orderId,
        'shops.shop': shop._id 
      },
      updateData
    );

    // Check if all shops in the order have the same status
    const updatedOrder = await Order.findById(orderId);
    const allShopsStatus = updatedOrder.shops.map(s => s.status);
    const uniqueStatuses = [...new Set(allShopsStatus)];

    // If all shops have the same status, update the main order status
    if (uniqueStatuses.length === 1) {
      await Order.findByIdAndUpdate(orderId, {
        orderStatus: uniqueStatuses[0]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: {
        orderId,
        newStatus: status,
        ...(trackingNumber && { trackingNumber }),
        ...(cancelReason && { cancelReason })
      }
    });
  } catch (error) {
    console.error('Error in updateShopOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái đơn hàng'
    });
  }
};