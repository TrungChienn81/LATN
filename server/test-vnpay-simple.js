const { createPaymentUrl } = require('./src/utils/vnpay-v2');

// Test data
const orderInfo = 'Thanh toan don hang test';
const amount = 100000; // 100k VND
const orderNumber = 'TEST' + Date.now();
const ipAddr = '127.0.0.1';

console.log('Testing VNPay V2...');
console.log('Order:', orderNumber);
console.log('Amount:', amount);

try {
    const paymentUrl = createPaymentUrl(orderInfo, amount, orderNumber, ipAddr);
    console.log('\n✅ SUCCESS! Copy this URL to test:');
    console.log('\n' + paymentUrl);
} catch (error) {
    console.error('❌ ERROR:', error.message);
} 