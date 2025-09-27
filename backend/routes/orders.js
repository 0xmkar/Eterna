const express = require('express');
const router = express.Router();
const {
  getAllOrdersHandler,
  getOrderByIdHandler,
  getOrdersByUserHandler,
  createOrderHandler,
  updateOrderHandler,
  getOrderBookHandler
} = require('../services/orderService');

router.get('/', getAllOrdersHandler);

router.get('/orderbook', getOrderBookHandler);

router.get('/:id', getOrderByIdHandler);

router.get('/user/:userId', getOrdersByUserHandler);

// Create new order
router.put('/', createOrderHandler);

router.put('/:id', updateOrderHandler);

module.exports = router; 