const pool = require('../config/database');

// GET /orders - Get all orders
const getAllOrdersHandler = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, u.wallet_address 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
};

// GET /orders/:id - Get order by ID
const getOrderByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID' });
    }

    const result = await pool.query(`
      SELECT o.*, u.wallet_address 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE o.id = $1
    `, [parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
};

// GET /orders/user/:userId - Get orders by user ID
const getOrdersByUserHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const result = await pool.query(`
      SELECT o.*, u.wallet_address 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE o.user_id = $1 
      ORDER BY o.created_at DESC
    `, [parseInt(userId)]);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user orders' });
  }
};

// PUT /orders - Create new order
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
        error: 'Required fields: user_id, side, quantity, leverage, margin' 
      });
    }

    // Validate side
    if (!['LONG', 'BUY', 'SELL', 'SHORT'].includes(side.toUpperCase())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Side must be one of: LONG, BUY, SELL, SHORT' 
      });
    }

    // Validate user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const result = await pool.query(`
      INSERT INTO orders (user_id, side, price, quantity, leverage, margin, max_slippage_bps, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `, [
      user_id,
      side.toUpperCase(),
      price || null,
      parseFloat(quantity),
      parseFloat(leverage),
      parseFloat(margin),
      max_slippage_bps || 5,
      status || 'OPEN'
    ]);

    // Get the created order with user info
    const orderWithUser = await pool.query(`
      SELECT o.*, u.wallet_address 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE o.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({ success: true, data: orderWithUser.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
};

// PUT /orders/:id - Update order
const updateOrderHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order ID' });
    }

    // Check if order exists
    const existingOrder = await pool.query('SELECT * FROM orders WHERE id = $1', [parseInt(id)]);
    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Validate side if provided
    if (updateData.side && !['LONG', 'BUY', 'SELL', 'SHORT'].includes(updateData.side.toUpperCase())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Side must be one of: LONG, BUY, SELL, SHORT' 
      });
    }

    // Validate status if provided
    if (updateData.status && !['OPEN', 'FILLED', 'CANCELLED', 'PARTIALLY_FILLED'].includes(updateData.status.toUpperCase())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status must be one of: OPEN, FILLED, CANCELLED, PARTIALLY_FILLED' 
      });
    }

    // Build dynamic update query
    const allowedFields = ['side', 'price', 'quantity', 'leverage', 'margin', 'max_slippage_bps', 'status'];
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        if (field === 'side' || field === 'status') {
          updateValues.push(updateData[field].toUpperCase());
        } else if (['price', 'quantity', 'leverage', 'margin'].includes(field)) {
          updateValues.push(parseFloat(updateData[field]));
        } else {
          updateValues.push(updateData[field]);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());
    paramCount++;

    // Add order ID for WHERE clause
    updateValues.push(parseInt(id));

    const updateQuery = `
      UPDATE orders 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;

    const result = await pool.query(updateQuery, updateValues);

    // Get the updated order with user info
    const orderWithUser = await pool.query(`
      SELECT o.*, u.wallet_address 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      WHERE o.id = $1
    `, [result.rows[0].id]);

    res.json({ success: true, data: orderWithUser.rows[0] });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
};

module.exports = {
  getAllOrdersHandler,
  getOrderByIdHandler,
  getOrdersByUserHandler,
  createOrderHandler,
  updateOrderHandler
}; 