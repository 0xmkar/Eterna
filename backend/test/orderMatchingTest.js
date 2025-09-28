const { findMatchingOrders } = require('../services/orderMatchingService');

// Test data
const buyOrders = [
  {
    id: 1,
    user_id: 1,
    side: 'BUY',
    price: '50000',
    quantity: '1.5',
    leverage: '10',
    margin: '7500',
    max_slippage_bps: 10,
    status: 'OPEN'
  },
  {
    id: 2,
    user_id: 2,
    side: 'LONG',
    price: '49900',
    quantity: '2.0',
    leverage: '5',
    margin: '19960',
    max_slippage_bps: 5,
    status: 'OPEN'
  }
];

const sellOrders = [
  {
    id: 3,
    user_id: 3,
    side: 'SELL',
    price: '49950',
    quantity: '1.0',
    leverage: '8',
    margin: '6243.75',
    max_slippage_bps: 15,
    status: 'OPEN'
  },
  {
    id: 4,
    user_id: 4,
    side: 'SHORT',
    price: '50100',
    quantity: '0.8',
    leverage: '12',
    margin: '3340',
    max_slippage_bps: 8,
    status: 'OPEN'
  }
];

console.log('Testing Order Matching Algorithm');
console.log('================================');

console.log('\nBuy Orders:');
buyOrders.forEach(order => {
  console.log(`ID: ${order.id}, Price: ${order.price}, Quantity: ${order.quantity}, Slippage: ${order.max_slippage_bps}bps`);
});

console.log('\nSell Orders:');
sellOrders.forEach(order => {
  console.log(`ID: ${order.id}, Price: ${order.price}, Quantity: ${order.quantity}, Slippage: ${order.max_slippage_bps}bps`);
});

// Test the matching algorithm
const matches = findMatchingOrders(buyOrders, sellOrders);

console.log('\nMatching Results:');
console.log('================');

if (matches.length === 0) {
  console.log('No matches found');
} else {
  matches.forEach((match, index) => {
    console.log(`\nMatch ${index + 1}:`);
    console.log(`  Buy Order ID: ${match.buyOrderId} (Price: ${match.buyOrder.price})`);
    console.log(`  Sell Order ID: ${match.sellOrderId} (Price: ${match.sellOrder.price})`);
    console.log(`  Execution Price: ${match.executionPrice}`);
    console.log(`  Trade Quantity: ${match.tradeQuantity}`);
    console.log(`  Trade Value: ${match.executionPrice * match.tradeQuantity}`);
  });
}

console.log('\nTest completed successfully!');

module.exports = { buyOrders, sellOrders, matches }; 