const cron = require('node-cron');
const orderMatchingEngine = require('./orderMatchingEngine');
const contractExecutionService = require('./contractExecutionService');

/**
 * Cron Job Service for Order Matching and Contract Execution
 * Runs automated order processing every 2 seconds
 */

class CronJobService {
  constructor() {
    this.isRunning = false;
    this.jobs = new Map();
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRunTime: null,
      lastSuccessTime: null,
      lastErrorTime: null,
      lastError: null,
      averageProcessingTime: 0,
      totalMatches: 0,
      totalTrades: 0
    };
  }

  /**
   * Start the cron job service
   */
  start() {
    if (this.isRunning) {
      console.log('Cron job service is already running');
      return false;
    }

    console.log('Starting cron job service...');

    // Main order processing job - runs every 2 seconds
    const orderProcessingJob = cron.schedule('*/2 * * * * *', async () => {
      await this.runOrderProcessingCycle();
    }, {
      scheduled: false,
      name: 'orderProcessing'
    });

    // Contract execution job - runs every 5 seconds
    const contractExecutionJob = cron.schedule('*/5 * * * * *', async () => {
      await this.runContractExecutionCycle();
    }, {
      scheduled: false,
      name: 'contractExecution'
    });

    // Health check job - runs every minute
    const healthCheckJob = cron.schedule('0 * * * * *', async () => {
      await this.runHealthCheck();
    }, {
      scheduled: false,
      name: 'healthCheck'
    });

    // Store jobs
    this.jobs.set('orderProcessing', orderProcessingJob);
    this.jobs.set('contractExecution', contractExecutionJob);
    this.jobs.set('healthCheck', healthCheckJob);

    // Start all jobs
    orderProcessingJob.start();
    contractExecutionJob.start();
    healthCheckJob.start();

    this.isRunning = true;
    console.log('Cron job service started successfully');
    console.log('- Order processing: every 2 seconds');
    console.log('- Contract execution: every 5 seconds');
    console.log('- Health check: every minute');

    return true;
  }

  /**
   * Stop the cron job service
   */
  stop() {
    if (!this.isRunning) {
      console.log('Cron job service is not running');
      return false;
    }

    console.log('Stopping cron job service...');

    // Stop all jobs
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped ${name} job`);
    }

    this.jobs.clear();
    this.isRunning = false;
    console.log('Cron job service stopped');

    return true;
  }

  /**
   * Restart the cron job service
   */
  restart() {
    console.log('Restarting cron job service...');
    this.stop();
    setTimeout(() => {
      this.start();
    }, 1000);
    return true;
  }

  /**
   * Main order processing cycle
   */
  async runOrderProcessingCycle() {
    const startTime = Date.now();
    this.stats.totalRuns++;
    this.stats.lastRunTime = new Date().toISOString();

    try {
      console.log(`[${this.stats.lastRunTime}] Running order processing cycle...`);

      // Run order matching engine
      const matchingResult = await orderMatchingEngine.processOrderMatching();

      if (matchingResult.success) {
        this.stats.successfulRuns++;
        this.stats.lastSuccessTime = new Date().toISOString();
        this.stats.totalMatches += matchingResult.matches?.length || 0;

        if (matchingResult.matches && matchingResult.matches.length > 0) {
          console.log(`✅ Order matching successful: ${matchingResult.matches.length} matches found`);
        } else {
          console.log(`ℹ️  Order matching complete: ${matchingResult.reason}`);
        }
      } else {
        console.log(`⚠️  Order matching failed: ${matchingResult.error || matchingResult.reason}`);
        this.updateErrorStats(matchingResult.error || matchingResult.reason);
      }

      // Update processing time stats
      const processingTime = Date.now() - startTime;
      this.updateProcessingTimeStats(processingTime);

    } catch (error) {
      console.error('❌ Error in order processing cycle:', error);
      this.updateErrorStats(error.message);
    }
  }

  /**
   * Contract execution cycle
   */
  async runContractExecutionCycle() {
    try {
      console.log('🔗 Running contract execution cycle...');

      // Process pending trades
      const executionResult = await contractExecutionService.processPendingTrades();

      if (executionResult.success) {
        this.stats.totalTrades += executionResult.tradesProcessed;

        if (executionResult.tradesProcessed > 0) {
          console.log(`✅ Contract execution successful: ${executionResult.tradesProcessed} trades processed`);
        } else {
          console.log('ℹ️  Contract execution complete: No pending trades');
        }
      } else {
        console.log(`⚠️  Contract execution failed: ${executionResult.error}`);
      }

    } catch (error) {
      console.error('❌ Error in contract execution cycle:', error);
    }
  }

  /**
   * Health check cycle
   */
  async runHealthCheck() {
    try {
      console.log('🏥 Running health check...');

      // Check order matching engine health
      const matchingStats = orderMatchingEngine.getStats();
      
      // Check contract service health
      const contractHealth = await contractExecutionService.healthCheck();
      
      // Check order book depth
      const orderBookDepth = await orderMatchingEngine.getOrderBookDepth();

      const healthReport = {
        timestamp: new Date().toISOString(),
        orderMatching: {
          isProcessing: matchingStats.isProcessing,
          totalMatches: matchingStats.totalMatches,
          lastMatchTime: matchingStats.lastMatchTime
        },
        contractService: {
          status: contractHealth.status,
          contractInitialized: contractHealth.contractInitialized,
          network: contractHealth.network,
          blockNumber: contractHealth.blockNumber
        },
        orderBook: orderBookDepth,
        cronStats: this.getStats()
      };

      // Log health status
      if (contractHealth.status === 'healthy') {
        console.log('✅ System health check passed');
      } else {
        console.log('⚠️  System health check issues detected');
        console.log('Contract service status:', contractHealth.status);
        if (contractHealth.error) {
          console.log('Contract error:', contractHealth.error);
        }
      }

      // Store health report (could be saved to database)
      this.lastHealthReport = healthReport;

    } catch (error) {
      console.error('❌ Error in health check:', error);
    }
  }

  /**
   * Update error statistics
   */
  updateErrorStats(error) {
    this.stats.failedRuns++;
    this.stats.lastErrorTime = new Date().toISOString();
    this.stats.lastError = error;
  }

  /**
   * Update processing time statistics
   */
  updateProcessingTimeStats(processingTime) {
    if (this.stats.averageProcessingTime === 0) {
      this.stats.averageProcessingTime = processingTime;
    } else {
      // Rolling average
      this.stats.averageProcessingTime = (this.stats.averageProcessingTime * 0.8) + (processingTime * 0.2);
    }
  }

  /**
   * Get cron job statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      successRate: this.stats.totalRuns > 0 ? 
        ((this.stats.successfulRuns / this.stats.totalRuns) * 100).toFixed(2) + '%' : 
        '0%',
      uptime: this.isRunning ? this.calculateUptime() : '0ms'
    };
  }

  /**
   * Calculate uptime
   */
  calculateUptime() {
    if (!this.stats.lastRunTime) return '0ms';
    
    const start = new Date(this.stats.lastRunTime);
    const now = new Date();
    const uptimeMs = now - start;
    
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Get last health report
   */
  getLastHealthReport() {
    return this.lastHealthReport || null;
  }

  /**
   * Manual trigger for order processing (for testing)
   */
  async triggerOrderProcessing() {
    if (!this.isRunning) {
      throw new Error('Cron job service is not running');
    }

    console.log('🔄 Manually triggering order processing...');
    await this.runOrderProcessingCycle();
    return { success: true, message: 'Order processing triggered manually' };
  }

  /**
   * Manual trigger for contract execution (for testing)
   */
  async triggerContractExecution() {
    if (!this.isRunning) {
      throw new Error('Cron job service is not running');
    }

    console.log('🔄 Manually triggering contract execution...');
    await this.runContractExecutionCycle();
    return { success: true, message: 'Contract execution triggered manually' };
  }

  /**
   * Get job status
   */
  getJobStatus(jobName) {
    const job = this.jobs.get(jobName);
    if (!job) {
      return { exists: false };
    }

    return {
      exists: true,
      running: job.running,
      scheduled: job.scheduled
    };
  }

  /**
   * Pause a specific job
   */
  pauseJob(jobName) {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    job.stop();
    console.log(`Job '${jobName}' paused`);
    return true;
  }

  /**
   * Resume a specific job
   */
  resumeJob(jobName) {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    job.start();
    console.log(`Job '${jobName}' resumed`);
    return true;
  }

  /**
   * Set custom schedule for a job (advanced usage)
   */
  setJobSchedule(jobName, cronExpression) {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    // This would require recreating the job with new schedule
    // For now, just validate the cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error('Invalid cron expression');
    }

    console.log(`Schedule for '${jobName}' would be updated to: ${cronExpression}`);
    return true;
  }
}

// Export singleton instance
module.exports = new CronJobService(); 