// controllers/product.controller.js
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Category = require('../models/Category'); // <<< THÊM IMPORT NÀY (điều chỉnh đường dẫn nếu cần)
const Brand = require('../models/Brand');       // <<< THÊM IMPORT NÀY (điều chỉnh đường dẫn nếu cần)
const mongoose = require('mongoose');

// Tạo sản phẩm mới
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stockQuantity, category, brand, images } = req.body;
    
    // Validation cơ bản
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm và giá không được bỏ trống'
      });
    }
    
    // Tạo slug từ tên sản phẩm
    const slug = name.toLowerCase().split(' ').join('-') + '-' + Date.now();
    
    // Lấy shop ID của người dùng (nếu là seller)
    let shopId = null;
    if (req.user.role === 'seller') {
      const shop = await Shop.findOne({ user: req.user._id });
      if (!shop) {
        return res.status(400).json({
          success: false,
          message: 'Seller phải có shop trước khi tạo sản phẩm'
        });
      }
      shopId = shop._id;
    }
    
    const product = await Product.create({
      name,
      slug,
      description: description || '',
      price,
      stockQuantity: stockQuantity || 0,
      category,
      brand,
      images: images || [],
      shop: shopId,
      user: req.user._id
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sản phẩm'
    });
  }
};

// Lấy tất cả sản phẩm, có hỗ trợ lọc và phân trang
exports.getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Xây dựng query filter
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);
    
    // Xử lý toán tử filter như gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    
    // Tạo query
    let query = Product.find(JSON.parse(queryStr))
      .skip(skip)
      .limit(limit)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('shopId', 'shopName');
    
    // Sắp xếp
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Thực thi query
    const products = await query;
    const total = await Product.countDocuments(JSON.parse(queryStr));
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm'
    });
  }
};

// Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('shopId', 'shopName');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm với ID này'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin sản phẩm'
    });
  }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm với ID này'
      });
    }
    
    // Kiểm tra quyền - chỉ seller sở hữu sản phẩm mới được cập nhật
    if (req.user.role === 'seller') {
      const shop = await Shop.findOne({ user: req.user._id });
      
      if (!shop || !product.shop.equals(shop._id)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền cập nhật sản phẩm này'
        });
      }
    }
    
    // Cập nhật slug nếu tên thay đổi
    if (req.body.name && req.body.name !== product.name) {
      req.body.slug = req.body.name.toLowerCase().split(' ').join('-') + '-' + Date.now();
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sản phẩm'
    });
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm với ID này'
      });
    }
    
    // Kiểm tra quyền - admin có thể xóa bất kỳ, seller chỉ xóa được của mình
    if (req.user.role === 'seller') {
      const shop = await Shop.findOne({ user: req.user._id });
      
      if (!shop || !product.shop.equals(shop._id)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa sản phẩm này'
        });
      }
    }
    
    await Product.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sản phẩm'
    });
  }
};

// HÀM MỚI CHO VIỆC IMPORT SẢN PHẨM
exports.importProducts = async (req, res, next) => {
  console.log('--- Received request at /api/products/import ---');
  console.log('Request body:', JSON.stringify(req.body, null, 2)); // Added for debugging
  
  try {
    let products = [];
    
    // Kiểm tra xem request có mảng products hay không
    if (req.body.products && Array.isArray(req.body.products)) {
      products = req.body.products;
      console.log(`Found ${products.length} products in JSON format`);
    } 
    // Nếu không có mảng products, kiểm tra xem có data trực tiếp không
    else if (req.body.data && Array.isArray(req.body.data)) {
      products = req.body.data;
      console.log(`Found ${products.length} products in direct data format`);
    }
    // Thêm các trường hợp khác nếu cần
    
    // Validate mảng products
    if (!products || products.length === 0) {
      console.log('Validation failed: Missing products data or empty array.');
      console.log('Request body keys:', Object.keys(req.body));
      return res.status(400).json({ 
        success: false, 
        message: 'Không có dữ liệu sản phẩm để import hoặc dữ liệu không phải là một mảng.',
        receivedData: req.body // Trả về dữ liệu đã nhận để debug
      });
    }

    console.log(`Processing ${products.length} products to import`);
    // Log sample của sản phẩm đầu tiên
    if (products.length > 0) {
      console.log('First product example:', JSON.stringify(products[0], null, 2));
    }

    // Tìm một default shop cho admin user để sử dụng khi import
    // Đây là giải pháp tạm thời - thực tế nên có logic để admin chọn shop
    let defaultShop = null;
    try {
      if (req.user && req.user.role === 'admin') {
        // Tìm một shop bất kỳ để gán cho sản phẩm import
        defaultShop = await Shop.findOne();
        
        if (!defaultShop) {
          // Nếu không có shop nào, tạo một shop mặc định
          console.log('Creating default shop for product import');
          defaultShop = await Shop.create({
            shopName: 'Default Shop', 
            description: 'Default shop for imported products',
            ownerId: req.user._id,
            status: 'active', // Đặt status là active
            contactEmail: req.user.email || 'admin@example.com',
            contactPhone: '0123456789',
            address: {
              city: 'Ho Chi Minh'
            }
          });
        }
        console.log(`Using default shop ID: ${defaultShop._id} for import`);
      } else {
        console.log('User is not admin or not authenticated, cannot create default shop');
      }
    } catch (shopError) {
      console.error('Error finding/creating default shop:', shopError);
      throw new Error(`Không thể tìm hoặc tạo shop mặc định: ${shopError.message}`);
    }

    let importedCount = 0;
    let failedCount = 0;
    const errors = [];
    const createdProducts = [];
    const loggedInUser = req.user; // Lấy thông tin admin đang thực hiện import
    
    // Log thông tin user
    console.log('User performing import:', loggedInUser ? loggedInUser._id : 'No user data');

    // Danh sách để theo dõi category và brand mới đã tạo để tránh tạo trùng lặp
    const createdCategories = new Map();
    const createdBrands = new Map();

    for (const productData of products) {
      // Khởi tạo object sản phẩm với các giá trị mặc định
      const processedProduct = {
        name: productData.name || productData.Name || '',
        description: productData.description || productData.Description || 'Chưa có mô tả chi tiết',
        price: parseFloat(productData.price || productData.Price || 0),
        stockQuantity: parseInt(productData.stockQuantity || productData.StockQuantity || 0, 10),
        category: productData.category || productData.Category || null,
        categoryName: productData.categoryName || '',
        brand: productData.brand || productData.Brand || null,
        brandName: productData.brandName || '',
        images: productData.images || []
      };
      
      // --- VALIDATION ---
      if (!processedProduct.name || typeof processedProduct.name !== 'string' || processedProduct.name.trim() === '') {
        errors.push({ item: productData, error: `Sản phẩm "${processedProduct.name || 'không tên'}" thiếu tên hoặc tên không hợp lệ.` });
        failedCount++;
        continue;
      }
      
      if (isNaN(processedProduct.price) || processedProduct.price < 0) {
        errors.push({ item: productData, error: `Sản phẩm "${processedProduct.name}" có giá không hợp lệ.` });
        failedCount++;
        continue;
      }
      
      if (isNaN(processedProduct.stockQuantity) || processedProduct.stockQuantity < 0) {
        errors.push({ item: productData, error: `Sản phẩm "${processedProduct.name}" có số lượng tồn kho không hợp lệ.` });
        failedCount++;
        continue;
      }

      // --- Xử lý Category ---
      let categoryId = null;
      
      // Nếu có sẵn id category hợp lệ, sử dụng nó
      if (processedProduct.category && mongoose.Types.ObjectId.isValid(processedProduct.category)) {
        const categoryExists = await Category.findById(processedProduct.category);
        if (categoryExists) {
          categoryId = categoryExists._id;
        }
      }
      
      // Nếu không có category ID nhưng có tên category, tìm hoặc tạo mới
      if (!categoryId && processedProduct.categoryName) {
        // Kiểm tra xem đã tạo category này trước đó chưa
        if (createdCategories.has(processedProduct.categoryName.toLowerCase())) {
          categoryId = createdCategories.get(processedProduct.categoryName.toLowerCase());
        } else {
          // Tìm category theo tên
          let category = await Category.findOne({ 
            name: { $regex: new RegExp('^' + processedProduct.categoryName + '$', 'i') } 
          });
          
          if (!category) {
            // Tạo category mới nếu không tìm thấy
            try {
              category = await Category.create({
                name: processedProduct.categoryName,
                description: `Category for imported product: ${processedProduct.name}`,
                status: 'active'
              });
              console.log(`Created new category: ${category.name} with ID: ${category._id}`);
              createdCategories.set(processedProduct.categoryName.toLowerCase(), category._id);
            } catch (categoryError) {
              console.error(`Error creating category "${processedProduct.categoryName}":`, categoryError);
            }
          }
          
          if (category) {
            categoryId = category._id;
          }
        }
      }

      // --- Xử lý Brand ---
      let brandId = null;
      
      // Nếu có sẵn id brand hợp lệ, sử dụng nó
      if (processedProduct.brand && mongoose.Types.ObjectId.isValid(processedProduct.brand)) {
        const brandExists = await Brand.findById(processedProduct.brand);
        if (brandExists) {
          brandId = brandExists._id;
        }
      }
      
      // Nếu không có brand ID nhưng có tên brand, tìm hoặc tạo mới
      if (!brandId && processedProduct.brandName) {
        // Kiểm tra xem đã tạo brand này trước đó chưa
        if (createdBrands.has(processedProduct.brandName.toLowerCase())) {
          brandId = createdBrands.get(processedProduct.brandName.toLowerCase());
        } else {
          // Tìm brand theo tên
          let brand = await Brand.findOne({ 
            name: { $regex: new RegExp('^' + processedProduct.brandName + '$', 'i') } 
          });
          
          if (!brand) {
            // Tạo brand mới nếu không tìm thấy
            try {
              brand = await Brand.create({
                name: processedProduct.brandName,
                description: `Brand for imported product: ${processedProduct.name}`,
                status: 'active'
              });
              console.log(`Created new brand: ${brand.name} with ID: ${brand._id}`);
              createdBrands.set(processedProduct.brandName.toLowerCase(), brand._id);
            } catch (brandError) {
              console.error(`Error creating brand "${processedProduct.brandName}":`, brandError);
            }
          }
          
          if (brand) {
            brandId = brand._id;
          }
        }
      }
      
      // --- Xử lý Images - Chuyển thành mảng các URL chuỗi như schema yêu cầu ---
      let processedImages = [];
      
      // Nếu có images là array
      if (Array.isArray(processedProduct.images)) {
        processedProduct.images.forEach(img => {
          if (typeof img === 'string') {
            processedImages.push(img);
          } else if (img && img.url) {
            processedImages.push(img.url);
          }
        });
      } 
      // Nếu có image là string đơn
      else if (productData.image && typeof productData.image === 'string') {
        processedImages.push(productData.image);
      }
      // Nếu có imageUrl là string
      else if (productData.imageUrl && typeof productData.imageUrl === 'string') {
        processedImages.push(productData.imageUrl);
      }
      
      // Trong trường hợp không tìm thấy ảnh nào, sử dụng ảnh mặc định
      if (processedImages.length === 0) {
        processedImages.push('https://via.placeholder.com/150?text=No+Image');
      }

      try {
        const slug = processedProduct.name.toLowerCase().split(' ').join('-') + '-' + Date.now(); // Tạo slug cơ bản
        
        // Kiểm tra xem có shop ID cho sản phẩm hay không
        if (!defaultShop || !defaultShop._id) {
          console.error('Không thể import sản phẩm vì không có shop ID');
          errors.push({ 
            item: productData, 
            error: 'Không thể import sản phẩm: Thiếu Shop ID và không tìm thấy shop mặc định' 
          });
          failedCount++;
          continue; // Bỏ qua sản phẩm này và xử lý sản phẩm tiếp theo
        }
        
        const newProductData = {
          name: processedProduct.name,
          slug: slug,
          description: processedProduct.description,
          price: processedProduct.price,
          stockQuantity: processedProduct.stockQuantity || 0,
          category: categoryId, // Đã xử lý tìm hoặc tạo mới
          brand: brandId,       // Đã xử lý tìm hoặc tạo mới
          images: processedImages,
          // Gán shopId - bắt buộc theo schema
          shopId: defaultShop._id
        };
        
        // Thêm user ID nếu có
        if (loggedInUser && loggedInUser._id) {
          newProductData.user = loggedInUser._id;
        }
        
        console.log(`Tạo sản phẩm "${processedProduct.name}" với shopId: ${newProductData.shopId}`);
        const createdProduct = await Product.create(newProductData);
        createdProducts.push(createdProduct);
        importedCount++;
      } catch (dbError) {
        console.error(`Error creating product "${processedProduct.name}" in DB:`, dbError);
        let errMsg = dbError.message || 'Lỗi khi lưu vào CSDL.';
        if (dbError.code === 11000) { // Lỗi duplicate key (ví dụ slug)
            errMsg = `Sản phẩm với thông tin trùng lặp (ví dụ: slug) đã tồn tại.`;
        }
        errors.push({ item: productData, error: errMsg });
        failedCount++;
      }
    }

    if (failedCount > 0 && importedCount === 0) {
         return res.status(400).json({
            success: false,
            message: `Không thể import sản phẩm nào. Tổng số lỗi: ${failedCount}.`,
            errors: errors,
         });
    }
    
    // Trả về kết quả import
    return res.status(200).json({
        success: true,
        message: `Import thành công ${importedCount} sản phẩm. ${failedCount > 0 ? `Không thể import ${failedCount} sản phẩm.` : ''}`,
        importedCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined,
        newCategories: Array.from(createdCategories.entries()).map(([name, id]) => ({ name, id })),
        newBrands: Array.from(createdBrands.entries()).map(([name, id]) => ({ name, id }))
    });
  } catch (error) {
    console.error('Error in product import process:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi import sản phẩm: ${error.message}`,
    });
  }
};