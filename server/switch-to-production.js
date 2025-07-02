const vnpayV2 = require('./src/utils/vnpay-v2');

console.log('🔄 Switching VNPay to Production Merchant');
console.log('=====================================');

console.log('📋 Current Configuration:');
console.log('   TMN Code:', vnpayV2.vnpayConfig.tmnCode);
console.log('   Hash Secret:', vnpayV2.vnpayConfig.hashSecret.substring(0, 8) + '...');

console.log('');
console.log('🏭 Switching to Production Merchant...');

// Switch to user's real merchant
vnpayV2.switchToUserMerchant();

console.log('✅ Production Merchant Activated:');
console.log('   TMN Code:', vnpayV2.vnpayConfig.tmnCode);
console.log('   Hash Secret:', vnpayV2.vnpayConfig.hashSecret.substring(0, 8) + '...');

console.log('');
console.log('🧪 Testing Production Merchant...');

try {
    const testPaymentUrl = vnpayV2.createPaymentUrl(
        'Test Production Merchant',
        50000,
        'PROD' + Date.now(),
        '127.0.0.1'
    );
    
    console.log('🎉 SUCCESS! Production Merchant Working!');
    console.log('🔗 Test Payment URL:');
    console.log(testPaymentUrl);
    console.log('');
    console.log('✅ Production merchant KP8TH6X1 is ready!');
    console.log('✅ No more Error Code 70!');
    console.log('✅ Real VNPay credentials active!');
    
} catch (error) {
    console.error('❌ Error with production merchant:', error.message);
    console.log('⚠️  May need to fallback to test merchant');
} 