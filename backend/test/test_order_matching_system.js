#!/usr/bin/env node

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3001';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testOrderMatchingSystem() {
  console.log('🚀 Testing Order Matching System');
  console.log('================================\n');

  try {
    // 1. Check server health
    console.log('1. Checking server health...');
    const healthResponse = await makeRequest('GET', '/health');
    if (healthResponse.status === 200) {
      console.log('✅ Server is running\n');
    } else {
      console.log('❌ Server health check failed\n');
      return;
    }

    // 2. Check order matching status
    console.log('2. Checking order matching status...');
    const statusResponse = await makeRequest('GET', '/order-matching/status');
    console.log('Order Matching Status:', statusResponse.data);
    console.log('');

    // 3. Get debug information
    console.log('3. Getting debug information...');
    const debugResponse = await makeRequest('GET', '/order-matching/debug');
    if (debugResponse.status === 200) {
      const debug = debugResponse.data.data;
      console.log(`📊 Debug Info:`);
      console.log(`   Total Orders: ${debug.totalOrders}`);
      console.log(`   Buy Orders: ${debug.buyOrders}`);
      console.log(`   Sell Orders: ${debug.sellOrders}`);
      console.log(`   Potential Matches: ${debug.potentialMatches}`);
      
      if (debug.orders.length > 0) {
        console.log('\n📋 Current Orders:');
        debug.orders.forEach(order => {
          console.log(`   ID: ${order.id}, Side: ${order.side}, Price: ${order.price}, Qty: ${order.quantity}, User: ${order.user_id}`);
        });
      }
      
      if (debug.matches.length > 0) {
        console.log('\n🎯 Potential Matches:');
        debug.matches.forEach((match, index) => {
          console.log(`   Match ${index + 1}: Buy ${match.buyOrderId} <-> Sell ${match.sellOrderId} @ ${match.executionPrice} (Qty: ${match.tradeQuantity})`);
        });
      }
      console.log('');
    } else {
      console.log('❌ Failed to get debug information\n');
    }

    // 4. Manually trigger order matching
    console.log('4. Manually triggering order matching...');
    const triggerResponse = await makeRequest('POST', '/order-matching/trigger');
    if (triggerResponse.status === 200) {
      console.log('✅ Order matching triggered successfully');
      console.log('Response:', triggerResponse.data.message);
    } else {
      console.log('❌ Failed to trigger order matching');
      console.log('Error:', triggerResponse.data);
    }
    console.log('');

    // 5. Check for any trades
    console.log('5. Checking for recent trades...');
    // Note: This would require a trades endpoint, which we could add
    console.log('ℹ️  Trade history endpoint not implemented yet\n');

    console.log('🎉 Order Matching System Test Complete!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Add some test orders to the database');
    console.log('   2. Ensure CONTRACT_ADDRESS and PRIVATE_KEY are set in .env');
    console.log('   3. Monitor the logs for order matching activity');
    console.log('   4. Check the trades table for executed trades');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOrderMatchingSystem(); 