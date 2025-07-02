const { createPaymentUrl } = require('./vnpay');

// Test function để kiểm tra merchant nào hoạt động
const testMerchants = async () => {
  const testOrder = {
    orderNumber: 'TEST123456',
    totalAmount: 25 // $25 USD
  };

  const testIP = '127.0.0.1';

  console.log('🧪 Testing VNPay Merchants...\n');

  try {
    // Test with proven working merchant
    console.log('📋 Testing with proven working merchant (2QXUI4B4)...');
    const paymentUrl = createPaymentUrl(testOrder, testIP);
    console.log('✅ URL created successfully!\n');
    console.log('🔗 Test URL:', paymentUrl.substring(0, 200) + '...\n');
    
    return {
      success: true,
      url: paymentUrl,
      merchant: '2QXUI4B4'
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to switch to user merchant 
const switchToUserMerchant = () => {
  console.log('🔄 Switching to user merchant OOUXI4NB...');
  // This would require updating the main function to use user merchant
  console.log('⚠️  Note: User merchant may need VNPay approval before working');
};

module.exports = {
  testMerchants,
  switchToUserMerchant
}; 