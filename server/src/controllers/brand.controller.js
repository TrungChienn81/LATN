const Brand = require('../models/Brand');
const slugify = require('slugify'); 

// Helper function to generate a unique slug for Brand
const generateUniqueBrandSlug = async (name, currentId = null) => {
  let slug = slugify(name, { lower: true, strict: true });
  let count = 0;
  let existingBrand;
  let query;

  do {
    const tempSlug = count === 0 ? slug : `${slug}-${count}`;
    query = { slug: tempSlug };
    if (currentId) {
      query._id = { $ne: currentId }; // Exclude current document when updating
    }
    existingBrand = await Brand.findOne(query);
    if (existingBrand) {
      count++;
    }
  } while (existingBrand);

  return count === 0 ? slug : `${slug}-${count}`;
};

exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error in getAllBrands:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách thương hiệu' });
  }
};

exports.createBrand = async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên thương hiệu là bắt buộc' });
    }

    const slug = await generateUniqueBrandSlug(name);

    const newBrand = new Brand({
      name,
      slug,
      description,
      logoUrl
    });

    await newBrand.save();
    res.status(201).json({ success: true, data: newBrand, message: 'Thương hiệu đã được tạo thành công' });
  } catch (error) {
    console.error('Error in createBrand:', error);
    if (error.code === 11000) { 
        return res.status(400).json({ success: false, message: 'Tên thương hiệu hoặc slug đã tồn tại.' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo thương hiệu' });
  }
};

exports.getBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu' });
    }
    res.json({ success: true, data: brand });
  } catch (error) {
    console.error('Error in getBrand:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin thương hiệu' });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body;
    const brandId = req.params.id;

    let brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu để cập nhật' });
    }

    if (name) {
      // Only regenerate slug if name changes and is different from original
      if (name !== brand.name) { 
        brand.slug = await generateUniqueBrandSlug(name, brandId);
      }
      brand.name = name;
    }
    if (description !== undefined) brand.description = description;
    if (logoUrl !== undefined) brand.logoUrl = logoUrl;

    const updatedBrand = await brand.save();
    res.json({ success: true, data: updatedBrand, message: 'Thương hiệu đã được cập nhật thành công' });
  } catch (error) {
    console.error('Error in updateBrand:', error);
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Tên thương hiệu hoặc slug cập nhật đã tồn tại.' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thương hiệu' });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu để xóa' });
    }
    // Optional: Check if this brand is used by any products and handle accordingly.
    res.json({ success: true, message: 'Thương hiệu đã được xóa thành công' });
  } catch (error) {
    console.error('Error in deleteBrand:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa thương hiệu' });
  }
};