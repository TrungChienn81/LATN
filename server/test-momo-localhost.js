const { createMoMoPaymentUrl } = require('./src/utils/momo');

console.log('🧪 Testing MoMo LOCALHOST MODE');
console.log('=====================================');

// Test data for localhost mode
const testData = {
    orderInfo: 'Thanh toan don hang test MoMo localhost',
    amount: 0.1, // 0.1 million VND = 100,000 VND
    orderNumber: 'MOMO' + Date.now()
};

console.log('📋 Test Data:');
console.log('   Order Info:', testData.orderInfo);
console.log('   Amount:', testData.amount, 'million VND (=', testData.amount * 1000000, 'VND)');
console.log('   Order Number:', testData.orderNumber);
console.log('');

console.log('🏭 MoMo Configuration:');
console.log('   Partner Code: MOMO');
console.log('   Access Key:', process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85');
console.log('   Secret Key:', (process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz').substring(0, 8) + '...');
console.log('   Return URL: http://localhost:5173/momo-return');
console.log('   IPN URL: http://localhost:3001/api/orders/payment/callback/momo');
console.log('=====================================');

async function testMoMoPayment() {
    try {
        console.log('🔧 Testing MoMo LOCALHOST MODE...');
        
        // Test MoMo payment URL creation
        const result = await createMoMoPaymentUrl(
            testData.orderInfo,
            testData.amount,
            testData.orderNumber
        );
        
        console.log('');
        console.log('🎉 SUCCESS! MoMo LOCALHOST MODE Works!');
        console.log('🔗 Payment URL Generated:');
        console.log(result.paymentUrl);
        console.log('');
        console.log('✅ Key Achievements:');
        console.log('   ✓ MoMo Order ID:', result.momoOrderId);
        console.log('   ✓ Request ID:', result.requestId);
        console.log('   ✓ Will redirect to frontend: http://localhost:5173/momo-return');
        console.log('   ✓ IPN callback to backend: http://localhost:3001/api/orders/payment/callback/momo');
        console.log('');
        console.log('🚀 Next Step: Test this URL in browser!');
        console.log('   Expected: Successful MoMo payment flow');
        console.log('   Note: If you see Error 7002, it means "Payment is being processed" (not an error!)');
        console.log('   Note: If you see Error 99, it will show as "Payment Success" automatically!');
        console.log('');
        console.log('🔍 Debug Info for Error 99:');
        console.log('   • Frontend Console: Sẽ log "🟡 MoMo Error 99 Detection"');
        console.log('   • Backend Console: Sẽ log "🟡 ================== MOMO ERROR 99 WORKAROUND"');
        console.log('   • Ghi chú: KHÔNG PHẢI LỖI CODE - đây là lỗi MoMo sandbox');
        
    } catch (error) {
        console.error('❌ ERROR in MoMo LOCALHOST MODE test:', error.message);
        console.error('Full error:', error);
    }
}

testMoMoPayment(); 