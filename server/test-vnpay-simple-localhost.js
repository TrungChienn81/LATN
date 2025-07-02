const crypto = require('crypto');
const moment = require('moment');

console.log('🔍 VNPay Signature Test - Simple Version');
console.log('=' .repeat(50));

// Thông tin test cơ bản (có thể là demo credentials)
const vnpayConfig = {
    tmnCode: 'DEMOMERCHANT01',
    hashSecret: 'SANDBOXSECRETKEY123456',
    url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: 'http://localhost:3001/vnpay-return',
    version: '2.1.0'
};

function createTestPayment() {
    console.log('📝 Tạo test payment với thông tin demo...');
    
    const amount = 100000; // 100,000 VND
    const orderInfo = 'Test payment for debugging';
    const orderNumber = 'TEST' + Date.now();
    const createDate = moment().format('YYYYMMDDHHmmss');
    
    // Tạo VNPay params
    const vnp_Params = {
        'vnp_Version': vnpayConfig.version,
        'vnp_Command': 'pay',
        'vnp_TmnCode': vnpayConfig.tmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': orderNumber,
        'vnp_OrderInfo': orderInfo,
        'vnp_OrderType': 'other',
        'vnp_Amount': amount,
        'vnp_ReturnUrl': vnpayConfig.returnUrl,
        'vnp_IpAddr': '127.0.0.1',
        'vnp_CreateDate': createDate
    };
    
    console.log('🔧 VNPay Parameters:');
    console.log(JSON.stringify(vnp_Params, null, 2));
    
    // Sort params
    const sortedParams = {};
    Object.keys(vnp_Params).sort().forEach(key => {
        sortedParams[key] = vnp_Params[key];
    });
    
    console.log('📋 Sorted Parameters:');
    console.log(JSON.stringify(sortedParams, null, 2));
    
    // Tạo sign string
    const signString = Object.keys(sortedParams)
        .map(key => `${key}=${sortedParams[key]}`)
        .join('&');
    
    console.log('🔤 Sign String:');
    console.log(signString);
    
    // Tạo signature
    const signature = crypto
        .createHmac('sha512', vnpayConfig.hashSecret)
        .update(Buffer.from(signString, 'utf-8'))
        .digest('hex');
    
    console.log('🔐 Generated Signature:');
    console.log(signature);
    
    // Build final URL
    sortedParams['vnp_SecureHash'] = signature;
    const queryString = Object.keys(sortedParams)
        .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
        .join('&');
        
    const finalUrl = vnpayConfig.url + '?' + queryString;
    
    console.log('=' .repeat(50));
    console.log('🎯 FINAL TEST URL:');
    console.log(finalUrl);
    console.log('=' .repeat(50));
    
    console.log('💡 LƯU Ý:');
    console.log('- URL này sử dụng thông tin demo, có thể không hoạt động trên VNPay thật');
    console.log('- Đây chỉ là để test signature generation method');
    console.log('- Signature được tạo thành công nghĩa là method đúng');
    
    return finalUrl;
}

// Chạy test
createTestPayment(); 