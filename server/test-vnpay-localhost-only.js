const crypto = require('crypto');
const moment = require('moment');
const querystring = require('qs');

// ✅ LOCALHOST ONLY TEST - NO TUNNEL NEEDED
const vnpayConfig = {
    tmnCode: 'KP8TH6X1',
    hashSecret: 'F4RW2ALGSECLO0HUVEMVNBCJ4SRD8LKJ', 
    url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: 'http://localhost:3001/api/orders/payment/callback/vnpay', // LOCALHOST ONLY
    version: '2.1.0'
};

function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
        sorted[key] = obj[key];
    });
    return sorted;
}

console.log('🧪 Testing VNPay Signature Generation (LOCALHOST ONLY)');
console.log('Purpose: Check if our signature method is correct');
console.log('='.repeat(70));

// Test data
const amount = 21.49; // 21.49 million VND
const amountInVND = Math.round(amount * 1000000); // 21,490,000 VND
const orderNumber = 'ORD' + Date.now();
const createDate = moment().format('YYYYMMDDHHmmss');

console.log('📊 Test Parameters:');
console.log(`Amount (millions): ${amount}`);
console.log(`Amount (VND): ${amountInVND}`);
console.log(`Order Number: ${orderNumber}`);
console.log(`Create Date: ${createDate}`);
console.log('='.repeat(70));

// Build VNPay params
let vnp_Params = {
    'vnp_Version': vnpayConfig.version,
    'vnp_Command': 'pay',
    'vnp_TmnCode': vnpayConfig.tmnCode,
    'vnp_Locale': 'vn',
    'vnp_CurrCode': 'VND',
    'vnp_TxnRef': orderNumber,
    'vnp_OrderInfo': `Thanh toan cho don hang ${orderNumber}`,
    'vnp_OrderType': 'other',
    'vnp_Amount': amountInVND,
    'vnp_ReturnUrl': vnpayConfig.returnUrl,
    'vnp_IpAddr': '127.0.0.1',
    'vnp_CreateDate': createDate
};

// Sort params alphabetically
vnp_Params = sortObject(vnp_Params);

console.log('📋 Sorted Parameters:');
Object.keys(vnp_Params).forEach(key => {
    console.log(`${key}: ${vnp_Params[key]}`);
});
console.log('='.repeat(70));

// Method 1: querystring.stringify (như dự án cũ)
const signData1 = querystring.stringify(vnp_Params, { encode: false });
const signature1 = crypto
    .createHmac('sha512', vnpayConfig.hashSecret)
    .update(Buffer.from(signData1, 'utf-8'))
    .digest('hex');

console.log('🔑 Method 1: querystring.stringify (OLD PROJECT METHOD)');
console.log('Sign Data:', signData1);
console.log('Signature:', signature1);
console.log('='.repeat(70));

// Method 2: Manual build (method cũ)
const signData2 = Object.keys(vnp_Params)
    .map(key => `${key}=${vnp_Params[key]}`)
    .join('&');
const signature2 = crypto
    .createHmac('sha512', vnpayConfig.hashSecret)
    .update(Buffer.from(signData2, 'utf-8'))
    .digest('hex');

console.log('🔧 Method 2: Manual build (PREVIOUS METHOD)');
console.log('Sign Data:', signData2);
console.log('Signature:', signature2);
console.log('='.repeat(70));

// Add signature and build final URL for Method 1
vnp_Params['vnp_SecureHash'] = signature1;
const finalUrl = vnpayConfig.url + '?' + querystring.stringify(vnp_Params, { encode: true });

console.log('🎯 FINAL PAYMENT URL (Method 1):');
console.log(finalUrl);
console.log('='.repeat(70));

console.log('📊 COMPARISON:');
console.log(`Method 1 (querystring): ${signature1}`);
console.log(`Method 2 (manual): ${signature2}`);
console.log(`Are they same? ${signature1 === signature2 ? '✅ YES' : '❌ NO'}`);
console.log('='.repeat(70));

if (signature1 !== signature2) {
    console.log('🔍 ANALYZING DIFFERENCES:');
    console.log('Sign Data 1:', signData1);
    console.log('Sign Data 2:', signData2);
    console.log('Difference found! This explains the signature mismatch.');
} else {
    console.log('✅ Both methods produce same signature!');
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Try the payment URL above in browser');
console.log('2. If no Error 70, our signature method is correct');
console.log('3. If still Error 70, check VNPay configuration'); 