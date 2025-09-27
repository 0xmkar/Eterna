const pool = require('../config/database');

// GET /users - Get all users
const getAllUsersHandler = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

// GET /users/:id - Get user by ID
const getUserByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

// GET /users/wallet/:address - Get user by wallet address
const getUserByWalletHandler = async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({ success: false, error: 'Wallet address is required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [address]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

// PUT /users - Create new user
const createUserHandler = async (req, res) => {
  try {
    const { wallet_address } = req.body;
    
    if (!wallet_address) {
      return res.status(400).json({ success: false, error: 'Wallet address is required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [wallet_address]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'User with this wallet address already exists' });
    }

    const result = await pool.query(
      'INSERT INTO users (wallet_address) VALUES ($1) RETURNING *',
      [wallet_address]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};

// PUT /users/:id - Update user
const updateUserHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { wallet_address } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    if (!wallet_address) {
      return res.status(400).json({ success: false, error: 'Wallet address is required' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE id = $1', [parseInt(id)]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const result = await pool.query(
      'UPDATE users SET wallet_address = $1 WHERE id = $2 RETURNING *',
      [wallet_address, parseInt(id)]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

module.exports = {
  getAllUsersHandler,
  getUserByIdHandler,
  getUserByWalletHandler,
  createUserHandler,
  updateUserHandler
}; 