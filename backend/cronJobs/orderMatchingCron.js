const cron = require('node-cron');
const { processOrderMatching } = require('../services/orderMatchingService');

// Track if order matching is currently running to prevent overlapping executions
let isOrderMatchingRunning = false;

/**
 * Cron job that runs order matching every 2 seconds
 * Uses a flag to prevent overlapping executions
 */
const orderMatchingCronJob = cron.schedule('*/2 * * * * *', async () => {
  // Skip if previous execution is still running
  if (isOrderMatchingRunning) {
    console.log('Order matching already in progress, skipping this cycle');
    return;
  }
  
  isOrderMatchingRunning = true;
  
  try {
    await processOrderMatching();
  } catch (error) {
    console.error('Error in order matching cron job:', error);
  } finally {
    isOrderMatchingRunning = false;
  }
}, {
  scheduled: false // Don't start automatically
});

/**
 * Start the order matching cron job
 */
function startOrderMatchingCron() {
  console.log('Starting order matching cron job (runs every 2 seconds)...');
  orderMatchingCronJob.start();
}

/**
 * Stop the order matching cron job
 */
function stopOrderMatchingCron() {
  console.log('Stopping order matching cron job...');
  orderMatchingCronJob.stop();
}

/**
 * Get the status of the order matching cron job
 */
function getOrderMatchingCronStatus() {
  return {
    isRunning: orderMatchingCronJob.running,
    isProcessing: isOrderMatchingRunning
  };
}

module.exports = {
  startOrderMatchingCron,
  stopOrderMatchingCron,
  getOrderMatchingCronStatus
}; 