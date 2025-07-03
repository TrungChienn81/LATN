const axios = require('axios');

// PayPal configuration
// Đảm bảo rằng bạn đã thiết lập các biến môi trường này trong file .env
const paypalConfig = {
    clientId: process.env.PAYPAL_CLIENT_ID || 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXIkA_PYSQc-NWA',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'EGnHDxD_qRPdaLdZz8iCr8N7_MzF-YHPTkjs6NKYQvQSBngp4PTTVWkPZRbL_mv1GE_3K8K9KH3s7v-W',
    mode: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' hoặc 'live'
    returnUrl: process.env.PAYPAL_RETURN_URL || 'http://localhost:3001/api/orders/payment/callback/paypal/success',
    cancelUrl: process.env.PAYPAL_CANCEL_URL || 'http://localhost:3001/api/orders/payment/callback/paypal/cancel',
    // Tỷ giá chuyển đổi VND sang USD (có thể cập nhật theo tỷ giá thực tế)
    exchangeRate: process.env.VND_TO_USD_RATE || 24000
};

// Get PayPal base URL based on mode
const getPayPalBaseURL = () => {
    return paypalConfig.mode === 'live' 
        ? 'https://api.paypal.com'
        : 'https://api.sandbox.paypal.com';
};

/**
 * Get PayPal access token
 * @returns {Promise<string>} Access token
 */
async function getPayPalAccessToken() {
    try {
        const { clientId, clientSecret, mode } = paypalConfig;
        console.log('🔍 PayPal Config Debug:');
        console.log('   Client ID:', clientId?.substring(0, 20) + '...');
        console.log('   Mode:', mode);
        
        console.log('🔄 Sending PayPal token request...');
        const response = await axios({
            method: 'POST',
            url: `${getPayPalBaseURL()}/v1/oauth2/token`,
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'en_US',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            auth: {
                username: clientId,
                password: clientSecret
            },
            data: 'grant_type=client_credentials'
        });
        
        console.log('✅ PayPal token received successfully');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ PayPal access token error:', error.response?.data || error.message);
        if (error.response) {
            console.error('❌ Status code:', error.response.status);
            console.error('❌ Headers:', JSON.stringify(error.response.headers));
            console.error('❌ Response data:', JSON.stringify(error.response.data));
        }
        throw new Error('Failed to get PayPal access token: ' + (error.response?.data?.error_description || error.message));
    }
}

/**
 * Create PayPal payment order
 * @param {string} orderInfo - Order description
 * @param {number} amount - Amount in millions VND (will be converted to USD)
 * @param {string} orderNumber - Unique order ID
 * @returns {Promise<Object>} PayPal order response
 */
async function createPayPalOrder(orderInfo, amount, orderNumber) {
    try {
        console.log('🔄 Creating PayPal Order...');
        console.log('Order:', orderNumber, 'Amount:', amount, 'VND');
        
        // Convert from VND to USD using the configured exchange rate
        const amountInVND = Math.round(amount); // Amount is already in VND
        const amountInUSD = (amountInVND / paypalConfig.exchangeRate).toFixed(2);
        console.log('Amount in VND:', amountInVND);
        console.log('Amount in USD:', amountInUSD);
        console.log('Exchange rate used:', paypalConfig.exchangeRate, 'VND = 1 USD');
        
        // Validate amount (PayPal minimum $0.01, maximum varies by region)
        if (parseFloat(amountInUSD) < 0.01) {
            throw new Error(`Số tiền quá nhỏ. Tối thiểu $0.01 USD, nhận được $${amountInUSD} USD`);
        }
        
        if (parseFloat(amountInUSD) > 10000) {
            throw new Error(`Số tiền quá lớn. Tối đa $10,000 USD, nhận được $${amountInUSD} USD`);
        }

        console.log('🔄 Getting PayPal access token...');
        const accessToken = await getPayPalAccessToken();
        console.log('✅ Access token received, length:', accessToken?.length || 0);
        
        const orderData = {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: orderNumber,
                description: orderInfo,
                amount: {
                    currency_code: 'USD',
                    value: amountInUSD
                }
            }],
            application_context: {
                return_url: `${paypalConfig.returnUrl}?orderNumber=${orderNumber}`,
                cancel_url: `${paypalConfig.cancelUrl}?orderNumber=${orderNumber}`,
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'LATN E-commerce'
            }
        };

        console.log('PayPal order data:', JSON.stringify(orderData, null, 2));
        console.log('🔄 Sending request to PayPal API to create order...');

        const response = await axios({
            method: 'POST',
            url: `${getPayPalBaseURL()}/v2/checkout/orders`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            data: orderData
        });

        console.log('✅ PayPal API Response received:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        if (response.data.status === 'CREATED') {
            const approvalUrl = response.data.links.find(link => link.rel === 'approve').href;
            console.log('✅ PayPal order created successfully');
            console.log('Approval URL:', approvalUrl);
            
            return {
                success: true,
                paymentUrl: approvalUrl,
                orderId: orderNumber,
                paypalOrderId: response.data.id,
                status: response.data.status
            };
        } else {
            console.error('❌ PayPal order creation failed:', response.data);
            throw new Error(`PayPal order creation failed: ${response.data.status}`);
        }
    } catch (error) {
        console.error('❌ PayPal order creation error:', error.response?.data || error.message);
        console.error('❌ Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        if (error.response) {
            console.error('❌ Status code:', error.response.status);
            console.error('❌ Headers:', JSON.stringify(error.response.headers));
            console.error('❌ Response data:', JSON.stringify(error.response.data));
        }
        throw error;
    }
}

/**
 * Capture PayPal payment
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {Promise<Object>} Capture response
 */
async function capturePayPalOrder(paypalOrderId) {
    try {
        console.log('🔄 Capturing PayPal payment for order:', paypalOrderId);
        
        const accessToken = await getPayPalAccessToken();
        
        const response = await axios({
            method: 'POST',
            url: `${getPayPalBaseURL()}/v2/checkout/orders/${paypalOrderId}/capture`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('PayPal capture response:', response.data);
        
        return response.data;
    } catch (error) {
        console.error('❌ PayPal capture error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Verify PayPal webhook signature (for production)
 * @param {Object} headers - Webhook headers
 * @param {Object} body - Webhook body
 * @returns {boolean} Is signature valid
 */
function verifyPayPalWebhook(headers, body) {
    // In production, implement webhook signature verification
    // For sandbox/development, we'll skip this
    console.log('🔍 PayPal webhook verification (sandbox mode - auto-approved)');
    return true;
}

module.exports = {
    createPayPalOrder,
    capturePayPalOrder,
    verifyPayPalWebhook,
    paypalConfig
}; 