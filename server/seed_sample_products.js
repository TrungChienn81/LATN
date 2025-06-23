const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Brand = require('./src/models/Brand');
const Category = require('./src/models/Category');
const Shop = require('./src/models/Shop');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luantotnghiep', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function seedSampleProducts() {
    try {
        // Create brands if they don't exist
        const msi = await Brand.findOneAndUpdate(
            { name: 'MSI' },
            { 
                name: 'MSI', 
                description: 'Micro-Star International',
                slug: 'msi'
            },
            { upsert: true, new: true }
        );
        
        const asus = await Brand.findOneAndUpdate(
            { name: 'ASUS' },
            { 
                name: 'ASUS', 
                description: 'ASUSTeK Computer Inc.',
                slug: 'asus'
            },
            { upsert: true, new: true }
        );
        
        const dell = await Brand.findOneAndUpdate(
            { name: 'Dell' },
            { 
                name: 'Dell', 
                description: 'Dell Technologies',
                slug: 'dell'
            },
            { upsert: true, new: true }
        );

        // Create categories if they don't exist
        const laptopCategory = await Category.findOneAndUpdate(
            { name: 'Laptop' },
            { 
                name: 'Laptop', 
                description: 'Máy tính xách tay',
                slug: 'laptop'
            },
            { upsert: true, new: true }
        );
        
        const gamingCategory = await Category.findOneAndUpdate(
            { name: 'Gaming' },
            { 
                name: 'Gaming', 
                description: 'Laptop Gaming',
                slug: 'gaming'
            },
            { upsert: true, new: true }
        );

        // Create shop if it doesn't exist
        const shop1 = await Shop.findOneAndUpdate(
            { shopName: 'Shop1' },
            { 
                shopName: 'Shop1',
                ownerId: new mongoose.Types.ObjectId(),
                isActive: true,
                description: 'Cửa hàng laptop chính thức'
            },
            { upsert: true, new: true }
        );

        // Sample products to seed
        const sampleProducts = [
            {
                name: 'Laptop MSI Alpha 15 B5EEK 203VN',
                slug: 'laptop-msi-alpha-15-b5eek-203vn',
                description: 'Laptop gaming MSI Alpha 15 B5EEK 203VN với CPU AMD Ryzen 5 5600H, VGA AMD Radeon RX 6600M, RAM 8GB, SSD 512GB, màn hình 15.6 inch FHD 144Hz. Laptop gaming hiệu suất cao cho game thủ.',
                price: 32490000,
                brand: msi._id,
                category: gamingCategory._id,
                shopId: shop1._id,
                stock: 10,
                isActive: true,
                specifications: {
                    cpu: 'AMD Ryzen 5 5600H',
                    ram: '8GB DDR4',
                    storage: '512GB SSD',
                    gpu: 'AMD Radeon RX 6600M',
                    display: '15.6 inch FHD 144Hz',
                    os: 'Windows 11 Home'
                },
                sku: 'MSI-ALPHA15-B5EEK-203VN'
            },
            {
                name: 'ASUS TUF Gaming F15 FX506HF',
                slug: 'asus-tuf-gaming-f15-fx506hf',
                description: 'Laptop gaming ASUS TUF Gaming F15 với Intel Core i5-11400H, RTX 2050, RAM 8GB, SSD 512GB. Laptop gaming tầm trung giá tốt.',
                price: 18990000,
                brand: asus._id,
                category: gamingCategory._id,
                shopId: shop1._id,
                stock: 15,
                isActive: true,
                specifications: {
                    cpu: 'Intel Core i5-11400H',
                    ram: '8GB DDR4',
                    storage: '512GB SSD',
                    gpu: 'NVIDIA GeForce RTX 2050',
                    display: '15.6 inch FHD 144Hz',
                    os: 'Windows 11 Home'
                },
                sku: 'ASUS-TUF-F15-FX506HF'
            },
            {
                name: 'Dell Inspiron 15 3520',
                slug: 'dell-inspiron-15-3520',
                description: 'Laptop Dell Inspiron 15 3520 với Intel Core i5-1235U, RAM 8GB, SSD 256GB. Laptop văn phòng, học tập giá rẻ.',
                price: 14590000,
                brand: dell._id,
                category: laptopCategory._id,
                shopId: shop1._id,
                stock: 20,
                isActive: true,
                specifications: {
                    cpu: 'Intel Core i5-1235U',
                    ram: '8GB DDR4',
                    storage: '256GB SSD',
                    gpu: 'Intel Iris Xe Graphics',
                    display: '15.6 inch FHD',
                    os: 'Windows 11 Home'
                },
                sku: 'DELL-INSPIRON-15-3520'
            },
            {
                name: 'MSI Gaming GF63 Thin 11SC',
                slug: 'msi-gaming-gf63-thin-11sc',
                description: 'Laptop gaming MSI GF63 Thin với Intel Core i5-11400H, GTX 1650, RAM 8GB, SSD 256GB. Laptop gaming mỏng nhẹ.',
                price: 16490000,
                brand: msi._id,
                category: gamingCategory._id,
                shopId: shop1._id,
                stock: 12,
                isActive: true,
                specifications: {
                    cpu: 'Intel Core i5-11400H',
                    ram: '8GB DDR4',
                    storage: '256GB SSD',
                    gpu: 'NVIDIA GeForce GTX 1650',
                    display: '15.6 inch FHD',
                    os: 'Windows 11 Home'
                },
                sku: 'MSI-GF63-THIN-11SC'
            },
            {
                name: 'ASUS VivoBook 15 X1502ZA',
                slug: 'asus-vivobook-15-x1502za',
                description: 'Laptop ASUS VivoBook 15 với Intel Core i3-1215U, RAM 4GB, SSD 256GB. Laptop học tập, văn phòng giá rẻ.',
                price: 11990000,
                brand: asus._id,
                category: laptopCategory._id,
                shopId: shop1._id,
                stock: 25,
                isActive: true,
                specifications: {
                    cpu: 'Intel Core i3-1215U',
                    ram: '4GB DDR4',
                    storage: '256GB SSD',
                    gpu: 'Intel UHD Graphics',
                    display: '15.6 inch FHD',
                    os: 'Windows 11 Home'
                },
                sku: 'ASUS-VIVOBOOK-15-X1502ZA'
            }
        ];

        // Clear existing products (optional)
        console.log('🗑️ Clearing existing products...');
        await Product.deleteMany({});

        // Insert sample products
        console.log('🌱 Seeding sample products...');
        const insertedProducts = await Product.insertMany(sampleProducts);
        
        console.log(`✅ Successfully seeded ${insertedProducts.length} products:`);
        insertedProducts.forEach(product => {
            console.log(`- ${product.name}: ${product.price.toLocaleString('vi-VN')}đ`);
        });

        console.log('\n🎉 Database seeding completed!');
        console.log('📝 Test queries you can try:');
        console.log('- "Laptop MSI Alpha 15 B5EEK 203VN giá bao nhiêu"');
        console.log('- "ASUS TUF Gaming giá"');
        console.log('- "Dell Inspiron 15"');
        console.log('- "Laptop gaming dưới 20 triệu"');
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run seeding
seedSampleProducts(); 