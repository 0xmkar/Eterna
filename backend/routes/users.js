const express = require('express');
const router = express.Router();
const {
  getAllUsersHandler,
  getUserByIdHandler,
  getUserByWalletHandler,
  createUserHandler,
  updateUserHandler
} = require('../services/userService');

// Get all users
router.get('/', getAllUsersHandler);

// Get user by ID
router.get('/:id', getUserByIdHandler);

// Get user by wallet address
router.get('/wallet/:address', getUserByWalletHandler);

// Create new user
router.put('/', createUserHandler);

// Update user
router.put('/:id', updateUserHandler);

module.exports = router; 