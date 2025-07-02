// Set environment variables for testing
process.env.VNP_TMN_CODE = 'KP8TH6X1';
process.env.VNP_HASH_SECRET = 'F4RW2ALGSECLO0HUVEMVNBCJ4SRD8LKJ';
process.env.VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
process.env.VNP_RETURN_URL = 'http://localhost:3001/api/orders/payment/callback/vnpay';

const { createPaymentUrl } = require('./src/utils/vnpay');

console.log('🧪 Testing VNPay with LOCALHOST');
console.log('================================');

// Test data
const testData = {
    orderInfo: 'Thanh toan don hang test',
    amount: 100000, // 100,000 VND
    orderNumber: 'TEST' + Date.now(),
    ipAddr: '127.0.0.1'
};

console.log('📋 Test Data:');
console.log('   Order Info:', testData.orderInfo);
console.log('   Amount:', testData.amount, 'VND');
console.log('   Order Number:', testData.orderNumber);
console.log('   IP Address:', testData.ipAddr);
console.log('');

console.log('🔧 VNPay Configuration:');
console.log('   TMN Code:', process.env.VNP_TMN_CODE);
console.log('   Return URL:', process.env.VNP_RETURN_URL);
console.log('================================\n');

try {
    const paymentUrl = createPaymentUrl(
        testData.orderInfo,
        testData.amount,
        testData.orderNumber,
        testData.ipAddr
    );
    
    console.log('\n✅ SUCCESS! Payment URL created:');
    console.log(paymentUrl);
    console.log('\n📌 Copy this URL and test in browser');
    console.log('📌 Expected: Should redirect to VNPay payment page without Error 70');
    
} catch (error) {
    console.error('\n❌ ERROR:', error.message);
} 