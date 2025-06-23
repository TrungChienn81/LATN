const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Brand = require('./src/models/Brand');
const Category = require('./src/models/Category');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luantotnghiep', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function clearDatabase() {
    try {
        console.log('🗑️ Clearing database...');
        
        await Product.deleteMany({});
        console.log('✅ Cleared Products');
        
        await Brand.deleteMany({});
        console.log('✅ Cleared Brands');
        
        await Category.deleteMany({});
        console.log('✅ Cleared Categories');
        
        console.log('🎉 Database cleared successfully!');
        
    } catch (error) {
        console.error('❌ Error clearing database:', error);
    } finally {
        mongoose.connection.close();
    }
}

clearDatabase(); 