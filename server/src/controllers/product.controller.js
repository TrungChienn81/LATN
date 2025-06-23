// controllers/product.controller.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Shop = require('../models/Shop');
const mongoose = require('mongoose');

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    console.log('createProduct - Request body:', req.body);
    console.log('createProduct - Files:', req.files);

    // Kiểm tra xem người dùng có quyền tạo sản phẩm hay không
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền tạo sản phẩm.'
      });
    }

    // Lấy dữ liệu từ request body
    let { name, description, price, stockQuantity, category, brand } = req.body;
    let images = [];

    // Validate dữ liệu cơ bản
    if (!name || !description || !price || !stockQuantity || !category) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm.'
      });
    }
    
    // Xử lý trường hợp category là tên thay vì ID
    if (category && typeof category === 'string' && !mongoose.Types.ObjectId.isValid(category)) {
      // Tìm category theo tên
      const existingCategory = await Category.findOne({ name: { $regex: new RegExp('^' + category + '$', 'i') } });
      
      if (existingCategory) {
        // Nếu tìm thấy category, sử dụng ID của nó
        category = existingCategory._id;
      } else {
        // Nếu không tìm thấy, tạo category mới
        const newCategory = await Category.create({
          name: category,
          slug: category.toLowerCase().split(' ').join('-') + '-' + Date.now()
        });
        category = newCategory._id;
      }
    }
    
    // Xử lý trường hợp brand là tên thay vì ID
    if (brand && typeof brand === 'string' && !mongoose.Types.ObjectId.isValid(brand)) {
      // Tìm brand theo tên
      const existingBrand = await Brand.findOne({ name: { $regex: new RegExp('^' + brand + '$', 'i') } });
      
      if (existingBrand) {
        // Nếu tìm thấy brand, sử dụng ID của nó
        brand = existingBrand._id;
      } else {
        // Nếu không tìm thấy, tạo brand mới
        const newBrand = await Brand.create({
          name: brand,
          slug: brand.toLowerCase().split(' ').join('-') + '-' + Date.now()
        });
        brand = newBrand._id;
      }
    }

    // Tạo slug cho sản phẩm
    const slug = name.toLowerCase().split(' ').join('-') + '-' + Date.now();

    // Xử lý files ảnh được upload
    if (req.files && req.files.length > 0) {
      // Cập nhật đường dẫn của file để sử dụng trong server
      images = req.files.map(file => `/uploads/${file.filename}`);
      console.log('Processed image paths:', images);
    }
    
    // Xử lý ảnh có sẵn được gửi dưới dạng JSON
    if (req.body.images && req.body.images !== '{}' && Object.keys(req.body.images).length > 0) {
      try {
        // Kiểm tra nếu images là chuỗi JSON
        if (typeof req.body.images === 'string') {
          try {
            const parsedImages = JSON.parse(req.body.images);
            if (Array.isArray(parsedImages)) {
              images = images.concat(parsedImages.filter(img => img && typeof img === 'string'));
            } else if (parsedImages && typeof parsedImages === 'string') {
              images.push(parsedImages);
            }
          } catch (e) {
            // Nếu không phải JSON, xử lý như chuỗi thông thường
            if (req.body.images && typeof req.body.images === 'string' && req.body.images.trim() !== '') {
              images.push(req.body.images);
            }
          }
        } else if (Array.isArray(req.body.images)) {
          // Nếu là mảng, thêm các mục hợp lệ
          images = images.concat(req.body.images.filter(img => img && typeof img === 'string'));
        }
      } catch (error) {
        console.error('Error processing images from request body:', error);
      }
    }
    
    // Đảm bảo images là một mảng có các chuỗi hợp lệ
    images = Array.isArray(images) ? images.filter(img => img && typeof img === 'string') : [];
    
    console.log('Final images:', images);

    // Vấn đề: đảm bảo shopId có sẵn hoặc tạo mới
    // Tìm hoặc tạo default shop cho admin user
    let shopId = null;
    
    // Lấy shopId từ req.user nếu có
    if (req.user.shopId && mongoose.Types.ObjectId.isValid(req.user.shopId)) {
      shopId = req.user.shopId;
    }

    // Nếu không có shopId hợp lệ (trường hợp admin)
    if (!shopId && req.user.role === 'admin') {
      try {
        // Tìm một shop bất kỳ để sử dụng
        const shop = await Shop.findOne();
        
        if (shop) {
          shopId = shop._id;
        } else {
          // Nếu không có shop nào, tạo shop mặc định
          console.log('Creating default shop for new product');
          const defaultShop = await Shop.create({
            shopName: 'Default Shop',
            description: 'Default shop for admin-created products',
            user: req.user._id,
            status: 'active',
            contactEmail: req.user.email || 'admin@example.com',
            contactPhone: '0123456789'
          });
          shopId = defaultShop._id;
        }
      } catch (error) {
        console.error('Error finding or creating shop:', error);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi tìm hoặc tạo shop: ' + error.message
        });
      }
    }
    
    // Kiểm tra lần cuối để đảm bảo có shopId hợp lệ
    if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy hoặc không thể tạo shop cho sản phẩm này'
      });
    }

    // Tạo sản phẩm mới
    const newProduct = await Product.create({
      name,
      slug,
      description,
      price,
      stockQuantity,
      category,
      brand,
      images,
      shopId: shopId // Gán shopId đã tìm/tạo nếu cần
    });

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công!',
      data: newProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi Server khi tạo sản phẩm: ' + error.message
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
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'categoryName'];
    excludedFields.forEach(el => delete queryObj[el]);
    
    // Xử lý filter đặc biệt cho shopId
    if (queryObj.shopId) {
      // Đảm bảo shopId hợp lệ
      if (!mongoose.Types.ObjectId.isValid(queryObj.shopId)) {
        // Nếu shopId không hợp lệ, trả về mảng rỗng
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: page,
          data: []
        });
      }
      // Mongoose sẽ tự động convert string thành ObjectId
    }
    
    // Xử lý toán tử filter như gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    
    // Tạo query cơ bản
    let query = Product.find(JSON.parse(queryStr))
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('shopId', 'shopName ownerId status rating');
    
    // Xử lý filter theo tên category (cho gaming hoặc category khác)
    if (req.query.categoryName) {
      const categoryName = req.query.categoryName.toLowerCase();
      
      // Tìm tất cả category có tên chứa từ khóa
      const categories = await Category.find({
        name: { $regex: categoryName, $options: 'i' }
      });
      
      if (categories.length > 0) {
        const categoryIds = categories.map(cat => cat._id);
        query = query.where('category').in(categoryIds);
      } else {
        // Nếu không tìm thấy category nào, trả về empty
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: page,
          data: []
        });
      }
    }
    
    // Sắp xếp
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Thực thi query
    const products = await query;
    
    // Map products để có trường shop thay vì shopId
    const formattedProducts = products.map(product => {
      const productObj = product.toObject();
      productObj.shop = productObj.shopId; // Copy shopId data to shop field
      
      // Add brandName for easier frontend access
      if (productObj.brand && typeof productObj.brand === 'object' && productObj.brand.name) {
        productObj.brandName = productObj.brand.name;
      } else if (typeof productObj.brand === 'string') {
        // If brand is just an ObjectId string, try to extract from product name
        if (productObj.name) {
          const nameParts = productObj.name.split(' ');
          // Look for known brands in the product name
          for (const part of nameParts) {
            const partLower = part.toLowerCase();
            if (['msi', 'acer', 'asus', 'dell', 'hp', 'lenovo', 'apple', 'samsung', 'lg', 'sony', 
                 'intel', 'amd', 'nvidia', 'corsair', 'kingston', 'crucial', 'western', 'seagate',
                 'logitech', 'razer', 'steelseries', 'hyperx', 'cooler', 'master', 'thermaltake',
                 'gigabyte', 'asrock', 'evga', 'zotac', 'viewsonic', 'benq', 'philips'].includes(partLower)) {
              productObj.brandName = part.toUpperCase();
              break;
            }
          }
          
          // If still no brandName found, try position-based extraction
          if (!productObj.brandName && nameParts.length >= 3) {
            const possibleBrand = nameParts[2];
            if (possibleBrand && 
                !['gaming', 'laptop', 'pc', 'màn', 'hình', 'chuột', 'bàn', 'phím', 'máy', 'tính'].includes(possibleBrand.toLowerCase()) &&
                possibleBrand.length >= 2) {
              productObj.brandName = possibleBrand.charAt(0).toUpperCase() + possibleBrand.slice(1);
            }
          }
        }
        
        // Fallback if still no brandName
        if (!productObj.brandName) {
          productObj.brandName = 'Đa thương hiệu';
        }
      }
      
      // Add categoryName for easier frontend access  
      if (productObj.category && typeof productObj.category === 'object' && productObj.category.name) {
        productObj.categoryName = productObj.category.name;
      } else if (typeof productObj.category === 'string') {
        // Try to extract category name from known patterns
        productObj.categoryName = 'Gaming'; // Default for now since we're in gaming context
      }
      
      return productObj;
    });
    
    // Tính total với cùng filter
    let countQuery = Product.find(JSON.parse(queryStr));
    if (req.query.categoryName) {
      const categoryName = req.query.categoryName.toLowerCase();
      const categories = await Category.find({
        name: { $regex: categoryName, $options: 'i' }
      });
      if (categories.length > 0) {
        const categoryIds = categories.map(cat => cat._id);
        countQuery = countQuery.where('category').in(categoryIds);
      }
    }
    const total = await countQuery.countDocuments();
    
    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: formattedProducts
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
      .populate('shopId', 'shopName ownerId status rating');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm với ID này'
      });
    }
    
    // Format product để có trường shop
    const productObj = product.toObject();
    productObj.shop = productObj.shopId;
    
    // Add brandName for easier frontend access
    if (productObj.brand && typeof productObj.brand === 'object' && productObj.brand.name) {
      productObj.brandName = productObj.brand.name;
    } else if (typeof productObj.brand === 'string') {
      // If brand is just an ObjectId string, try to extract from product name
      if (productObj.name) {
        const nameParts = productObj.name.split(' ');
        // Look for known brands in the product name
        for (const part of nameParts) {
          const partLower = part.toLowerCase();
          if (['msi', 'acer', 'asus', 'dell', 'hp', 'lenovo', 'apple', 'samsung', 'lg', 'sony', 
               'intel', 'amd', 'nvidia', 'corsair', 'kingston', 'crucial', 'western', 'seagate',
               'logitech', 'razer', 'steelseries', 'hyperx', 'cooler', 'master', 'thermaltake',
               'gigabyte', 'asrock', 'evga', 'zotac', 'viewsonic', 'benq', 'philips'].includes(partLower)) {
            productObj.brandName = part.toUpperCase();
            break;
          }
        }
        
        // If still no brandName found, try position-based extraction
        if (!productObj.brandName && nameParts.length >= 3) {
          const possibleBrand = nameParts[2];
          if (possibleBrand && 
              !['gaming', 'laptop', 'pc', 'màn', 'hình', 'chuột', 'bàn', 'phím', 'máy', 'tính'].includes(possibleBrand.toLowerCase()) &&
              possibleBrand.length >= 2) {
            productObj.brandName = possibleBrand.charAt(0).toUpperCase() + possibleBrand.slice(1);
          }
        }
      }
      
      // Fallback if still no brandName
      if (!productObj.brandName) {
        productObj.brandName = 'Đa thương hiệu';
      }
    }
    
    // Add categoryName for easier frontend access  
    if (productObj.category && typeof productObj.category === 'object' && productObj.category.name) {
      productObj.categoryName = productObj.category.name;
    } else if (typeof productObj.category === 'string') {
      // Try to extract category name from known patterns
      productObj.categoryName = 'Gaming'; // Default for now since we're in gaming context
    }
    
    res.status(200).json({
      success: true,
      data: productObj
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
    console.log('=== UPDATE PRODUCT DEBUG ===');
    console.log('User:', { id: req.user._id, role: req.user.role });
    console.log('Product ID:', req.params.id);
    console.log('Update product request body:', req.body);
    console.log('Update product files:', req.files); // Ảnh mới upload

    const productId = req.params.id; // Lấy id từ route params
    
    // Kiểm tra xem product có tồn tại không
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm với ID này'
      });
    }
    
    console.log('Product found:', { id: existingProduct._id, name: existingProduct.name, shopId: existingProduct.shopId });
    
    // Kiểm tra quyền - admin có thể update bất kỳ, seller chỉ update được của mình
    if (req.user.role === 'seller') {
      console.log('User is seller, checking shop ownership...');
      const shop = await Shop.findOne({ ownerId: req.user._id });
      console.log('User shop:', shop ? { id: shop._id, name: shop.shopName } : 'No shop found');
      
      if (!shop || !existingProduct.shopId.equals(shop._id)) {
        console.log('Access denied: User does not own this product');
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền cập nhật sản phẩm này'
        });
      }
      console.log('Shop ownership verified');
    } else {
      console.log('User is admin, allowing update');
    }
    
    const updateData = { ...req.body };

    // XỬ LÝ SHOP ID
    if (updateData.shopId) {
      if (typeof updateData.shopId === 'object' && updateData.shopId._id) {
        // Nếu shopId là một object có trường _id (ví dụ từ populate hoặc client gửi object)
        updateData.shopId = updateData.shopId._id.toString();
      } else if (typeof updateData.shopId === 'string' && !mongoose.Types.ObjectId.isValid(updateData.shopId)) {
        // Nếu shopId là string nhưng không phải ObjectId hợp lệ (ví dụ: "[object Object]")
        // thì có thể đây là lỗi gửi dữ liệu từ client, nên xóa hoặc xử lý đặc biệt.
        // Trong trường hợp này, có thể client đã gửi sai, ta sẽ không cập nhật shopId.
        console.warn(`Invalid shopId format received: ${updateData.shopId}. shopId will not be updated.`);
        delete updateData.shopId;
      }
      // Nếu updateData.shopId đã là một chuỗi ObjectId hợp lệ, Mongoose sẽ tự xử lý.
    }

    // 1. Xử lý ảnh mới upload (nếu có)
    let newImagePaths = [];
    if (req.files && req.files.length > 0) {
      newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
    }

    // 2. Xử lý ảnh đã tồn tại (nếu có)
    let existingImageUrls = [];
    if (updateData.existingImages) {
      // Đảm bảo existingImages luôn là một mảng để xử lý nhất quán
      existingImageUrls = Array.isArray(updateData.existingImages)
        ? updateData.existingImages
        : [updateData.existingImages];
      // Lọc bỏ các giá trị không hợp lệ (ví dụ: chuỗi rỗng) nếu cần
      existingImageUrls = existingImageUrls.filter(url => typeof url === 'string' && url.trim() !== '');
      // Xóa trường existingImages khỏi updateData vì nó đã được xử lý và sẽ được gán vào updateData.images
      delete updateData.existingImages;
    }

    // 3. Kết hợp ảnh cũ và ảnh mới vào trường 'images' của updateData
    const combinedImages = [...existingImageUrls, ...newImagePaths];

    // Chỉ cập nhật trường 'images' nếu có ảnh mới được upload,
    // hoặc nếu client chủ động gửi một mảng (có thể rỗng) cho existingImageUrls.
    // Nếu không có ảnh mới (newImagePaths rỗng) VÀ không có existingImageUrls nào được client gửi lên
    // (tức là client không muốn thay đổi ảnh), thì KHÔNG cập nhật trường images.
    if (newImagePaths.length > 0 || (updateData.existingImages !== undefined || req.body.existingImages !== undefined)) {
      updateData.images = combinedImages;
    } else {
      // Nếu không có ảnh mới và client cũng không gửi 'existingImages',
      // thì không chạm vào trường 'images' của sản phẩm, giữ nguyên ảnh cũ.
      // Do đó, ta xóa 'images' khỏi updateData để nó không bị ghi đè.
      delete updateData.images;
      console.log('No new images and no existingImages field sent by client. Preserving original images.');
    }
    
    console.log('Final images for update (if any):', updateData.images);
    console.log('Final update data:', updateData); // Log dữ liệu cuối cùng trước khi cập nhật

    // Xử lý slug, brand, category (giữ nguyên logic cũ của bạn nếu có)
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase().split(' ').join('-') + '-' + Date.now(); // Tạo slug cơ bản
    }

    if (updateData.brand && typeof updateData.brand === 'string') {
      // Tìm brand theo tên
      const brand = await Brand.findOne({ name: updateData.brand });
      if (brand) {
        // Nếu tìm thấy brand trong database, sử dụng ID
        updateData.brand = brand._id;
      } else {
        // Nếu không tìm thấy brand, giữ nguyên tên (để lưu trực tiếp tên vào database)
        console.log(`Brand "${updateData.brand}" not found in database, keeping name as brand value`);
        // updateData.brand giữ nguyên giá trị string
      }
    }

    if (updateData.category && typeof updateData.category === 'string') {
      // Tìm category theo tên
      const category = await Category.findOne({ name: updateData.category });
      if (category) {
        // Nếu tìm thấy category trong database, sử dụng ID
        updateData.category = category._id;
      } else {
        // Nếu không tìm thấy category, giữ nguyên tên (để lưu trực tiếp tên vào database)
        console.log(`Category "${updateData.category}" not found in database, keeping name as category value`);
        // updateData.category giữ nguyên giá trị string
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true, runValidators: true });

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm với ID này'
      });
    }

    console.log('Product updated successfully:', updatedProduct.name);

    res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error); // Thêm log lỗi chi tiết
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sản phẩm: ' + error.message
    });
  }
};

// Xóa sản phẩm
exports.deleteProduct = async (req, res, next) => {
  try {
    console.log('=== DELETE PRODUCT DEBUG ===');
    console.log('User:', { id: req.user._id, role: req.user.role });
    console.log('Product ID:', req.params.id);
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm với ID này'
      });
    }
    
    console.log('Product found:', { id: product._id, name: product.name, shopId: product.shopId });
    
    // Kiểm tra quyền - admin có thể xóa bất kỳ, seller chỉ xóa được của mình
    if (req.user.role === 'seller') {
      console.log('User is seller, checking shop ownership...');
      const shop = await Shop.findOne({ ownerId: req.user._id });
      console.log('User shop:', shop ? { id: shop._id, name: shop.shopName } : 'No shop found');
      
      if (!shop || !product.shopId.equals(shop._id)) {
        console.log('Access denied: User does not own this product');
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa sản phẩm này'
        });
      }
      console.log('Shop ownership verified');
    } else {
      console.log('User is admin, allowing delete');
    }
    
    await Product.findByIdAndDelete(req.params.id);
    console.log('Product deleted successfully');
    
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

// Xóa tất cả sản phẩm (chỉ dành cho admin)
exports.deleteAllProducts = async (req, res, next) => {
  try {
    // Kiểm tra xem người dùng có phải là admin hay không
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền xóa tất cả sản phẩm'
      });
    }
    
    // Xóa tất cả sản phẩm
    const result = await Product.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Đã xóa thành công ${result.deletedCount} sản phẩm`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all products:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa tất cả sản phẩm'
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
    // Đây là giải pháp tạm thởi - thực tế nên có logic để admin chọn shop
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