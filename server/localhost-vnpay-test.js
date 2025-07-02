const vnpayV2 = require('./src/utils/vnpay-v2');

console.log('🧪 Testing VNPay LOCALHOST DIRECT MODE');
console.log('=====================================');

// Test data for localhost mode
const testData = {
    orderInfo: 'Thanh toan don hang test localhost',
    amount: 100000, // 100,000 VND
    orderNumber: 'LOCALHOST' + Date.now(),
    ipAddr: '127.0.0.1'
};

console.log('📋 Test Data:');
console.log('   Order Info:', testData.orderInfo);
console.log('   Amount:', testData.amount, 'VND');
console.log('   Order Number:', testData.orderNumber);
console.log('   IP Address:', testData.ipAddr);
console.log('');

console.log('🏭 VNPay Configuration:');
console.log('   Merchant:', vnpayV2.vnpayConfig.tmnCode);
console.log('   Hash Secret:', vnpayV2.vnpayConfig.hashSecret.substring(0, 8) + '...');
console.log('   Backend Return URL:', vnpayV2.vnpayConfig.returnUrl);
console.log('   Frontend Redirect:', vnpayV2.vnpayConfig.frontendReturnUrl);
console.log('=====================================');

try {
    console.log('🔧 Testing LOCALHOST DIRECT MODE...');
    
    // Test VNPay V2 with localhost direct mode
    const paymentUrl = vnpayV2.createPaymentUrlWithRetry(
        testData.orderInfo,
        testData.amount,
        testData.orderNumber,
        testData.ipAddr
    );
    
    console.log('');
    console.log('🎉 SUCCESS! LOCALHOST DIRECT MODE Works!');
    console.log('🔗 Payment URL Generated:');
    console.log(paymentUrl);
    console.log('');
    console.log('✅ Key Achievements:');
    console.log('   ✓ Using backend return URL:', vnpayV2.vnpayConfig.returnUrl);
    console.log('   ✓ Will redirect to frontend:', vnpayV2.vnpayConfig.frontendReturnUrl);
    console.log('   ✓ Should work with localhost without tunneling');
    console.log('');
    console.log('🚀 Next Step: Test this URL in browser!');
    console.log('   Expected: No Error Code 70 or 72');
    
} catch (error) {
    console.error('❌ ERROR in LOCALHOST DIRECT MODE test:', error.message);
} 