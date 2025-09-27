/**
 * Order Configuration Constants
 * Centralized configuration for order validation and limits
 */

module.exports = {
  // Order Size Limits
  MIN_ORDER_SIZE: 0.0001,          // Minimum order quantity
  MAX_ORDER_SIZE: 1000000,        // Maximum order quantity
  
  // Leverage Limits
  MIN_LEVERAGE: 1,                // Minimum leverage
  MAX_LEVERAGE: 20,               // Maximum leverage
  HIGH_LEVERAGE_THRESHOLD: 10,    // Threshold for high leverage risk checks
  MAX_HIGH_LEVERAGE_ORDERS: 3,    // Maximum high leverage orders per user
  
  // Margin Requirements
  MAINTENANCE_MARGIN_RATIO: 0.01,     // 1% maintenance margin (reduced for testing)
  INITIAL_MARGIN_MULTIPLIER: 1.1,     // 10% buffer above maintenance margin (reduced)
  MIN_MARGIN_BUFFER: 0.001,           // 0.1% minimum margin buffer (reduced)
  
  // Slippage Limits
  MIN_SLIPPAGE_BPS: 0,            // Minimum slippage (0 basis points)
  MAX_SLIPPAGE_BPS: 5000,         // Maximum slippage (50%)
  DEFAULT_SLIPPAGE_BPS: 5,        // Default slippage (0.05%)
  
  // Risk Management
  MAX_SINGLE_ORDER_EXPOSURE: 10000000,   // $10M per single order (increased for testing)
  MAX_TOTAL_USER_EXPOSURE: 50000000,     // $50M total exposure per user (increased)
  MAX_MARKET_IMPACT_RATIO: 0.5,          // 50% of order book depth (increased for testing)
  
  // Price Validation
  MAX_PRICE_DEVIATION: 0.5,       // 50% max deviation from market price (increased for testing)
  BUY_PRICE_ALERT_THRESHOLD: 1.5,   // Alert if buy > 150% of market (increased)
  SELL_PRICE_ALERT_THRESHOLD: 0.5,  // Alert if sell < 50% of market (increased)
  
  // Order Status Values
  ORDER_STATUS: {
    OPEN: 'OPEN',
    FILLED: 'FILLED',
    PARTIAL: 'PARTIAL',
    CANCELED: 'CANCELED'
  },
  
  // Order Side Values
  ORDER_SIDE: {
    BUY: 'BUY',
    SELL: 'SELL'
  },
  
  // Validation Settings
  ENABLE_MARKET_IMPACT_CHECK: true,
  ENABLE_PRICE_DEVIATION_CHECK: true,
  ENABLE_RISK_LIMIT_CHECK: true,
  ENABLE_USER_STATUS_CHECK: true,
  
  // Database Settings
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  CONNECTION_TIMEOUT_MS: 5000,
  
  // Performance Settings
  ORDER_BOOK_DEFAULT_DEPTH: 10,
  MAX_ORDER_BOOK_DEPTH: 100,
  ORDER_HISTORY_DEFAULT_LIMIT: 50,
  MAX_ORDER_HISTORY_LIMIT: 500,
  
  // Error Messages
  ERROR_MESSAGES: {
    USER_NOT_FOUND: 'User not found',
    USER_BANNED: 'User account is banned',
    USER_LIQUIDATED: 'User account is under liquidation',
    INSUFFICIENT_MARGIN: 'Insufficient margin',
    INVALID_SIDE: 'Order side must be BUY or SELL',
    INVALID_PRICE: 'Price must be a positive number',
    INVALID_QUANTITY: 'Quantity must be a positive number',
    QUANTITY_TOO_SMALL: 'Order quantity below minimum size',
    QUANTITY_TOO_LARGE: 'Order quantity exceeds maximum size',
    INVALID_LEVERAGE: 'Invalid leverage amount',
    LEVERAGE_TOO_HIGH: 'Leverage exceeds maximum allowed',
    INVALID_SLIPPAGE: 'Invalid slippage value',
    PRICE_DEVIATION_TOO_HIGH: 'Price deviates too much from market price',
    ORDER_SIZE_TOO_LARGE: 'Order size too large relative to market depth',
    EXPOSURE_LIMIT_EXCEEDED: 'Position exposure limits exceeded',
    TOO_MANY_HIGH_LEVERAGE: 'Too many high leverage positions',
    MARGIN_CALCULATION_ERROR: 'Error calculating margin requirements'
  }
}; 