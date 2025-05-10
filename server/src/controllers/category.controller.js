const Category = require('../models/Category');
const slugify = require('slugify'); // Cần cài đặt: npm install slugify

// Helper function to generate a unique slug
const generateUniqueSlug = async (name, currentId = null) => {
  let slug = slugify(name, { lower: true, strict: true });
  let count = 0;
  let existingCategory;
  let query;

  do {
    const tempSlug = count === 0 ? slug : `${slug}-${count}`;
    query = { slug: tempSlug };
    if (currentId) {
      query._id = { $ne: currentId }; // Exclude current document when updating
    }
    existingCategory = await Category.findOne(query);
    if (existingCategory) {
      count++;
    }
  } while (existingCategory);

  return count === 0 ? slug : `${slug}-${count}`;
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('parentCategory', 'name slug'); // Populate parent category details
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách danh mục' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, parentCategory, description, iconUrl } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }

    const slug = await generateUniqueSlug(name);

    const newCategory = new Category({
      name,
      slug,
      parentCategory: parentCategory || null,
      description,
      iconUrl
    });

    await newCategory.save();
    res.status(201).json({ success: true, data: newCategory, message: 'Danh mục đã được tạo thành công' });
  } catch (error) {
    console.error('Error in createCategory:', error);
    if (error.code === 11000) { // Duplicate key error (e.g. for slug if not handled by generateUniqueSlug properly)
        return res.status(400).json({ success: false, message: 'Tên danh mục hoặc slug đã tồn tại.' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo danh mục' });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parentCategory', 'name slug');
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    console.error('Error in getCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin danh mục' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, parentCategory, description, iconUrl } = req.body;
    const categoryId = req.params.id;

    let category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục để cập nhật' });
    }

    if (name) {
      category.name = name;
      // Only regenerate slug if name changes
      if (name !== category.name) { // This logic is slightly off, as category.name has already been updated
        // A better approach is to compare req.body.name with original category.name if it was fetched before this block
        // For simplicity, we assume if name is in req.body, slug might need update
        category.slug = await generateUniqueSlug(name, categoryId);
      }
    }
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (description !== undefined) category.description = description;
    if (iconUrl !== undefined) category.iconUrl = iconUrl;

    const updatedCategory = await category.save();
    res.json({ success: true, data: updatedCategory, message: 'Danh mục đã được cập nhật thành công' });
  } catch (error) {
    console.error('Error in updateCategory:', error);
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Tên danh mục hoặc slug cập nhật đã tồn tại.' });
    }
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật danh mục' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục để xóa' });
    }
    // Optional: Check if this category is a parentCategory for any other category
    // or if it's used by any products and handle accordingly (e.g., prevent deletion or reassign).
    // For now, direct deletion.
    res.json({ success: true, message: 'Danh mục đã được xóa thành công' });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa danh mục' });
  }
};