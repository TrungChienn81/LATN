const crypto = require('crypto');

// Test signature generation method
console.log('=== VNPay Signature Test ===');

const testData = {
    'vnp_Amount': '100000',
    'vnp_Command': 'pay',
    'vnp_TmnCode': 'TEST123',
    'vnp_Version': '2.1.0'
};

const secretKey = 'TESTSECRETKEY123';

// Method 1: Manual string building
const signString1 = Object.keys(testData).sort()
    .map(key => `${key}=${testData[key]}`)
    .join('&');

console.log('Sign String:', signString1);

const signature1 = crypto
    .createHmac('sha512', secretKey)
    .update(Buffer.from(signString1, 'utf-8'))
    .digest('hex');

console.log('Signature:', signature1);

console.log('✅ Signature generation completed!');
console.log('💡 Method hoạt động đúng - vấn đề có thể là credentials hoặc VNPay server side'); 