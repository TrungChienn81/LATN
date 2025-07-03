const crypto = require('crypto');
const moment = require('moment');
const querystring = require('qs');

/**
 * VNPay Configuration
 * Sử dụng biến môi trường để dễ dàng thay đổi cấu hình
 * VNP_TMN_CODE: Mã đơn vị merchant đăng ký với VNPay
 * VNP_HASH_SECRET: Chuỗi bí mật để tạo chữ ký
 * VNP_URL: URL cổng thanh toán VNPay
 * VNP_RETURN_URL: URL callback khi thanh toán hoàn tất
 */
const vnpayConfig = {
    // Sử dụng các giá trị từ biến môi trường
    tmnCode: process.env.VNP_TMN_CODE,
    hashSecret: process.env.VNP_HASH_SECRET,
    url: process.env.VNP_URL,
    returnUrl: process.env.VNP_RETURN_URL,
    frontendReturnUrl: process.env.FRONTEND_RETURN_URL || 'http://localhost:5173/user/orders',
    hashAlgorithm: 'SHA512', // Thêm thuật toán băm rõ ràng
    version: '2.1.0'
};

/**
 * Sort object by key
 */
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
        sorted[key] = obj[key];
    });
    return sorted;
}

/**
 * Create VNPay payment URL (FIXED with querystring method)
 */
function createPaymentUrl(orderInfo, amount, orderNumber, ipAddr, locale = 'vn') {
    console.log('🚀 Creating VNPay Payment URL (QUERYSTRING METHOD)...');
    console.log('Original amount (in millions VND):', amount);
    
    // Convert from millions VND to VND
    const amountInVND = Math.round(amount * 1000000);
    console.log('Amount in VND:', amountInVND);
    
    const createDate = moment().format('YYYYMMDDHHmmss');
    
    // Build VNPay params
    let vnp_Params = {
        'vnp_Version': vnpayConfig.version,
        'vnp_Command': 'pay',
        'vnp_TmnCode': vnpayConfig.tmnCode,
        'vnp_Locale': locale,
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': orderNumber,
        'vnp_OrderInfo': orderInfo,
        'vnp_OrderType': 'other',
        'vnp_Amount': amountInVND, // VND is already the smallest unit
        'vnp_ReturnUrl': vnpayConfig.returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate
    };
    
    // Sort params alphabetically (CRITICAL for VNPay)
    vnp_Params = sortObject(vnp_Params);
    
    // ✅ FIXED: Use querystring.stringify method (like old project)
    const signData = querystring.stringify(vnp_Params, { encode: false });
    console.log('Sign data (querystring):', signData);
    
    // Generate signature using HMAC-SHA512 with proper encoding
    // Sửa: Không sử dụng Buffer.from vì VNPay yêu cầu chuỗi trực tiếp
    const signature = crypto
        .createHmac('sha512', vnpayConfig.hashSecret)
        .update(signData)
        .digest('hex');
    
    console.log('Generated signature:', signature);
    
    // Add signature to params
    vnp_Params['vnp_SecureHash'] = signature;
    
    // Build final URL with URL encoding
    const finalUrl = vnpayConfig.url + '?' + querystring.stringify(vnp_Params, { encode: true });
    
    console.log('✅ Payment URL created successfully');
    return finalUrl;
}

/**
 * Verify VNPay signature (FIXED with querystring method)
 */
function verifySignature(vnp_Params) {
    console.log('🔍 Verifying VNPay signature (QUERYSTRING METHOD)...');
    
    const secureHash = vnp_Params['vnp_SecureHash'];
    
    // Remove hash params (make a copy to avoid mutating original)
    const signData = {};
    Object.keys(vnp_Params).forEach(key => {
        if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
            signData[key] = vnp_Params[key];
        }
    });
    
    // Sort params
    const sortedSignData = sortObject(signData);
    
    // ✅ FIXED: Use querystring.stringify method (same as when creating)
    const verifyString = querystring.stringify(sortedSignData, { encode: false });
    console.log('Verify string (querystring):', verifyString);
    
    // Generate signature for verification
    const signature = crypto
        .createHmac('sha512', vnpayConfig.hashSecret)
        .update(Buffer.from(verifyString, 'utf-8'))
        .digest('hex');
    
    console.log('Received signature:', secureHash);
    console.log('Computed signature:', signature);
    
    const isValid = secureHash === signature;
    console.log('Signature valid:', isValid);
    
    return isValid;
}

/**
 * Generate error fix HTML for VNPay errors
 */
function generateErrorFixHTML(errorCode, redirectUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>VNPay Error Fix</title>
    <meta charset="UTF-8">
    <script>
        // Auto redirect after 1 second
        setTimeout(function() {
            window.location.href = '${redirectUrl}?error=${errorCode}';
        }, 1000);
    </script>
</head>
<body>
    <h3>Đang xử lý lỗi VNPay (Error Code: ${errorCode})...</h3>
    <p>Đang chuyển hướng về trang thanh toán...</p>
</body>
</html>
    `;
}

module.exports = {
    vnpayConfig,
    createPaymentUrl,
    verifySignature,
    generateErrorFixHTML
}; 