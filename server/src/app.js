require('dotenv').config(); // Nạp biến môi trường từ .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Hàm để tìm cổng trống nếu cổng mặc định đã bị sử dụng
const findAvailablePort = (startPort) => {
    return new Promise((resolve) => {
        const server = require('http').createServer();
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        server.on('error', () => {
            resolve(findAvailablePort(startPort + 1));
        });
    });
};

// Middleware cơ bản
app.use(cors()); // Cho phép truy cập từ tên miền khác (frontend)
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body

// Phục vụ tệp tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Kết nối MongoDB với các tùy chọn được hỗ trợ trong phiên bản mới
mongoose.connect('mongodb+srv://TrungChienn:Chien2004@latn.af6hwio.mongodb.net/LATNShop08?retryWrites=true&w=majority&appName=LATN', {
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
    // ---- Các Routes API sẽ được thêm vào đây ----
    const authRoutes = require('./routes/auth.routes'); // Import auth routes
    const productRoutes = require('./routes/product.routes'); // Import product routes
    const shopRoutes = require('./routes/shop.routes'); 
    const cartRoutes = require('./routes/cart.routes');
    const orderRoutes = require('./routes/order.routes'); 
    const userRoutes = require('./routes/user.routes'); // <<< Import user routes
    const categoryRoutes = require('./routes/category.routes');
    const brandRoutes = require('./routes/brand.routes');
    const reviewRoutes = require('./routes/review.routes'); // Import review routes
    const userInteractionRoutes = require('./routes/userInteraction.routes'); // Import user interaction routes
    const aiRoutes = require('./routes/ai.routes'); // Import AI routes
    const chatRoutes = require('./routes/chat.routes'); // Import chat routes
    const mockChatRoutes = require('./routes/mockChat.routes'); // Import mock chat routes


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
    app.use('/api/chat', mockChatRoutes); // Gắn mock chat routes vào /api/chat (thay thế chatRoutes)
    // app.use('/api/chat', chatRoutes); // Uncomment this and comment above line when you have OpenAI API key
    
    // Khởi động server với cổng tự động tìm nếu cổng mặc định bị sử dụng
    (async () => {
        try {
            const availablePort = await findAvailablePort(PORT);
            app.listen(availablePort, () => {
                console.log(`Server is running on port ${availablePort}`);
            });
        } catch (error) {
            console.error('Failed to start server:', error);
        }
    })();