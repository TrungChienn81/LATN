// src/controllers/auth.controller.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Hàm xử lý đăng ký
exports.register = async (req, res) => {
    try {
        // Lấy dữ liệu từ request body
        const { username, email, password, firstName, lastName, phone, role } = req.body;

        // --- **Validation Input cơ bản** ---
        if (!username || !email || !password || !firstName || !lastName) {
             return res.status(400).json({ success: false, message: 'Vui lòng cung cấp username, email, password, tên và họ.' });
        }

        // Kiểm tra xem email hoặc username đã tồn tại chưa
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            let message = '';
            if (existingUser.email === email) message = 'Email đã tồn tại.';
            if (existingUser.username === username) message += (message ? ' Username cũng đã tồn tại.' : 'Username đã tồn tại.');
            return res.status(400).json({ success: false, message: message.trim() });
        }

        // --- **Hashing Mật khẩu** ---
        // 1. Tạo Salt (độ phức tạp mã hóa, 10-12 là phổ biến)
        const salt = await bcrypt.genSalt(10);
        // 2. Hash mật khẩu với salt
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- **Tạo User mới với mật khẩu đã hash** ---
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword, // <-- Lưu mật khẩu đã hash
            firstName,
            lastName,
            phone, // phone là optional
            role: role || 'customer' // Gán role mặc định là 'customer' nếu không được cung cấp
        });

        // --- **Phản hồi thành công** ---
        // Không nên gửi lại toàn bộ thông tin user, đặc biệt là password hash
        // Có thể tạo token ngay sau khi đăng ký thành công (sẽ làm ở bước sau)
        res.status(201).json({
            success: true,
            message: "Đăng ký thành công!",
            // data: { userId: newUser._id, email: newUser.email } // Ví dụ chỉ trả về ID và email
            // Hoặc tốt hơn là tạo và trả về token ngay
        });

    } catch (error) {
        console.error('!!! CATCH BLOCK - Error during registration:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        res.status(500).json({ success: false, message: 'Lỗi Server khi đăng ký' });
    }
};

// Hàm xử lý đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng cung cấp email và mật khẩu.' 
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email hoặc mật khẩu không đúng.' 
            });
        }

        const payload = {
            id: user._id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công!',
            token,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('!!! CATCH BLOCK - Error during login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi Server khi đăng nhập' 
        });
    }
};

// Hàm xử lý đăng ký Admin
// @desc    Register a new admin user
// @route   POST /api/auth/register-admin
// @access  Public (but protected by a secret key)
exports.registerAdmin = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            firstName,
            lastName,
            adminSecret // Key bí mật để đăng ký admin
        } = req.body;

        // --- **Validation Input cơ bản** ---
        if (!username || !email || !password || !firstName || !lastName || !adminSecret) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin: username, email, password, tên, họ và mã bí mật admin.'
            });
        }

        // --- **Kiểm tra Admin Secret Key** ---
        if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Mã bí mật admin không đúng.'
            });
        }

        // Kiểm tra xem email hoặc username đã tồn tại chưa
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            let message = '';
            if (existingUser.email === email) message = 'Email đã tồn tại.';
            if (existingUser.username === username) message += (message ? ' Username cũng đã tồn tại.' : 'Username đã tồn tại.');
            return res.status(400).json({ success: false, message: message.trim() });
        }

        // --- **Hashing Mật khẩu** ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- **Tạo Admin User mới** ---
        const newAdmin = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: 'admin' // Gán vai trò là 'admin'
            // phone có thể để trống hoặc thêm vào nếu muốn
        });

        // --- **Phản hồi thành công** ---
        // Không trả về token ở đây, admin sẽ đăng nhập sau khi tài khoản được tạo
        res.status(201).json({
            success: true,
            message: `Admin user '${newAdmin.username}' registered successfully! Please login.`,
            // data: { userId: newAdmin._id, email: newAdmin.email } // Có thể trả về một số thông tin nếu muốn
        });

    } catch (error) {
        console.error('!!! CATCH BLOCK - Error during admin registration:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        res.status(500).json({ success: false, message: 'Lỗi Server khi đăng ký admin' });
    }
};