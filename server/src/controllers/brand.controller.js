const Brand = require('../models/Brand');

exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}; 