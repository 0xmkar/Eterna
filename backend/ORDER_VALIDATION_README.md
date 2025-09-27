# Order Validation System for Perpetual Futures DEX

This document describes the comprehensive order validation system implemented for the perpetual futures DEX with order book functionality.

## Overview

The validation system implements both **database-level constraints** and **application-level validation** to ensure only valid orders enter the system. It covers user eligibility, order parameters, margin requirements, risk management, and market protection mechanisms.

## Database Schema Changes

### 1. Enhanced Orders Table

```sql
-- Updated orders table with comprehensive constraints
CREATE TABLE public.orders (
    id bigserial NOT NULL,
    user_id int8 NOT NULL,
    side order_side_enum NOT NULL,  -- ENUM: 'BUY', 'SELL'
    price numeric(20,8) NULL,
    quantity numeric(20,8) NOT NULL,
    leverage numeric(8,2) NOT NULL,
    margin numeric(20,8) NOT NULL,
    max_slippage_bps int4 DEFAULT 5 NOT NULL,
    status order_status_enum DEFAULT 'OPEN' NOT NULL,  -- ENUM: 'OPEN', 'FILLED', 'PARTIAL', 'CANCELED'
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Primary and foreign keys
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
    
    -- Validation constraints
    CONSTRAINT check_price_positive CHECK (price IS NULL OR price > 0),
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_quantity_min CHECK (quantity >= 0.001),
    CONSTRAINT check_quantity_max CHECK (quantity <= 1000000),
    CONSTRAINT check_leverage_range CHECK (leverage >= 1 AND leverage <= 20),
    CONSTRAINT check_margin_positive CHECK (margin > 0),
    CONSTRAINT check_slippage_range CHECK (max_slippage_bps >= 0 AND max_slippage_bps <= 5000),
    CONSTRAINT check_margin_minimum CHECK (price IS NULL OR margin >= (quantity * price * 0.05))
);
```

### 2. Configuration Table

```sql
-- Order configuration for dynamic limits
CREATE TABLE order_config (
    id serial PRIMARY KEY,
    key varchar(50) UNIQUE NOT NULL,
    value varchar(100) NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);
```

### 3. User Extensions

```sql
-- Added user status fields
ALTER TABLE users ADD COLUMN is_banned boolean DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN is_liquidated boolean DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN total_margin numeric(20,8) DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN available_margin numeric(20,8) DEFAULT 0 NOT NULL;
```

### 4. Database Triggers

- **Auto-update timestamps**: `updated_at` automatically updated on order changes
- **Order validation trigger**: Server-side validation using PostgreSQL functions
- **User status checks**: Prevents orders from banned/liquidated users

## Validation Rules Implemented

### 1. User Checks ✅
- ✅ `user_id` must exist in `users` table (FK constraint)
- ✅ User must not be banned (`is_banned = false`)
- ✅ User must not be liquidated (`is_liquidated = false`)
- ✅ User must have sufficient available margin

### 2. Side Validation ✅
- ✅ Only allows 'BUY' or 'SELL' (enum constraint)
- ✅ Application-level validation with proper error messages

### 3. Price and Slippage ✅
- ✅ If `price IS NOT NULL`, enforces `price > 0`
- ✅ Enforces `max_slippage_bps BETWEEN 0 AND 5000`
- ✅ Market price deviation checks (max 10% from current market)

### 4. Quantity Validation ✅
- ✅ Must be > 0
- ✅ Must be >= minimum order size (configurable, default 0.001)
- ✅ Must be <= maximum order size (configurable, default 1,000,000)
- ✅ Market impact validation (max 20% of order book depth)

### 5. Leverage & Margin ✅
- ✅ `leverage >= 1` and `leverage <= MAX_ALLOWED_LEVERAGE` (default 20)
- ✅ Enhanced margin calculation: `margin >= (quantity * price / leverage) * maintenance_ratio`
- ✅ Maintenance margin ratio enforcement (5% + 20% buffer)
- ✅ Available margin sufficiency check

### 6. Status Validation ✅
- ✅ Restricts `status` to enum values: `OPEN`, `FILLED`, `PARTIAL`, `CANCELED`
- ✅ Proper status transitions with margin management

### 7. Timestamps ✅
- ✅ `created_at` and `updated_at` default to `now()`
- ✅ Auto-update `updated_at` on every update via trigger

## Additional Validation Features

### Risk Management
- **Position Limits**: Max $1M per order, $5M total exposure per user
- **Leverage Concentration**: Max 3 high-leverage positions (>10x) per user
- **Exposure Tracking**: Real-time calculation of user's total market exposure

### Market Protection
- **Price Deviation Alerts**: Warns on orders >10% from market price
- **Order Book Impact**: Prevents orders that would consume >20% of market depth
- **Manipulative Order Detection**: Flags potentially harmful price levels

### Performance Optimizations
- **Quick Validation**: Fast path for high-frequency trading scenarios
- **Indexed Queries**: Optimized database indexes for order book operations
- **Connection Pooling**: Efficient database connection management

## API Endpoints

### Create Order
```
PUT /api/orders
```

**Request Body:**
```json
{
  "user_id": 1,
  "side": "BUY",
  "price": 50000.00,
  "quantity": 0.1,
  "leverage": 10,
  "margin": 500.00,
  "max_slippage_bps": 50
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": 1,
    "side": "BUY",
    "price": "50000.00000000",
    "quantity": "0.10000000",
    "leverage": "10.00",
    "margin": "500.00000000",
    "max_slippage_bps": 50,
    "status": "OPEN",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z",
    "wallet_address": "0x..."
  },
  "warnings": [],
  "metadata": {
    "marginInfo": {...},
    "marketInfo": {...},
    "riskInfo": {...}
  }
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "error": "Order validation failed",
  "details": [
    "Insufficient margin. Required: 520.00000000, Provided: 500",
    "Order quantity 0.1 is below minimum order size 0.001"
  ],
  "warnings": [
    "Order price deviates from market price by 8%"
  ]
}
```

### Other Endpoints

- `GET /api/orders` - List orders with filtering and pagination
- `GET /api/orders/orderbook` - Get order book with market depth
- `GET /api/orders/config` - Get current validation configuration
- `PUT /api/orders/:id/cancel` - Cancel an order
- `PUT /api/orders/:id/status` - Update order status (internal)

## Configuration

All validation limits are configurable via the `order_config` table:

```sql
INSERT INTO order_config (key, value, description) VALUES 
('MIN_ORDER_SIZE', '0.0001', 'Minimum order quantity allowed'),
('MAX_ORDER_SIZE', '1000000', 'Maximum order quantity allowed'),
('MAX_LEVERAGE', '20', 'Maximum leverage allowed'),
('MAINTENANCE_MARGIN_RATIO', '0.05', 'Maintenance margin ratio (5%)'),
('MAX_SLIPPAGE_BPS', '5000', 'Maximum slippage in basis points (50%)');
```

## Error Handling

The system provides detailed error messages for different validation failures:

- **User Errors**: "User account is banned", "User not found"
- **Parameter Errors**: "Quantity must be a positive number"
- **Margin Errors**: "Insufficient available margin. Available: X, Required: Y"
- **Risk Errors**: "Total exposure would exceed limit"
- **Market Errors**: "Order size too large relative to market depth"

## Usage Examples

### Basic Order Creation
```javascript
const enhancedOrderService = require('./services/enhancedOrderService');

// Create a market buy order
const result = await enhancedOrderService.createOrder(
  userId: 1,
  side: 'BUY',
  price: null,  // Market order
  quantity: 0.1,
  leverage: 5,
  margin: 1000
);

if (result.success) {
  console.log('Order created:', result.data);
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
} else {
  console.error('Order failed:', result.error);
  console.error('Details:', result.details);
}
```

### Order Book Access
```javascript
// Get order book with custom depth
const orderBook = await enhancedOrderService.getOrderBook(20);
console.log('Best bid:', orderBook.data.bestBid);
console.log('Best ask:', orderBook.data.bestAsk);
console.log('Spread:', orderBook.data.spread);
```

## Database Setup

Run the following SQL script to set up the enhanced order validation:

```bash
psql -d your_database -f backend/schema/orders_schema.sql
```

This will:
1. Create the enhanced orders table with all constraints
2. Set up enums for order sides and statuses
3. Create validation triggers and functions
4. Insert default configuration values
5. Add necessary indexes for performance

## Testing

The validation system includes comprehensive tests for:
- All constraint violations
- Edge cases and boundary conditions
- Performance under load
- Error message accuracy
- Margin calculation correctness

Run tests with:
```bash
npm test
```

## Security Considerations

- All user inputs are sanitized and validated
- SQL injection protection via parameterized queries
- Rate limiting on order creation endpoints
- User authorization checks for order operations
- Audit logging for all order state changes

## Performance

- Database constraints provide fast validation
- Application-level validation adds business logic
- Optimized queries with proper indexing
- Connection pooling for high throughput
- Configurable quick validation for HFT scenarios

## Maintenance

- Monitor `order_config` table for limit adjustments
- Regular review of risk metrics and exposure limits
- Performance monitoring of validation operations
- Audit trail analysis for compliance 