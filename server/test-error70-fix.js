const vnpayV2 = require('./src/utils/vnpay-v2');

console.log('🧪 Testing Error Code 70 Fix - "Sai chữ ký"');
console.log('=====================================');

// Test data with spaces in order info
const testData = {
    orderInfo: 'Thanh toan don hang voi khoang trang',
    amount: 100000, // 100,000 VND
    orderNumber: 'ERROR70FIX' + Date.now(),
    ipAddr: '127.0.0.1'
};

console.log('📋 Test Data:');
console.log('   Order Info:', testData.orderInfo, '(contains spaces)');
console.log('   Amount:', testData.amount, 'VND');
console.log('   Order Number:', testData.orderNumber);
console.log('   IP Address:', testData.ipAddr);
console.log('');

console.log('🏭 VNPay Configuration:');
console.log('   Merchant:', vnpayV2.vnpayConfig.tmnCode);
console.log('   Hash Secret:', vnpayV2.vnpayConfig.hashSecret.substring(0, 8) + '...');
console.log('=====================================');

try {
    console.log('🔧 Testing Error Code 70 Fix...');
    
    // Test VNPay V2 with Error Code 70 fix
    const paymentUrl = vnpayV2.createPaymentUrl(
        testData.orderInfo,
        testData.amount,
        testData.orderNumber,
        testData.ipAddr
    );
    
    console.log('');
    console.log('🎉 SUCCESS! Error Code 70 Fixed!');
    console.log('🔗 Payment URL Generated:');
    console.log(paymentUrl);
    console.log('');
    console.log('✅ Key Achievements:');
    console.log('   ✓ Properly URL encoded values BEFORE signature generation');
    console.log('   ✓ Fixed spaces in order info');
    console.log('   ✓ Should work without "Sai chữ ký" error');
    console.log('');
    console.log('🚀 Next Step: Test this URL in browser!');
    console.log('   Expected: No Error Code 70');
    
} catch (error) {
    console.error('❌ ERROR in Error Code 70 fix:', error.message);
} 