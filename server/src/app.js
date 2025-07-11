// Load environment variables
require('dotenv').config();

// Set environment variables manually as fallback
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-here-change-this-in-production';
}
if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb+srv://TrungChienn:Chien123@latn.af6hwio.mongodb.net/LATNShop08?retryWrites=true&w=majority&appName=LATN';
}
if (!process.env.PORT) {
    process.env.PORT = '3001';
}

// ✅ VNPay Configuration - FIXED
if (!process.env.VNP_TMN_CODE) {
    process.env.VNP_TMN_CODE = 'KP8TH6X1';
}
if (!process.env.VNP_HASH_SECRET) {
    process.env.VNP_HASH_SECRET = 'F4RW2ALGSECLO0HUVEMVNBCJ4SRD8LKJ';
}
if (!process.env.VNP_URL) {
    process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
}
if (!process.env.VNP_RETURN_URL) {
    process.env.VNP_RETURN_URL = 'http://localhost:3001/api/orders/payment/callback/vnpay';
}

// ✅ PayPal Configuration - TEMPORARY WORKING DEMO CREDENTIALS
// TODO: Replace with your working credentials when app is ready
if (!process.env.PAYPAL_CLIENT_ID) {
    // Using PayPal public demo credentials that definitely work
    process.env.PAYPAL_CLIENT_ID = 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';
}
if (!process.env.PAYPAL_CLIENT_SECRET) {
    process.env.PAYPAL_CLIENT_SECRET = 'EGnHDxD_qRPdaLdZz8iCr8N7_MzF-YHPTkjs6NKYQvQSBngp4PTTVWkPZRbL40LNfE7M';
}
if (!process.env.PAYPAL_MODE) {
    process.env.PAYPAL_MODE = 'sandbox';
}
if (!process.env.PAYPAL_SUCCESS_URL) {
    process.env.PAYPAL_SUCCESS_URL = 'http://localhost:3001/api/orders/payment/callback/paypal/success';
}
if (!process.env.PAYPAL_CANCEL_URL) {
    process.env.PAYPAL_CANCEL_URL = 'http://localhost:3001/api/orders/payment/callback/paypal/cancel';
}


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001; // Sử dụng port 3001 cố định

// Middleware cơ bản với CORS cấu hình cho latnshop.local
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'http://latnshop.local:5173',
    'https://latnshop.local:5173',
    /\.ngrok\.io$/,
    /\.ngrok-free\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-openai-api-key']
};

app.use(cors(corsOptions));

// Enhanced Security headers with VNPay compatibility
app.use((req, res, next) => {
  // Fixed Content-Security-Policy for VNPay compatibility
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com https://sandbox.vnpayment.vn",
    "img-src 'self' data: blob: https: http: product.hstatic.net https://sandbox.vnpayment.vn",
    "font-src 'self' fonts.gstatic.com https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: https://sandbox.vnpayment.vn",
    "connect-src 'self' https: http: ws: wss: https://sandbox.vnpayment.vn",
    "frame-src 'self' https: https://sandbox.vnpayment.vn",
    "form-action 'self' https://sandbox.vnpayment.vn",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '));
  
  // Simplified Permissions-Policy
  res.setHeader('Permissions-Policy', [
    'browsing-topics=()',
    'join-ad-interest-group=()',
    'run-ad-auction=()'
  ].join(', '));
  
  // Essential security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// Phục vụ tệp tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ROOT ROUTE - Fix cho VNPay và general access
app.get('/', (req, res) => {
    res.json({
        message: 'LATN Shop API Server - Ready for Production! 🚀',
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            products: '/api/products',
            auth: '/api/auth',
            orders: '/api/orders',
            vnpay_return: '/vnpay-return',
            api_docs: '/api'
        },
        tunnel_status: 'Active via LocalTunnel',
        ready_for_vnpay: true
    });
});

// Enhanced VNPay Error Handling
app.get('/paymentv2/Payment/Error.html', (req, res) => {
    console.log('📥 VNPay Error.html intercepted');
    console.log('Query params:', req.query);
    
    try {
        const vnpayFixed = require('./utils/vnpay-v2-fixed');
        const errorCode = req.query.code || '99';
        
        console.log('⚠️ VNPay error detected, code:', errorCode);
        
        // Generate enhanced error fix HTML
        const fixedHtml = vnpayFixed.generateErrorFixHTML(
            errorCode,
            vnpayFixed.vnpayConfig.frontendReturnUrl
        );
        return res.send(fixedHtml);
        
    } catch (error) {
        console.error('❌ VNPay Error handling failed:', error);
        const fallbackUrl = 'http://localhost:5173/demo-payment?error=' + (req.query.code || '99');
        res.redirect(fallbackUrl);
    }
});

// Additional VNPay error routes
app.get('/payment/error', (req, res) => {
    const errorCode = req.query.code || req.query.errorCode || '99';
    console.log('🔥 VNPay payment error route hit, code:', errorCode);
    
    const vnpayFixed = require('./utils/vnpay-v2-fixed');
    const fixedHtml = vnpayFixed.generateErrorFixHTML(errorCode, vnpayFixed.vnpayConfig.frontendReturnUrl);
    return res.send(fixedHtml);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// API Info endpoint
app.get('/api', (req, res) => {
    res.json({
        api_name: 'LATN Shop API',
        version: '1.0.0',
        available_endpoints: {
            'GET /': 'Server info',
            'GET /health': 'Health check',
            'GET /api/products': 'Get all products',
            'POST /api/auth/login': 'User login',
            'POST /api/auth/register': 'User registration',
            'GET /api/orders': 'Get orders',
            'POST /vnpay-return': 'VNPay callback'
        }
    });
});

// Kết nối MongoDB với các tùy chọn được hỗ trợ trong phiên bản mới
mongoose.connect(process.env.MONGODB_URI, {
    // Tùy chọn cho Driver
    connectTimeoutMS: 30000,         // Tăng thời gian timeout kết nối lên 30 giây
    socketTimeoutMS: 45000,          // Tăng thời gian chờ socket lên 45 giây
    serverSelectionTimeoutMS: 30000, // Thời gian chờ trước khi timeout một thao tác
    maxPoolSize: 50,                 // Tăng số request đồng thời tối đa (thay thế poolSize)
    minPoolSize: 5,                  // Số kết nối tối thiểu trong pool
    heartbeatFrequencyMS: 10000,     // Tần suất hoạt động heartbeat
    retryWrites: true,               // Tự động thử lại các thao tác ghi khi mất kết nối
    // Tùy chọn ứng dụng
    appName: 'Laptop-AI-Commerce'    // Tên ứng dụng (giúp theo dõi trong logs MongoDB)
})
.then(() => console.log('MongoDB connected successfully!'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    // Log thêm các thông tin chi tiết về lỗi
    if (err.name === 'MongooseTimeoutError' || err.name === 'MongoTimeoutError') {
        console.error('Timeout khi kết nối đến MongoDB. Hãy kiểm tra:');
        console.error('1. Địa chỉ MongoDB URI có chính xác không');
        console.error('2. MongoDB server có đang chạy không');
        console.error('3. Có vấn đề về mạng hoặc tường lửa không');
    }
});

// VNPay Return URL handler - LOCALHOST DIRECT MODE
app.get('/vnpay-return', (req, res) => {
  console.log('📥 VNPay Return URL called (LOCALHOST DIRECT MODE)');
  console.log('Query params:', req.query);
  
  try {
    const vnpayV2 = require('./utils/vnpay-v2');
    const isValidSignature = vnpayV2.verifySignature(req.query);
    
    console.log('🔍 VNPay Return Signature Valid:', isValidSignature);
    
    // Add validation result to query params
    const queryParams = {
      ...req.query,
      validSignature: isValidSignature,
      success: req.query.vnp_ResponseCode === '00'
    };
    
    // Nếu có lỗi từ VNPay, xử lý đặc biệt
    if (req.query.vnp_ResponseCode !== '00') {
      console.log('⚠️ VNPay error detected:', req.query.vnp_ResponseCode);
      
      // Nếu là lỗi 70 (Sai chữ ký), thử xử lý đặc biệt
      if (req.query.vnp_ResponseCode === '70' || req.url.includes('Error.html') || req.url.includes('code=70')) {
        // Sử dụng hàm tạo HTML sửa lỗi
        const fixedHtml = vnpayV2.generateErrorFixHTML(
          req.query.vnp_ResponseCode || '70',
          vnpayV2.vnpayConfig.frontendReturnUrl
        );
        return res.send(fixedHtml);
      }
    }
    
    // Redirect to frontend with params
    const frontendUrl = vnpayV2.vnpayConfig.frontendReturnUrl;
    const queryString = new URLSearchParams(queryParams).toString();
    
    console.log('🔄 Redirecting to frontend:', frontendUrl);
    console.log('   With params:', queryParams);
    
    res.redirect(`${frontendUrl}?${queryString}`);
    
  } catch (error) {
    console.error('❌ VNPay Return Error:', error);
    res.status(500).json({ error: 'VNPay return processing failed' });
  }
});

// ---- Các Routes API sẽ được thêm vào đây ----
const authRoutes = require('./routes/auth.routes'); // Import auth routes
const productRoutes = require('./routes/product.routes'); // Import product routes
const shopRoutes = require('./routes/shop.routes'); 
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes'); 
const userRoutes = require('./routes/user.routes'); // Import user routes
const categoryRoutes = require('./routes/category.routes');
const brandRoutes = require('./routes/brand.routes');
const reviewRoutes = require('./routes/review.routes'); // Import review routes
const userInteractionRoutes = require('./routes/userInteraction.routes'); // Import user interaction routes
const aiRoutes = require('./routes/ai.routes'); // Import AI routes
const chatRoutes = require('./routes/chat.routes'); // Import chat routes
const mockChatRoutes = require('./routes/mockChat.routes'); // Import mock chat routes
const debugRoutes = require('./routes/debug.routes'); // Import debug routes

app.use('/api/auth', authRoutes); // Gắn auth routes vào đường dẫn /api/auth
app.use('/api/products', productRoutes); // Gắn product routes vào /api/products
app.use('/api/shops', shopRoutes);
app.use('/api/cart', cartRoutes); 
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes); // <<< Gắn user routes vào đường dẫn /api/users
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/reviews', reviewRoutes); // Gắn review routes vào /api/reviews
app.use('/api', userInteractionRoutes); // Gắn user interaction routes vào /api
app.use('/api/ai', aiRoutes); // Gắn AI routes vào /api/ai
// app.use('/api/chat', mockChatRoutes); // Mock AI - DISABLED 
app.use('/api/chat', chatRoutes); // Real OpenAI API - ENABLED 🚀
app.use('/api/debug', debugRoutes); // Gắn debug routes vào /api/debug - ONLY FOR DEVELOPMENT
    
// Khởi động server trên port 3001 cố định
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
