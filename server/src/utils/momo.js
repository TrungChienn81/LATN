const crypto = require('crypto');
const https = require('https');

// MoMo configuration
const momoConfig = {
    accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    partnerCode: 'MOMO',
    requestType: 'payWithMethod',
    hostname: 'test-payment.momo.vn', // Sandbox environment
    endpoint: '/v2/gateway/api/create',
    returnUrl: process.env.MOMO_RETURN_URL || 'http://localhost:5173/momo-return',
    ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3001/api/orders/payment/callback/momo'
};

/**
 * Create MoMo payment URL
 * @param {string} orderInfo - Order description  
 * @param {number} amount - Amount in millions VND (will be converted to VND)
 * @param {string} orderNumber - Unique order ID
 * @returns {Promise<Object>} Payment response from MoMo
 */
function createMoMoPaymentUrl(orderInfo, amount, orderNumber) {
    return new Promise((resolve, reject) => {
        console.log('🔄 Creating MoMo Payment URL...');
        console.log('Order:', orderNumber, 'Amount:', amount, 'million VND');
        
        // Convert from millions VND to VND (same as VNPay)
        const amountInVND = Math.round(amount * 1000000);
        console.log('Amount in VND:', amountInVND);
        
        // Validate amount (MoMo sandbox có giới hạn nhưng chúng ta sẽ flexible cho development)
        if (amountInVND < 1000) {
            reject(new Error(`Số tiền quá nhỏ. Tối thiểu 1,000 VND, nhận được ${amountInVND} VND`));
            return;
        }
        
        // DEVELOPMENT WORKAROUND: Cho phép amount lớn hơn 50M cho test sản phẩm đắt tiền
        // Production MoMo sẽ có giới hạn khác (thường cao hơn)
        const isDevelopment = process.env.NODE_ENV === 'development' || process.env.MOMO_ALLOW_HIGH_AMOUNT === 'true';
        const maxAmount = isDevelopment ? 500000000 : 50000000; // Dev: 500M, Production: 50M
        
        if (amountInVND > maxAmount) {
            const suggestion = isDevelopment 
                ? 'Đây là giới hạn development. Production sẽ có giới hạn cao hơn.'
                : 'Vui lòng chia thành nhiều giao dịch nhỏ hơn hoặc liên hệ MoMo để tăng limit.';
            reject(new Error(`Số tiền quá lớn. Tối đa ${maxAmount.toLocaleString('vi-VN')} VND, nhận được ${amountInVND.toLocaleString('vi-VN')} VND. ${suggestion}`));
            return;
        }
        
        // Log warning for high amounts
        if (amountInVND > 50000000) {
            console.log('⚠️ HIGH AMOUNT WARNING:');
            console.log(`   Amount: ${amountInVND.toLocaleString('vi-VN')} VND (${amount} triệu VND)`);
            console.log(`   Development mode: Cho phép test với số tiền cao`);
            console.log(`   Production: Cần xác nhận giới hạn với MoMo thực tế`);
        }

        const orderId = momoConfig.partnerCode + new Date().getTime();
        const requestId = orderId;
        const extraData = '';
        const orderGroupId = '';
        const autoCapture = true;
        const lang = 'vi';

        // Create raw signature string (use amountInVND, not original amount)
        const rawSignature = 
            'accessKey=' + momoConfig.accessKey +
            '&amount=' + amountInVND +
            '&extraData=' + extraData +
            '&ipnUrl=' + momoConfig.ipnUrl +
            '&orderId=' + orderNumber + // Use the actual order number
            '&orderInfo=' + orderInfo +
            '&partnerCode=' + momoConfig.partnerCode +
            '&redirectUrl=' + momoConfig.returnUrl +
            '&requestId=' + requestId +
            '&requestType=' + momoConfig.requestType;

        console.log('Raw signature:', rawSignature);

        // Generate signature using HMAC SHA256
        const signature = crypto
            .createHmac('sha256', momoConfig.secretKey)
            .update(rawSignature)
            .digest('hex');

        console.log('Generated signature:', signature);

        // Create request body (use amountInVND, not original amount)
        const requestBody = JSON.stringify({
            partnerCode: momoConfig.partnerCode,
            partnerName: 'Test',
            storeId: 'MomoTestStore',
            requestId: requestId,
            amount: amountInVND,
            orderId: orderNumber, // Use the actual order number
            orderInfo: orderInfo,
            redirectUrl: momoConfig.returnUrl,
            ipnUrl: momoConfig.ipnUrl,
            lang: lang,
            requestType: momoConfig.requestType,
            autoCapture: autoCapture,
            extraData: extraData,
            orderGroupId: orderGroupId,
            signature: signature,
        });

        // HTTPS request options
        const options = {
            hostname: momoConfig.hostname,
            port: 443,
            path: momoConfig.endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            },
        };

        // Send request to MoMo
        const req = https.request(options, (res) => {
            console.log(`MoMo API Status: ${res.statusCode}`);
            
            res.setEncoding('utf8');
            let responseBody = '';
            
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(responseBody);
                    console.log('MoMo API Response:', response);
                    
                    if (response.resultCode === 0) {
                        console.log('✅ MoMo payment URL created successfully');
                        resolve({
                            success: true,
                            paymentUrl: response.payUrl,
                            orderId: orderNumber,
                            momoOrderId: response.orderId,
                            requestId: response.requestId
                        });
                    } else {
                        console.error('❌ MoMo payment creation failed:', response.message);
                        reject(new Error(`MoMo payment failed: ${response.message}`));
                    }
                } catch (error) {
                    console.error('❌ Error parsing MoMo response:', error);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ MoMo request error:', error);
            reject(error);
        });

        // Send request
        console.log('Sending request to MoMo...');
        req.write(requestBody);
        req.end();
    });
}

/**
 * Verify MoMo signature for callback
 * @param {Object} params - MoMo callback parameters
 * @returns {boolean} - Is signature valid
 */
function verifyMoMoSignature(params) {
    console.log('🔐 MoMo Signature Verification Debug:');
    console.log('Input params:', JSON.stringify(params, null, 2));
    
    const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
    } = params;

    console.log('🔍 Extracted values:');
    console.log('  partnerCode:', partnerCode);
    console.log('  orderId:', orderId);
    console.log('  amount:', amount);
    console.log('  resultCode:', resultCode);
    console.log('  message:', message);
    console.log('  transId:', transId);

    // Create raw signature for verification
    const rawSignature = 
        'accessKey=' + momoConfig.accessKey +
        '&amount=' + amount +
        '&extraData=' + (extraData || '') +
        '&message=' + message +
        '&orderId=' + orderId +
        '&orderInfo=' + orderInfo +
        '&orderType=' + (orderType || '') +
        '&partnerCode=' + partnerCode +
        '&payType=' + (payType || '') +
        '&requestId=' + requestId +
        '&responseTime=' + responseTime +
        '&resultCode=' + resultCode +
        '&transId=' + transId;

    // Generate verification signature
    const verifySignature = crypto
        .createHmac('sha256', momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex');

    console.log('🔐 Signature Details:');
    console.log('Raw signature for verification:', rawSignature);
    console.log('Expected signature:', verifySignature);
    console.log('Received signature:', signature);
    console.log('Signatures match:', verifySignature === signature);

    return verifySignature === signature;
}

module.exports = {
    createMoMoPaymentUrl,
    verifyMoMoSignature,
    momoConfig
}; 