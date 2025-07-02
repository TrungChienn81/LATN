// Test script để kiểm tra phương pháp mới trong việc tạo signature VNPay
// Sử dụng querystring.stringify thay vì tự build string

// Set environment variables for test
process.env.VNP_TMN_CODE = 'KP8TH6X1';
process.env.VNP_HASH_SECRET = 'F4RW2ALGSECLO0HUVEMVNBCJ4SRD8LKJ';
process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
process.env.VNP_RETURN_URL = 'https://silver-birds-laugh.loca.lt/api/orders/vnpay_return';

// Import VNPay module
const { createPaymentUrl, verifyReturn } = require('./src/utils/vnpay');

console.log('🧪 Testing VNPay FIXED V2 - Querystring Method');
console.log('=============================================');

console.log('📋 Configuration:');
console.log('  TMN Code:', process.env.VNP_TMN_CODE);
console.log('  Hash Secret:', process.env.VNP_HASH_SECRET.substring(0, 8) + '...');
console.log('  URL:', process.env.VNP_URL);
console.log('  Return URL:', process.env.VNP_RETURN_URL);
console.log('');

// Test data
const testOrder = {
    orderInfo: 'Thanh toan don hang TEST SIGNATURE FIX V2',
    amount: 119.98, // Same amount as in log
    orderId: 'TEST' + Date.now(),
    ipAddr: '127.0.0.1'
};

console.log('📦 Test Order:');
console.log('  Order Info:', testOrder.orderInfo);
console.log('  Amount:', testOrder.amount, 'VND');
console.log('  Order ID:', testOrder.orderId);
console.log('  IP Address:', testOrder.ipAddr);
console.log('');

try {
    console.log('🚀 Creating payment URL with FIXED V2 signature method...');
    
    const paymentUrl = createPaymentUrl(
        testOrder.orderInfo,
        testOrder.amount,
        testOrder.orderId,
        testOrder.ipAddr
    );

    console.log('');
    console.log('✅ SUCCESS! Payment URL created:');
    console.log('─'.repeat(80));
    console.log(paymentUrl);
    console.log('─'.repeat(80));
    console.log('');

    // Extract and verify signature
    const url = new URL(paymentUrl);
    const params = {};
    url.searchParams.forEach((value, key) => {
        params[key] = value;
    });

    console.log('🔍 Verifying signature...');
    const isValid = verifyReturn(params);
    
    if (isValid) {
        console.log('✅ Signature verification: PASSED');
        console.log('');
        console.log('🎉 SIGNATURE FIX V2 SUCCESSFUL!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('1. Copy the URL above');
        console.log('2. Open it in browser');
        console.log('3. Should NOT show "Sai chữ ký" error');
        console.log('4. Complete test payment');
    } else {
        console.log('❌ Signature verification: FAILED');
        console.log('⚠️  Need to investigate further...');
    }

} catch (error) {
    console.error('❌ ERROR creating payment URL:', error.message);
    console.error('Stack:', error.stack);
}

console.log('');
console.log('�� Test completed!'); 