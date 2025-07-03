// Load environment variables first (same as app.js)
require('dotenv').config();

// Set PayPal environment variables manually as fallback (from app.js configuration)
if (!process.env.PAYPAL_CLIENT_ID) {
    process.env.PAYPAL_CLIENT_ID = 'AcJF20Roi976O-WnRXZ8CcYPZgLFblsaAxGJxOG4xOf8lpgJbhnsYw3mYitwRv2FN-zT0OdevaJ15HFQ';
}
if (!process.env.PAYPAL_CLIENT_SECRET) {
    process.env.PAYPAL_CLIENT_SECRET = 'ENOlo78HG59twlv6Gr31WyV9DZM9Z-8WoszPVlUFXSvlweDN1GV4j_mu5aSvfkMM1HsS9oxR_eoUgpp5';
}
if (!process.env.PAYPAL_MODE) {
    process.env.PAYPAL_MODE = 'sandbox';
}

const { createPayPalOrder, capturePayPalOrder } = require('./src/utils/paypal');

async function testPayPalLocalhost() {
    console.log('');
    console.log('🔄 ===== PAYPAL LOCALHOST TEST =====');
    console.log('');

    try {
        // Test data
        const orderInfo = 'Test Payment for Order #TEST123';
        const amount = 1.5; // 1.5 million VND (will be converted to USD)
        const orderNumber = 'TEST123_' + Date.now();

        console.log('🧪 Test PayPal Order Creation...');
        console.log('   Order Info:', orderInfo);
        console.log('   Amount:', amount, 'million VND');
        console.log('   Order Number:', orderNumber);
        console.log('');

        // Step 1: Create PayPal Order
        const createResult = await createPayPalOrder(orderInfo, amount, orderNumber);
        
        console.log('✅ PayPal Order Created Successfully!');
        console.log('   Success:', createResult.success);
        console.log('   Payment URL:', createResult.paymentUrl);
        console.log('   PayPal Order ID:', createResult.paypalOrderId);
        console.log('   Status:', createResult.status);
        console.log('');

        console.log('📝 Next Steps for Manual Testing:');
        console.log('   1. Copy the payment URL above');
        console.log('   2. Open it in your browser');
        console.log('   3. Complete the PayPal payment process');
        console.log('   4. You will be redirected back to the callback URL');
        console.log('');

        console.log('⚠️  Note: PayPal Order ID for manual capture testing:');
        console.log('   PayPal Order ID:', createResult.paypalOrderId);
        console.log('');

        // For automated testing, we won't capture since we need user approval
        console.log('ℹ️  Automated capture test skipped (requires user approval)');
        console.log('   To test capture manually, use the PayPal Order ID above');
        console.log('');

    } catch (error) {
        console.error('❌ PayPal Test Error:', error.message);
        console.error('   Details:', error);
    }

    console.log('🏁 ===== PAYPAL TEST COMPLETED =====');
    console.log('');
}

// Test different amounts
async function testPayPalAmounts() {
    console.log('');
    console.log('🔄 ===== PAYPAL AMOUNT VALIDATION TEST =====');
    console.log('');

    const testCases = [
        { amount: 0.0001, description: 'Very small amount (should fail)' },
        { amount: 0.01, description: 'Minimum valid amount' },
        { amount: 1.5, description: 'Normal amount' },
        { amount: 50, description: 'Medium amount' },
        { amount: 240, description: 'High amount (10,000 USD)' },
        { amount: 300, description: 'Very high amount (should fail)' }
    ];

    for (const testCase of testCases) {
        try {
            console.log(`🧪 Testing: ${testCase.description}`);
            console.log(`   Amount: ${testCase.amount} million VND`);
            
            const result = await createPayPalOrder(
                `Test payment - ${testCase.description}`,
                testCase.amount,
                `TEST_${Date.now()}`
            );
            
            console.log(`   ✅ Success: ${result.success}`);
            console.log(`   Payment URL: ${result.paymentUrl ? 'Generated' : 'None'}`);
            console.log('');
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            console.log('');
        }
    }

    console.log('🏁 ===== AMOUNT VALIDATION TEST COMPLETED =====');
    console.log('');
}

// Main test execution
async function runTests() {
    try {
        await testPayPalLocalhost();
        await testPayPalAmounts();
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    }
}

// Check if running directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testPayPalLocalhost,
    testPayPalAmounts
}; 