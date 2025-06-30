// src/controllers/auth.controller.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util'); //Để dùng async/await với jwt.verify

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

        console.log('🔍 Login attempt for email:', email);
        console.log('🔍 Password provided:', password ? 'YES' : 'NO');

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng cung cấp email và mật khẩu.' 
            });
        }

        const user = await User.findOne({ email }).select('+password');
        console.log('🔍 User found:', user ? 'YES' : 'NO');
        
        if (!user) {
            console.log('❌ User not found with email:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Email hoặc mật khẩu không đúng.' 
            });
        }

        console.log('🔍 Stored password hash:', user.password ? 'EXISTS' : 'MISSING');
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('🔍 Password comparison result:', passwordMatch);

        if (!passwordMatch) {
            console.log('❌ Password does not match for user:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Email hoặc mật khẩu không đúng.' 
            });
        }

        console.log('✅ Login successful for user:', email);

        const payload = {
            id: user._id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
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

// Middleware để bảo vệ routes
exports.protect = async (req, res, next) => {
  try {
    // 1) Lấy token và kiểm tra xem nó có tồn tại không
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Hoặc nếu token được gửi qua cookie (tùy theo cách bạn thiết kế API)
    // else if (req.cookies.jwt) {
    //   token = req.cookies.jwt;
    // }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để có quyền truy cập.',
      });
    }

    // 2) Xác thực token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Kiểm tra xem người dùng có còn tồn tại không
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng sở hữu token này không còn tồn tại.',
      });
    }

    // 4) Kiểm tra xem người dùng có đổi mật khẩu sau khi token được cấp không
    // (Cần thêm trường passwordChangedAt vào User model nếu muốn dùng tính năng này)
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Người dùng gần đây đã thay đổi mật khẩu. Vui lòng đăng nhập lại.',
    //   });
    // }

    // CẤP QUYỀN TRUY CẬP VÀO ROUTE ĐƯỢC BẢO VỆ
    req.user = currentUser; // Gắn user vào request để các middleware sau có thể sử dụng
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ. Vui lòng đăng nhập lại.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token đã hết hạn. Vui lòng đăng nhập lại.' });
    } 
    console.error('Protect middleware error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xác thực người dùng.' });
  }
};

// Middleware để giới hạn quyền truy cập dựa trên vai trò (role)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles là một mảng, ví dụ: ['admin', 'lead-guide']. req.user đã được gán từ middleware 'protect'
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này.',
      });
    }
    next();
  };
};
