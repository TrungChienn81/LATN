const { createPaymentUrl } = require('./src/utils/vnpay-v2');

console.log('🚀 Testing VNPay with TUNNEL');
console.log('============================');

const orderInfo = 'Test payment with tunnel';
const amount = 21.49; // 21.49 triệu VND như trong giỏ hàng
const orderNumber = 'TUNNEL' + Date.now();
const ipAddr = '127.0.0.1';

console.log('Amount:', amount, 'triệu VND');

try {
    const paymentUrl = createPaymentUrl(orderInfo, amount, orderNumber, ipAddr);
    
    console.log('\n✅ Payment URL with TUNNEL:');
    console.log(paymentUrl);
    
    // Check return URL
    if (paymentUrl.includes('vnpay-latn-shop.loca.lt')) {
        console.log('\n✅ Return URL sử dụng tunnel - VNPay có thể callback!');
    } else {
        console.log('\n❌ Return URL vẫn là localhost - VNPay không thể callback!');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
} 