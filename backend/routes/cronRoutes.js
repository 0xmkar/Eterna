const express = require('express');
const router = express.Router();
const cronJobService = require('../services/cronJobService');
const orderMatchingEngine = require('../services/orderMatchingEngine');
const contractExecutionService = require('../services/contractExecutionService');

// GET /cron/status - Get cron job service status
router.get('/status', (req, res) => {
  try {
    const stats = cronJobService.getStats();
    const healthReport = cronJobService.getLastHealthReport();
    
    res.json({
      success: true,
      data: {
        stats,
        healthReport,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting cron status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cron status',
      details: [error.message]
    });
  }
});

// POST /cron/start - Start the cron job service
router.post('/start', (req, res) => {
  try {
    const result = cronJobService.start();
    
    if (result) {
      res.json({
        success: true,
        message: 'Cron job service started successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Cron job service is already running'
      });
    }
  } catch (error) {
    console.error('Error starting cron service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start cron service',
      details: [error.message]
    });
  }
});

// POST /cron/stop - Stop the cron job service
router.post('/stop', (req, res) => {
  try {
    const result = cronJobService.stop();
    
    if (result) {
      res.json({
        success: true,
        message: 'Cron job service stopped successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Cron job service is not running'
      });
    }
  } catch (error) {
    console.error('Error stopping cron service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop cron service',
      details: [error.message]
    });
  }
});

// POST /cron/restart - Restart the cron job service
router.post('/restart', (req, res) => {
  try {
    cronJobService.restart();
    res.json({
      success: true,
      message: 'Cron job service restart initiated'
    });
  } catch (error) {
    console.error('Error restarting cron service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart cron service',
      details: [error.message]
    });
  }
});

// GET /cron/jobs/:jobName - Get specific job status
router.get('/jobs/:jobName', (req, res) => {
  try {
    const { jobName } = req.params;
    const jobStatus = cronJobService.getJobStatus(jobName);
    
    res.json({
      success: true,
      data: {
        jobName,
        ...jobStatus
      }
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
      details: [error.message]
    });
  }
});

// POST /cron/jobs/:jobName/pause - Pause a specific job
router.post('/jobs/:jobName/pause', (req, res) => {
  try {
    const { jobName } = req.params;
    cronJobService.pauseJob(jobName);
    
    res.json({
      success: true,
      message: `Job '${jobName}' paused successfully`
    });
  } catch (error) {
    console.error('Error pausing job:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// POST /cron/jobs/:jobName/resume - Resume a specific job
router.post('/jobs/:jobName/resume', (req, res) => {
  try {
    const { jobName } = req.params;
    cronJobService.resumeJob(jobName);
    
    res.json({
      success: true,
      message: `Job '${jobName}' resumed successfully`
    });
  } catch (error) {
    console.error('Error resuming job:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// POST /cron/trigger/matching - Manually trigger order matching
router.post('/trigger/matching', async (req, res) => {
  try {
    const result = await cronJobService.triggerOrderProcessing();
    res.json(result);
  } catch (error) {
    console.error('Error triggering order matching:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /cron/trigger/execution - Manually trigger contract execution
router.post('/trigger/execution', async (req, res) => {
  try {
    const result = await cronJobService.triggerContractExecution();
    res.json(result);
  } catch (error) {
    console.error('Error triggering contract execution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /cron/matching/stats - Get order matching statistics
router.get('/matching/stats', (req, res) => {
  try {
    const stats = orderMatchingEngine.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting matching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get matching statistics',
      details: [error.message]
    });
  }
});

// GET /cron/matching/depth - Get order book depth
router.get('/matching/depth', async (req, res) => {
  try {
    const depth = await orderMatchingEngine.getOrderBookDepth();
    res.json({
      success: true,
      data: depth
    });
  } catch (error) {
    console.error('Error getting order book depth:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order book depth',
      details: [error.message]
    });
  }
});

// GET /cron/contract/info - Get contract information
router.get('/contract/info', async (req, res) => {
  try {
    const info = await contractExecutionService.getContractInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error getting contract info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contract information',
      details: [error.message]
    });
  }
});

// GET /cron/contract/health - Get contract service health
router.get('/contract/health', async (req, res) => {
  try {
    const health = await contractExecutionService.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking contract health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check contract health',
      details: [error.message]
    });
  }
});

// GET /cron/trades/pending - Get pending trades
router.get('/trades/pending', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const trades = await contractExecutionService.getPendingTrades(limit);
    
    res.json({
      success: true,
      data: trades,
      count: trades.length
    });
  } catch (error) {
    console.error('Error getting pending trades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending trades',
      details: [error.message]
    });
  }
});

// POST /cron/trades/process - Manually process pending trades
router.post('/trades/process', async (req, res) => {
  try {
    const result = await contractExecutionService.processPendingTrades();
    res.json(result);
  } catch (error) {
    console.error('Error processing pending trades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process pending trades',
      details: [error.message]
    });
  }
});

// GET /cron/health - Comprehensive health check
router.get('/health', async (req, res) => {
  try {
    const healthReport = cronJobService.getLastHealthReport();
    const currentStats = cronJobService.getStats();
    
    // Perform additional health checks
    const orderBookDepth = await orderMatchingEngine.getOrderBookDepth();
    const contractHealth = await contractExecutionService.healthCheck();
    
    const overallHealth = {
      status: contractHealth.status === 'healthy' && currentStats.isRunning ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      components: {
        cronService: {
          status: currentStats.isRunning ? 'healthy' : 'stopped',
          stats: currentStats
        },
        orderMatching: {
          status: 'healthy',
          depth: orderBookDepth
        },
        contractService: contractHealth,
        lastHealthReport: healthReport
      }
    };
    
    const statusCode = overallHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: overallHealth.status === 'healthy',
      data: overallHealth
    });
    
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      details: [error.message],
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 