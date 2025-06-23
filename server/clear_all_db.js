const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Brand = require('./src/models/Brand');
const Category = require('./src/models/Category');
const Shop = require('./src/models/Shop');
const User = require('./src/models/User');

async function clearAllDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luantotnghiep', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🗑️ Clearing ALL database collections...');
        
        // Clear all collections
        await Product.deleteMany({});
        console.log('✅ Cleared all Products');
        
        await Brand.deleteMany({});
        console.log('✅ Cleared all Brands');
        
        await Category.deleteMany({});
        console.log('✅ Cleared all Categories');
        
        await Shop.deleteMany({});
        console.log('✅ Cleared all Shops');
        
        await User.deleteMany({});
        console.log('✅ Cleared all Users');
        
        console.log('🎉 Database completely cleared!');
        
    } catch (error) {
        console.error('❌ Error clearing database:', error);
    } finally {
        mongoose.connection.close();
    }
}

clearAllDatabase(); 