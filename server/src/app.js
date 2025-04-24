require('dotenv').config(); // Nạp biến môi trường từ .env
const express = require('express');
console.log('--- CONNECTION STRING FROM ENV:', process.env.MONGODB_URI); // <-- Thêm dòng này
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const productRoutes = require('./routes/product.routes'); // Import product routes
// Middleware cơ bản
app.use(cors()); // Cho phép truy cập từ tên miền khác (frontend)
app.use(express.json()); // Parse JSON request body

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// ---- Các Routes API sẽ được thêm vào đây ----
const authRoutes = require('./routes/auth.routes'); // Import auth routes
app.use('/api/auth', authRoutes); // Gắn auth routes vào đường dẫn /api/auth
app.use('/api/products', productRoutes); // Gắn product routes vào /api/products
// Khởi động server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});