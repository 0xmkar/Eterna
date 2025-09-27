const orderValidationService = require('./services/orderValidationService');

/**
 * Test script to verify small order validation works
 */

async function testSmallOrderValidation() {
  console.log('🧪 Testing small order validation...\n');

  // Test data that was previously failing
  const testOrder = {
    side: 'BUY',
    price: 109461.25994427499,
    quantity: 0.0001,
    leverage: 10,
    margin: 0.0001,
    max_slippage_bps: 50
  };

  const userId = 1; // Assuming user ID 1 exists

  console.log('Test Order Data:');
  console.log(JSON.stringify(testOrder, null, 2));
  console.log('\n');

  try {
    // Test the validation
    const result = await orderValidationService.validateOrder(userId, testOrder);
    
    console.log('Validation Result:');
    console.log('Success:', result.valid);
    
    if (result.errors && result.errors.length > 0) {
      console.log('Errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (result.warnings && result.warnings.length > 0) {
      console.log('Warnings:');
      result.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (result.metadata) {
      console.log('\nMetadata:');
      if (result.metadata.marginInfo) {
        console.log('Margin Info:', {
          requiredMargin: result.metadata.marginInfo.requiredMargin,
          availableMargin: result.metadata.marginInfo.availableMargin
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  
  // Test with even smaller amounts
  console.log('\n🧪 Testing even smaller order...\n');
  
  const smallerOrder = {
    side: 'BUY',
    price: 50000,
    quantity: 0.0001,
    leverage: 2,
    margin: 1,
    max_slippage_bps: 100
  };

  console.log('Smaller Test Order:');
  console.log(JSON.stringify(smallerOrder, null, 2));
  console.log('\n');

  try {
    const result2 = await orderValidationService.validateOrder(userId, smallerOrder);
    
    console.log('Validation Result:');
    console.log('Success:', result2.valid);
    
    if (result2.errors && result2.errors.length > 0) {
      console.log('Errors:');
      result2.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No errors - small order validation passed!');
    }
    
    if (result2.warnings && result2.warnings.length > 0) {
      console.log('Warnings:');
      result2.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testSmallOrderValidation().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { testSmallOrderValidation }; 