const crypto = require('crypto');
const moment = require('moment');
const querystring = require('qs');

/**
 * Sorts an object's properties by key in alphabetical order.
 * This is exactly how VNPay's official documentation does it.
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
 * Creates VNPay payment URL exactly following official documentation
 * @param {string} orderInfo - Order description
 * @param {number} amount - Amount in VND  
 * @param {string} orderId - Unique order ID
 * @param {string} ipAddr - Client IP address
 * @returns {string} Complete VNPay payment URL
 */
function createPaymentUrl(orderInfo, amount, orderId, ipAddr) {
    console.log('🚀 Creating VNPay Payment URL (LOCALHOST FIXED)...');
    console.log('Order:', orderId, 'Amount:', amount, 'IP:', ipAddr);

    // Get configuration from environment
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
        console.error('❌ Missing VNPay configuration in .env file');
        throw new Error('VNPay configuration incomplete');
    }

    console.log('Using TMN Code:', tmnCode);
    console.log('Return URL:', returnUrl);

    // Create date in VNPay format: YYYYMMDDHHmmss
    const createDate = moment().format('YYYYMMDDHHmmss');
    
    // Build parameters object exactly like official docs
    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': orderInfo,
        'vnp_OrderType': 'other',
        'vnp_Amount': (amount * 100).toString(), // Convert to cents and make string
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate
    };

    console.log('Raw params before sorting:', vnp_Params);

    // Sort parameters alphabetically (CRITICAL for VNPay)
    vnp_Params = sortObject(vnp_Params);
    console.log('Sorted params:', vnp_Params);

    // ✅ FIXED: Create signature string WITHOUT encoding
    // Build query string manually without encoding for signature
    const signData = Object.keys(vnp_Params)
        .map(key => `${key}=${vnp_Params[key]}`)
        .join('&');
    
    console.log('Sign data string (raw):', signData);

    // Generate signature using HMAC-SHA512
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    console.log('Generated signature:', signed);

    // Add signature to params
    vnp_Params['vnp_SecureHash'] = signed;

    // ✅ Build final payment URL with proper encoding
    // Now encode the URL for the final output
    const finalUrl = vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: true });

    console.log('✅ Final payment URL generated (LOCALHOST FIXED)');
    console.log('URL length:', finalUrl.length);
    
    return finalUrl;
}

/**
 * Verifies VNPay return signature exactly like official documentation
 */
function verifyReturn(vnp_Params) {
    console.log('🔎 Verifying VNPay signature (LOCALHOST FIXED)...');
    console.log('Received params:', vnp_Params);

    const secretKey = process.env.VNP_HASH_SECRET;
    const secureHash = vnp_Params['vnp_SecureHash'];

    if (!secureHash) {
        console.log('❌ No secure hash found in params');
        return false;
    }

    // Remove signature fields for verification
    let signData = {};
    Object.keys(vnp_Params).forEach(key => {
        if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
            signData[key] = vnp_Params[key];
        }
    });

    // Sort parameters
    signData = sortObject(signData);
    console.log('Data to verify:', signData);

    // ✅ FIXED: Create verify string WITHOUT encoding (same as when creating)
    const verifyString = Object.keys(signData)
        .map(key => `${key}=${signData[key]}`)
        .join('&');
    
    console.log('Verify string (raw):', verifyString);

    // Generate signature for comparison
    const hmac = crypto.createHmac('sha512', secretKey);
    const computedSignature = hmac.update(Buffer.from(verifyString, 'utf-8')).digest('hex');

    console.log('Received signature:', secureHash);
    console.log('Computed signature:', computedSignature);

    const isValid = secureHash === computedSignature;
    console.log('Signature valid:', isValid);

    return isValid;
}

module.exports = {
    createPaymentUrl,
    verifyReturn
}; 