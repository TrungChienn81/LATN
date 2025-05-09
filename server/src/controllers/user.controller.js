const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password'); // Loại bỏ password
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch users.' });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not fetch user.' });
  }
};

// @desc    Update user (e.g., update role by Admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    // Các trường có thể được admin cập nhật, ví dụ: role, status
    // Frontend sẽ gửi các trường cần cập nhật trong req.body
    const { role, status, firstName, lastName, phone } = req.body;
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Cập nhật các trường nếu chúng được cung cấp
    if (role) user.role = role;
    if (status) user.status = status;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    // Không cho phép admin cập nhật mật khẩu trực tiếp ở đây để đảm bảo an toàn
    // Nếu cần, tạo một route riêng cho admin reset password

    const updatedUser = await user.save();
    // Loại bỏ password trước khi gửi response
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, data: userResponse });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ success: false, message: 'Server Error: Could not update user.' });
  }
};


// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Thực hiện xóa người dùng
    await User.deleteOne({ _id: req.params.id }); // Hoặc user.remove() nếu bạn có pre-remove hooks

    res.status(200).json({ success: true, message: 'User removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error: Could not delete user.' });
  }
}; 