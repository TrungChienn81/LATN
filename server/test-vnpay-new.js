const { createPaymentUrl, verifySignature, vnpayConfig } = require('./src/utils/vnpay-v2');

console.log('🧪 Testing VNPay with NEW Configuration');
console.log('=====================================');

// Display configuration
console.log('📋 VNPay Configuration:');
console.log(`   - TMN Code: ${vnpayConfig.tmnCode}`);
console.log(`   - Hash Secret: ${vnpayConfig.hashSecret.substring(0, 8)}...`);
console.log(`   - URL: ${vnpayConfig.url}`);
console.log(`   - Return URL: ${vnpayConfig.returnUrl}`);
console.log(`   - Notify URL: ${vnpayConfig.notifyUrl}`);
console.log('');

// Test data
const testData = {
    orderInfo: 'Thanh toan don hang test KP8TH6X1',
    amount: 100000, // 100,000 VND
    orderNumber: 'ORDER' + Date.now(),
    ipAddr: '127.0.0.1',
    locale: 'vn'
};

console.log('📦 Test Order Data:');
console.log(`   - Order Info: ${testData.orderInfo}`);
console.log(`   - Amount: ${testData.amount} VND`);
console.log(`   - Order Number: ${testData.orderNumber}`);
console.log(`   - IP Address: ${testData.ipAddr}`);
console.log('');

try {
    // Create payment URL
    console.log('🚀 Creating Payment URL...');
    const paymentUrl = createPaymentUrl(
        testData.orderInfo,
        testData.amount,
        testData.orderNumber,
        testData.ipAddr,
        testData.locale
    );

    console.log('');
    console.log('✅ SUCCESS! Payment URL created:');
    console.log('─────────────────────────────────');
    console.log(paymentUrl);
    console.log('─────────────────────────────────');
    console.log('');

    // Parse URL to test verification
    const url = new URL(paymentUrl);
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    console.log('🔍 Testing Signature Verification...');
    const isValid = verifySignature(params);
    
    if (isValid) {
        console.log('✅ Signature verification: PASSED');
    } else {
        console.log('❌ Signature verification: FAILED');
    }

    console.log('');
    console.log('📝 Instructions:');
    console.log('1. Copy the payment URL above');
    console.log('2. Open it in your browser');
    console.log('3. Complete the payment on VNPay sandbox');
    console.log('4. Check if you are redirected back to your frontend');
    console.log('');
    console.log('💡 Expected result: No Error Code 70 or 72!');

} catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
}

console.log('');
console.log('🏁 Test completed. Check results above.'); 