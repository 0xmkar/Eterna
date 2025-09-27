const pool = require('../config/database');
const enhancedOrderService = require('./enhancedOrderService');
const orderConfig = require('../config/orderConfig');

/**
 * Order Matching Engine for Perpetual Futures DEX
 * Matches orders based on price, quantity, and slippage tolerance
 */

class OrderMatchingEngine {
  constructor() {
    this.isProcessing = false;
    this.lastProcessTime = Date.now();
    this.matchingStats = {
      totalMatches: 0,
      totalVolume: 0,
      averageSpread: 0,
      lastMatchTime: null
    };
  }

  /**
   * Main order matching function - finds and processes matching orders
   */
  async processOrderMatching() {
    if (this.isProcessing) {
      console.log('Order matching already in progress, skipping...');
      return { success: false, reason: 'already_processing' };
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      console.log(`[${new Date().toISOString()}] Starting order matching process...`);

      // Get all open orders sorted by price priority
      const { buyOrders, sellOrders } = await this.getOrderBookForMatching();
      
      if (buyOrders.length === 0 || sellOrders.length === 0) {
        console.log('No matching opportunities - insufficient orders on one or both sides');
        return { success: true, matches: [], reason: 'no_orders' };
      }

      // Find potential matches
      const potentialMatches = await this.findPotentialMatches(buyOrders, sellOrders);
      
      if (potentialMatches.length === 0) {
        console.log('No viable matches found based on current market conditions');
        return { success: true, matches: [], reason: 'no_matches' };
      }

      // Validate and filter matches
      const validMatches = await this.validateMatches(potentialMatches);
      
      if (validMatches.length === 0) {
        console.log('No valid matches after validation');
        return { success: true, matches: [], reason: 'no_valid_matches' };
      }

      // Execute matches
      const executionResults = await this.executeMatches(validMatches);

      // Update statistics
      this.updateMatchingStats(executionResults);

      const processingTime = Date.now() - startTime;
      console.log(`Order matching completed in ${processingTime}ms. Executed ${executionResults.successful.length} matches.`);

      return {
        success: true,
        matches: executionResults.successful,
        failed: executionResults.failed,
        processingTime,
        stats: this.matchingStats
      };

    } catch (error) {
      console.error('Error in order matching process:', error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    } finally {
      this.isProcessing = false;
      this.lastProcessTime = Date.now();
    }
  }

  /**
   * Get order book data optimized for matching
   */
  async getOrderBookForMatching() {
    try {
      const client = await pool.connect();

      // Get buy orders (sorted by price DESC - highest price first)
      const buyOrdersResult = await client.query(`
        SELECT o.*, u.wallet_address, u.available_margin
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.status = 'OPEN' 
          AND o.side = 'BUY'
          AND u.is_banned = false
          AND u.is_liquidated = false
          AND o.price IS NOT NULL
        ORDER BY o.price DESC, o.created_at ASC
        LIMIT 100
      `);

      // Get sell orders (sorted by price ASC - lowest price first)
      const sellOrdersResult = await client.query(`
        SELECT o.*, u.wallet_address, u.available_margin
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.status = 'OPEN' 
          AND o.side = 'SELL'
          AND u.is_banned = false
          AND u.is_liquidated = false
          AND o.price IS NOT NULL
        ORDER BY o.price ASC, o.created_at ASC
        LIMIT 100
      `);

      client.release();

      return {
        buyOrders: buyOrdersResult.rows.map(this.parseOrderData),
        sellOrders: sellOrdersResult.rows.map(this.parseOrderData)
      };

    } catch (error) {
      console.error('Error fetching order book for matching:', error);
      throw error;
    }
  }

  /**
   * Parse order data from database
   */
  parseOrderData(row) {
    return {
      id: parseInt(row.id),
      userId: parseInt(row.user_id),
      side: row.side,
      price: parseFloat(row.price),
      quantity: parseFloat(row.quantity),
      leverage: parseFloat(row.leverage),
      margin: parseFloat(row.margin),
      maxSlippageBps: parseInt(row.max_slippage_bps),
      walletAddress: row.wallet_address,
      availableMargin: parseFloat(row.available_margin || 0),
      createdAt: row.created_at
    };
  }

  /**
   * Find potential matches between buy and sell orders
   */
  async findPotentialMatches(buyOrders, sellOrders) {
    const potentialMatches = [];
    
    for (const buyOrder of buyOrders) {
      for (const sellOrder of sellOrders) {
        // Skip if same user
        if (buyOrder.userId === sellOrder.userId) {
          continue;
        }

        // Check if prices can match (buy >= sell)
        if (buyOrder.price < sellOrder.price) {
          continue; // No more matches possible for this buy order
        }

        // Calculate slippage for both orders
        const buySlippage = this.calculateSlippage(buyOrder.price, sellOrder.price, 'BUY');
        const sellSlippage = this.calculateSlippage(sellOrder.price, buyOrder.price, 'SELL');

        // Check if slippage is within tolerance
        if (buySlippage > buyOrder.maxSlippageBps || sellSlippage > sellOrder.maxSlippageBps) {
          continue;
        }

        // Determine match quantity and execution price
        const matchQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
        const executionPrice = this.calculateExecutionPrice(buyOrder.price, sellOrder.price);

        // Create potential match
        const match = {
          buyOrder,
          sellOrder,
          executionPrice,
          matchQuantity,
          buySlippage,
          sellSlippage,
          timestamp: Date.now()
        };

        potentialMatches.push(match);
      }
    }

    // Sort matches by best execution (smallest spread first)
    return potentialMatches.sort((a, b) => {
      const spreadA = a.buyOrder.price - a.sellOrder.price;
      const spreadB = b.buyOrder.price - b.sellOrder.price;
      return spreadA - spreadB;
    });
  }

  /**
   * Calculate slippage in basis points
   */
  calculateSlippage(expectedPrice, executionPrice, side) {
    if (side === 'BUY') {
      // For buy orders, slippage is when execution price > expected price
      if (executionPrice > expectedPrice) {
        return Math.round(((executionPrice - expectedPrice) / expectedPrice) * 10000);
      }
    } else {
      // For sell orders, slippage is when execution price < expected price
      if (executionPrice < expectedPrice) {
        return Math.round(((expectedPrice - executionPrice) / expectedPrice) * 10000);
      }
    }
    return 0; // No slippage (favorable execution)
  }

  /**
   * Calculate fair execution price (typically mid-point)
   */
  calculateExecutionPrice(buyPrice, sellPrice) {
    // Use mid-point pricing for fair execution
    return (buyPrice + sellPrice) / 2;
  }

  /**
   * Validate matches for execution
   */
  async validateMatches(potentialMatches) {
    const validMatches = [];

    for (const match of potentialMatches) {
      try {
        // Re-validate orders still exist and are open
        const buyOrderValid = await this.validateOrderStillValid(match.buyOrder.id);
        const sellOrderValid = await this.validateOrderStillValid(match.sellOrder.id);

        if (!buyOrderValid || !sellOrderValid) {
          continue;
        }

        // Validate margin requirements for execution
        const marginValid = await this.validateMarginForExecution(match);
        if (!marginValid) {
          continue;
        }

        // Check for any risk management constraints
        const riskValid = await this.validateRiskConstraints(match);
        if (!riskValid) {
          continue;
        }

        validMatches.push(match);

      } catch (error) {
        console.error(`Error validating match ${match.buyOrder.id}-${match.sellOrder.id}:`, error);
        continue;
      }
    }

    return validMatches;
  }

  /**
   * Validate that an order is still open and available
   */
  async validateOrderStillValid(orderId) {
    try {
      const result = await pool.query(`
        SELECT status FROM orders 
        WHERE id = $1 AND status = 'OPEN'
      `, [orderId]);

      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error validating order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Validate margin requirements for match execution
   */
  async validateMarginForExecution(match) {
    try {
      const { buyOrder, sellOrder, executionPrice, matchQuantity } = match;

      // Calculate required margin for both sides
      const buyRequiredMargin = (matchQuantity * executionPrice) / buyOrder.leverage;
      const sellRequiredMargin = (matchQuantity * executionPrice) / sellOrder.leverage;

      // Check if users have sufficient margin
      if (buyOrder.margin < buyRequiredMargin || sellOrder.margin < sellRequiredMargin) {
        return false;
      }

      // Check available margin for any additional requirements
      const additionalBuyMargin = Math.max(0, buyRequiredMargin - buyOrder.margin);
      const additionalSellMargin = Math.max(0, sellRequiredMargin - sellOrder.margin);

      if (additionalBuyMargin > buyOrder.availableMargin || 
          additionalSellMargin > sellOrder.availableMargin) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating margin for execution:', error);
      return false;
    }
  }

  /**
   * Validate risk management constraints
   */
  async validateRiskConstraints(match) {
    try {
      const { buyOrder, sellOrder, executionPrice, matchQuantity } = match;
      const positionValue = matchQuantity * executionPrice;

      // Check position size limits
      if (positionValue > orderConfig.MAX_SINGLE_ORDER_EXPOSURE) {
        return false;
      }

      // Check user exposure limits
      for (const order of [buyOrder, sellOrder]) {
        const userExposure = await this.calculateUserExposure(order.userId);
        if (userExposure + positionValue > orderConfig.MAX_TOTAL_USER_EXPOSURE) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating risk constraints:', error);
      return false;
    }
  }

  /**
   * Calculate user's total exposure
   */
  async calculateUserExposure(userId) {
    try {
      const result = await pool.query(`
        SELECT SUM(quantity * COALESCE(price, 50000)) as total_exposure
        FROM orders 
        WHERE user_id = $1 AND status IN ('OPEN', 'PARTIAL')
      `, [userId]);

      return parseFloat(result.rows[0]?.total_exposure || 0);
    } catch (error) {
      console.error(`Error calculating exposure for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Execute validated matches
   */
  async executeMatches(validMatches) {
    const successful = [];
    const failed = [];

    // Group matches for batch processing
    const batches = this.createExecutionBatches(validMatches);

    for (const batch of batches) {
      try {
        const batchResult = await this.executeBatch(batch);
        successful.push(...batchResult.successful);
        failed.push(...batchResult.failed);
      } catch (error) {
        console.error('Error executing batch:', error);
        failed.push(...batch.map(match => ({
          match,
          error: error.message
        })));
      }
    }

    return { successful, failed };
  }

  /**
   * Create batches for efficient execution
   */
  createExecutionBatches(matches, maxBatchSize = 20) {
    const batches = [];
    for (let i = 0; i < matches.length; i += maxBatchSize) {
      batches.push(matches.slice(i, i + maxBatchSize));
    }
    return batches;
  }

  /**
   * Execute a batch of matches in a transaction
   */
  async executeBatch(batch) {
    const client = await pool.connect();
    const successful = [];
    const failed = [];

    try {
      await client.query('BEGIN');

      for (const match of batch) {
        try {
          const result = await this.executeMatch(client, match);
          if (result.success) {
            successful.push({
              match,
              executionResult: result
            });
          } else {
            failed.push({
              match,
              error: result.error
            });
          }
        } catch (error) {
          failed.push({
            match,
            error: error.message
          });
        }
      }

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return { successful, failed };
  }

  /**
   * Execute a single match
   */
  async executeMatch(client, match) {
    const { buyOrder, sellOrder, executionPrice, matchQuantity } = match;

    try {
      // Update buy order
      const buyResult = await this.updateOrderExecution(
        client, 
        buyOrder.id, 
        matchQuantity, 
        executionPrice
      );

      // Update sell order
      const sellResult = await this.updateOrderExecution(
        client, 
        sellOrder.id, 
        matchQuantity, 
        executionPrice
      );

      // Record the trade
      const tradeId = await this.recordTrade(client, {
        buyOrderId: buyOrder.id,
        sellOrderId: sellOrder.id,
        price: executionPrice,
        quantity: matchQuantity,
        buyUserId: buyOrder.userId,
        sellUserId: sellOrder.userId
      });

      return {
        success: true,
        tradeId,
        buyOrderUpdate: buyResult,
        sellOrderUpdate: sellResult,
        executionPrice,
        quantity: matchQuantity
      };

    } catch (error) {
      console.error(`Error executing match ${buyOrder.id}-${sellOrder.id}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update order after execution
   */
  async updateOrderExecution(client, orderId, executedQuantity, executionPrice) {
    // Get current order
    const orderResult = await client.query(`
      SELECT * FROM orders WHERE id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = orderResult.rows[0];
    const currentQuantity = parseFloat(order.quantity);
    const remainingQuantity = currentQuantity - executedQuantity;

    // Determine new status
    let newStatus;
    if (remainingQuantity <= 0.0001) { // Consider floating point precision
      newStatus = 'FILLED';
    } else {
      newStatus = 'PARTIAL';
    }

    // Update order
    const updateResult = await client.query(`
      UPDATE orders 
      SET 
        quantity = $1,
        status = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [Math.max(0, remainingQuantity), newStatus, orderId]);

    return {
      orderId,
      newQuantity: remainingQuantity,
      executedQuantity,
      newStatus,
      executionPrice
    };
  }

  /**
   * Record a completed trade
   */
  async recordTrade(client, tradeData) {
    const { buyOrderId, sellOrderId, price, quantity, buyUserId, sellUserId } = tradeData;

    const result = await client.query(`
      INSERT INTO trades (
        buy_order_id, 
        sell_order_id, 
        price, 
        quantity, 
        buy_user_id, 
        sell_user_id,
        executed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id
    `, [buyOrderId, sellOrderId, price, quantity, buyUserId, sellUserId]);

    return result.rows[0].id;
  }

  /**
   * Update matching statistics
   */
  updateMatchingStats(executionResults) {
    const successfulMatches = executionResults.successful;
    
    if (successfulMatches.length > 0) {
      this.matchingStats.totalMatches += successfulMatches.length;
      
      const totalVolume = successfulMatches.reduce((sum, result) => {
        return sum + (result.executionResult.executionPrice * result.executionResult.quantity);
      }, 0);
      
      this.matchingStats.totalVolume += totalVolume;
      this.matchingStats.lastMatchTime = new Date().toISOString();

      // Calculate average spread
      const spreads = successfulMatches.map(result => 
        result.match.buyOrder.price - result.match.sellOrder.price
      );
      this.matchingStats.averageSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
    }
  }

  /**
   * Get matching engine statistics
   */
  getStats() {
    return {
      ...this.matchingStats,
      isProcessing: this.isProcessing,
      lastProcessTime: new Date(this.lastProcessTime).toISOString(),
      uptime: Date.now() - this.lastProcessTime
    };
  }

  /**
   * Get order book depth for monitoring
   */
  async getOrderBookDepth() {
    try {
      const result = await pool.query(`
        SELECT 
          side,
          COUNT(*) as order_count,
          SUM(quantity) as total_quantity,
          AVG(price) as avg_price,
          MIN(price) as min_price,
          MAX(price) as max_price
        FROM orders 
        WHERE status = 'OPEN' AND price IS NOT NULL
        GROUP BY side
      `);

      const depth = {
        BUY: { order_count: 0, total_quantity: 0, avg_price: 0, min_price: 0, max_price: 0 },
        SELL: { order_count: 0, total_quantity: 0, avg_price: 0, min_price: 0, max_price: 0 }
      };

      for (const row of result.rows) {
        depth[row.side] = {
          order_count: parseInt(row.order_count),
          total_quantity: parseFloat(row.total_quantity),
          avg_price: parseFloat(row.avg_price),
          min_price: parseFloat(row.min_price),
          max_price: parseFloat(row.max_price)
        };
      }

      return depth;
    } catch (error) {
      console.error('Error getting order book depth:', error);
      return null;
    }
  }
}

module.exports = new OrderMatchingEngine(); 