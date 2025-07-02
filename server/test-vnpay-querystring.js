const { createPaymentUrl } = require('./src/utils/vnpay-v2');

console.log('🧪 Testing VNPay with QueryString Method (Like Old Project)');
console.log('='.repeat(60));

// Test data
const testOrder = {
    orderInfo: 'Thanh toan cho don hang ORD' + Date.now(),
    amount: 21.49, // 21.49 million VND
    orderNumber: 'ORD' + Date.now(),
    ipAddr: '127.0.0.1',
    locale: 'vn'
};

console.log('📦 Test Order Data:');
console.log(JSON.stringify(testOrder, null, 2));
console.log('='.repeat(60));

try {
    const paymentUrl = createPaymentUrl(
        testOrder.orderInfo,
        testOrder.amount,
        testOrder.orderNumber,
        testOrder.ipAddr,
        testOrder.locale
    );
    
    console.log('='.repeat(60));
    console.log('🎯 FINAL PAYMENT URL:');
    console.log(paymentUrl);
    console.log('='.repeat(60));
    
    // Extract and display parameters for verification
    const url = new URL(paymentUrl);
    const params = Object.fromEntries(url.searchParams);
    
    console.log('📋 URL Parameters:');
    Object.keys(params).sort().forEach(key => {
        console.log(`${key}: ${params[key]}`);
    });
    
    console.log('='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('🔗 Open this URL in browser to test payment flow');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
} 