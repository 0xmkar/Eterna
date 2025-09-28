# Perpetual Futures Trading Platform Backend

This Express.js backend provides RESTful API services for managing users and orders in the perpetual futures trading platform using local PostgreSQL database.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. PostgreSQL Database Setup

First, ensure PostgreSQL is installed and running on your system.

Create the database and tables:

```sql
-- Create database
CREATE DATABASE perpetual_futures;

-- Connect to the database
\c perpetual_futures;

-- Create users table
CREATE TABLE public.users (
    id bigserial NOT NULL,
    wallet_address varchar(64) NOT NULL,
    created_at timestamp DEFAULT now() NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_wallet_address_key UNIQUE (wallet_address)
);

-- Create orders table
CREATE TABLE public.orders (
    id bigserial NOT NULL,
    user_id int8 NULL,
    side varchar(4) NOT NULL,
    price numeric NULL,
    quantity numeric NOT NULL,
    leverage numeric NOT NULL,
    margin numeric NOT NULL,
    max_slippage_bps int4 DEFAULT 5 NULL,
    status varchar(16) DEFAULT 'OPEN'::character varying NULL,
    created_at timestamp DEFAULT now() NULL,
    updated_at timestamp DEFAULT now() NULL,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Create perp_prices table (for existing functionality)
CREATE TABLE public.perp_prices (
    id bigserial NOT NULL,
    perp_price numeric NOT NULL,
    timestamp bigint NOT NULL,
    block_number bigint NOT NULL,
    created_at timestamp DEFAULT now() NULL,
    CONSTRAINT perp_prices_pkey PRIMARY KEY (id)
);
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=perpetual_futures
DB_PASSWORD=your_password_here
DB_PORT=5432

# Server Configuration
PORT=3001

```

### 4. Start the Server

```bash
# Production
npm start

# Development (with nodemon)
npm run dev
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### Users API

#### GET /users
Get all users
- **Response**: `{ success: true, data: [users] }`

#### GET /users/:id
Get user by ID
- **Parameters**: `id` (integer) - User ID
- **Response**: `{ success: true, data: user }` or `404` if not found

#### GET /users/wallet/:address
Get user by wallet address
- **Parameters**: `address` (string) - Wallet address
- **Response**: `{ success: true, data: user }` or `404` if not found

#### PUT /users
Create new user
- **Body**:
```json
{
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678"
}
```
- **Response**: `{ success: true, data: newUser }` (201 status)

#### PUT /users/:id
Update user
- **Parameters**: `id` (integer) - User ID
- **Body**:
```json
{
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678"
}
```
- **Response**: `{ success: true, data: updatedUser }`

### Orders API

#### GET /orders
Get all orders (includes user information)
- **Response**: `{ success: true, data: [orders] }`

#### GET /orders/:id
Get order by ID
- **Parameters**: `id` (integer) - Order ID
- **Response**: `{ success: true, data: order }` or `404` if not found

#### GET /orders/user/:userId
Get orders by user ID
- **Parameters**: `userId` (integer) - User ID
- **Response**: `{ success: true, data: [orders] }`

#### PUT /orders
Create new order
- **Body**:
```json
{
  "user_id": 1,
  "side": "LONG",
  "price": 50000.00,
  "quantity": 1.5,
  "leverage": 10.0,
  "margin": 7500.00,
  "max_slippage_bps": 5,
  "status": "OPEN"
}
```
- **Required fields**: `user_id`, `side`, `quantity`, `leverage`, `margin`
- **Valid sides**: `LONG`, `BUY`, `SELL`, `SHORT`
- **Valid statuses**: `OPEN`, `FILLED`, `CANCELLED`, `PARTIALLY_FILLED`
- **Response**: `{ success: true, data: newOrder }` (201 status)

#### PUT /orders/:id
Update order
- **Parameters**: `id` (integer) - Order ID
- **Body**: Any combination of updateable fields:
```json
{
  "side": "SHORT",
  "price": 49000.00,
  "quantity": 2.0,
  "leverage": 15.0,
  "margin": 6500.00,
  "max_slippage_bps": 10,
  "status": "FILLED"
}
```
- **Response**: `{ success: true, data: updatedOrder }`

### Additional Endpoints

#### GET /getPerpPriceData
Get perpetual price data (existing functionality)
- **Query Parameters**: `x`, `y` (integers) - Data range
- **Response**: `{ dataPoints: [...] }`

#### GET /health
Health check endpoint
- **Response**: `{ status: "OK", message: "Server is running" }`

## Database Schema

### Users Table
```sql
CREATE TABLE public.users (
    id bigserial NOT NULL,
    wallet_address varchar(64) NOT NULL,
    created_at timestamp DEFAULT now() NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_wallet_address_key UNIQUE (wallet_address)
);
```

### Orders Table
```sql
CREATE TABLE public.orders (
    id bigserial NOT NULL,
    user_id int8 NULL,
    side varchar(4) NOT NULL,
    price numeric NULL,
    quantity numeric NOT NULL,
    leverage numeric NOT NULL,
    margin numeric NOT NULL,
    max_slippage_bps int4 DEFAULT 5 NULL,
    status varchar(16) DEFAULT 'OPEN'::character varying NULL,
    created_at timestamp DEFAULT now() NULL,
    updated_at timestamp DEFAULT now() NULL,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

### Perp Prices Table
```sql
CREATE TABLE public.perp_prices (
    id bigserial NOT NULL,
    perp_price numeric NOT NULL,
    timestamp bigint NOT NULL,
    block_number bigint NOT NULL,
    created_at timestamp DEFAULT now() NULL,
    CONSTRAINT perp_prices_pkey PRIMARY KEY (id)
);
```

## Project Structure

```
backend/
├── config/
│   └── database.js          # PostgreSQL connection configuration
├── services/
│   ├── userService.js       # User business logic handlers
│   └── orderService.js      # Order business logic handlers
├── routes/
│   ├── users.js            # User route definitions
│   └── orders.js           # Order route definitions
├── db.js                   # Database functions for existing functionality
├── index.js                # Main server file
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (create this)
└── README.md               # This file
```

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```


## Example Usage

### Create a user:
```bash
curl -X PUT http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "0x1234567890abcdef1234567890abcdef12345678"}'
```

### Create an order:
```bash
curl -X PUT http://localhost:3001/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "side": "LONG",
    "price": 50000.00,
    "quantity": 1.5,
    "leverage": 10.0,
    "margin": 7500.00,
    "max_slippage_bps": 5
  }'
```

### Get user orders:
```bash
curl http://localhost:3001/orders/user/1
```

### Check server health:
```bash
curl http://localhost:3001/health
```

## Development

For development with auto-restart on file changes:
```bash
npm run dev
```

## Order Matching System

The backend includes an automated order matching engine that runs every 2 seconds as a cron job.

### Features

- **Automated Matching**: Orders are automatically matched based on price and slippage tolerance
- **Slippage Protection**: Respects `max_slippage_bps` setting for each order
- **Smart Contract Integration**: Executes trades via blockchain using `bulkTransfer` function
- **Trade Recording**: All executed trades are recorded in the `trades` table
- **Order Status Updates**: Orders are updated to `FILLED` or `PARTIALLY_FILLED` status

### Order Matching API Endpoints

#### GET /order-matching/status
Get order matching system status
- **Response**: 
```json
{
  "success": true,
  "data": {
    "cronJobRunning": true,
    "currentlyProcessing": false,
    "message": "Order matching is active"
  }
}
```

#### POST /order-matching/trigger
Manually trigger order matching process (for testing)
- **Response**: 
```json
{
  "success": true,
  "message": "Order matching process completed"
}
```

### Database Schema Updates

The order matching system requires an additional `trades` table:

```sql
-- Create trades table for storing executed trade records
CREATE TABLE IF NOT EXISTS public.trades (
    id bigserial NOT NULL,
    buy_order_id int8 NOT NULL,
    sell_order_id int8 NOT NULL,
    execution_price numeric NOT NULL,
    quantity numeric NOT NULL,
    buyer_address varchar(42) NOT NULL,
    seller_address varchar(42) NOT NULL,
    trade_value numeric NOT NULL,
    executed_at timestamp DEFAULT now() NULL,
    created_at timestamp DEFAULT now() NULL,
    CONSTRAINT trades_pkey PRIMARY KEY (id),
    CONSTRAINT trades_buy_order_id_fkey FOREIGN KEY (buy_order_id) REFERENCES public.orders(id),
    CONSTRAINT trades_sell_order_id_fkey FOREIGN KEY (sell_order_id) REFERENCES public.orders(id)
);
```

Run the migration script: `backend/migrations/create_trades_table.sql`

### Environment Variables

Additional environment variables required for order matching:

```env
# Smart Contract Configuration
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
PRIVATE_KEY=your_private_key_here
RPC_URL=https://public-node.testnet.rsk.co

# Order Matching Configuration
ORDER_MATCHING_ENABLED=true
ORDER_MATCHING_INTERVAL_SECONDS=2
```
