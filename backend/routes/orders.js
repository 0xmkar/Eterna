const express = require('express');
const router = express.Router();
const enhancedOrderService = require('../services/enhancedOrderService');
const orderConfig = require('../config/orderConfig');

// GET /orders - Get all orders with filtering and pagination
const getAllOrdersHandler = async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId ? parseInt(req.query.userId) : undefined,
      side: req.query.side,
      status: req.query.status,
      priceMin: req.query.priceMin ? parseFloat(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax ? parseFloat(req.query.priceMax) : undefined,
      leverageMin: req.query.leverageMin ? parseFloat(req.query.leverageMin) : undefined,
      leverageMax: req.query.leverageMax ? parseFloat(req.query.leverageMax) : undefined,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: Math.min(
        req.query.limit ? parseInt(req.query.limit) : orderConfig.ORDER_HISTORY_DEFAULT_LIMIT,
        orderConfig.MAX_ORDER_HISTORY_LIMIT
      ),
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC'
    };

    const result = await enhancedOrderService.getOrders(filters, pagination);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in getAllOrdersHandler:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch orders',
      details: [error.message]
    });
  }
};

// GET /orders/orderbook - Get order book
const getOrderBookHandler = async (req, res) => {
  try {
    const depth = Math.min(
      req.query.depth ? parseInt(req.query.depth) : orderConfig.ORDER_BOOK_DEFAULT_DEPTH,
      orderConfig.MAX_ORDER_BOOK_DEPTH
    );

    const result = await enhancedOrderService.getOrderBook(depth);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in getOrderBookHandler:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch order book',
      details: [error.message]
    });
  }
};

// GET /orders/config - Get order configuration
const getConfigHandler = async (req, res) => {
  try {
    const result = await enhancedOrderService.getConfig();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in getConfigHandler:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch configuration',
      details: [error.message]
    });
  }
};

// PUT /orders - Create new order with comprehensive validation
const createOrderHandler = async (req, res) => {
  try {
    const { 
      user_id, 
      side, 
      price, 
      quantity, 
      leverage, 
      margin, 
      max_slippage_bps,
      status 
    } = req.body;
    
    
    // Validate required fields
    if (!user_id || !side || !quantity || !leverage || !margin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        details: ['Required fields: user_id, side, quantity, leverage, margin']
      });
    }

    const result = await enhancedOrderService.createOrder(
      user_id,
      side,
      price || null,
      quantity,
      leverage,
      margin,
      max_slippage_bps,
      status
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in createOrderHandler:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create order',
      details: [error.message]
    });
  }
};

// PUT /orders/:id/cancel - Cancel an order
const cancelOrderHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body; // Optional user validation
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid order ID' 
      });
    }

    const result = await enhancedOrderService.cancelOrder(
      parseInt(id),
      user_id ? parseInt(user_id) : null
    );

    if (result.success) {
      res.json(result);
    } else {
      const statusCode = result.error.includes('Unauthorized') ? 403 : 
                        result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error('Error in cancelOrderHandler:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel order',
      details: [error.message]
    });
  }
};

// PUT /orders/:id/status - Update order status (for internal use)
const updateOrderStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, executedPrice, executedQuantity } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid order ID' 
      });
    }

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status is required' 
      });
    }

    const result = await enhancedOrderService.updateOrderStatus(
      parseInt(id),
      status,
      executedPrice ? parseFloat(executedPrice) : null,
      executedQuantity ? parseFloat(executedQuantity) : null
    );

    if (result.success) {
      res.json(result);
    } else {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error('Error in updateOrderStatusHandler:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update order status',
      details: [error.message]
    });
  }
};

// Route definitions
router.get('/', getAllOrdersHandler);
router.get('/orderbook', getOrderBookHandler);
router.get('/config', getConfigHandler);
router.put('/', createOrderHandler);
router.put('/:id/cancel', cancelOrderHandler);
router.put('/:id/status', updateOrderStatusHandler);

module.exports = router; 