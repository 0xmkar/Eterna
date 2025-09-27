# Order Matching and Smart Contract Execution System

This document describes the comprehensive order matching engine that automatically processes orders every 2 seconds, matches them based on price, quantity, and slippage tolerance, and executes trades through smart contract interactions.

## Overview

The system consists of three main components:
1. **Order Matching Engine** - Finds compatible buy/sell orders based on price and slippage
2. **Contract Execution Service** - Executes matched trades on the Rootstock blockchain
3. **Cron Job Service** - Orchestrates the entire process with automated scheduling

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cron Jobs     │    │  Order Matching  │    │   Contract      │
│   (Every 2s)    │───▶│     Engine       │───▶│   Execution     │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │                        ▼                       ▼
         │              ┌──────────────────┐    ┌─────────────────┐
         │              │   PostgreSQL     │    │   DDexRBTC      │
         │              │   Database       │    │   Contract      │
         │              │                  │    │   (Rootstock)   │
         └──────────────▶└──────────────────┘    └─────────────────┘
```

## Components

### 1. Order Matching Engine (`orderMatchingEngine.js`)

The core matching algorithm that:
- Fetches open orders from the database
- Finds compatible buy/sell pairs based on:
  - **Price matching**: Buy price ≥ Sell price
  - **Slippage tolerance**: Within each order's max slippage
  - **User validation**: Different users, active accounts
  - **Risk management**: Position and exposure limits

#### Matching Algorithm

```javascript
// Example of matching logic
for (buyOrder of buyOrders) {
  for (sellOrder of sellOrders) {
    // Price compatibility
    if (buyOrder.price >= sellOrder.price) {
      // Calculate slippage
      const executionPrice = (buyOrder.price + sellOrder.price) / 2;
      const buySlippage = calculateSlippage(buyOrder.price, executionPrice, 'BUY');
      const sellSlippage = calculateSlippage(sellOrder.price, executionPrice, 'SELL');
      
      // Check slippage tolerance
      if (buySlippage <= buyOrder.maxSlippageBps && 
          sellSlippage <= sellOrder.maxSlippageBps) {
        // Create match
        matches.push({
          buyOrder,
          sellOrder,
          executionPrice,
          quantity: Math.min(buyOrder.quantity, sellOrder.quantity)
        });
      }
    }
  }
}
```

### 2. Contract Execution Service (`contractExecutionService.js`)

Handles blockchain interactions:
- **Smart Contract Integration**: Uses ethers.js to interact with DDexRBTC contract
- **Bulk Transfers**: Executes multiple trades in single transaction using `bulkTransfer()`
- **Gas Optimization**: Dynamic gas price calculation and estimation
- **Balance Validation**: Pre-execution balance checks
- **Transaction Monitoring**: Real-time status tracking

#### Smart Contract Integration

```javascript
// Execute trades on contract
const tx = await contract.bulkTransfer(senders, recipients, amounts, {
  gasLimit: estimatedGas,
  gasPrice: optimalGasPrice
});

// Wait for confirmation
const receipt = await tx.wait();
```

### 3. Cron Job Service (`cronJobService.js`)

Orchestrates the entire process:
- **Order Processing**: Every 2 seconds
- **Contract Execution**: Every 5 seconds  
- **Health Monitoring**: Every minute
- **Manual Triggers**: API endpoints for testing
- **Graceful Shutdown**: Proper cleanup on process termination

## Database Schema

### Trades Table

```sql
CREATE TABLE public.trades (
    id bigserial NOT NULL,
    buy_order_id int8 NOT NULL,
    sell_order_id int8 NOT NULL,
    price numeric(20,8) NOT NULL,
    quantity numeric(20,8) NOT NULL,
    buy_user_id int8 NOT NULL,
    sell_user_id int8 NOT NULL,
    execution_status varchar(20) DEFAULT 'PENDING' NOT NULL,
    transaction_hash varchar(66) NULL,
    block_number int8 NULL,
    gas_used varchar(50) NULL,
    execution_error text NULL,
    executed_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
```

### Trade Flow

1. **Order Creation** → Orders table (OPEN status)
2. **Order Matching** → Trades table (PENDING status) 
3. **Contract Execution** → Trades table (EXECUTED status)
4. **Order Updates** → Orders table (FILLED/PARTIAL status)

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_USER=dex
DB_PASSWORD=dex
DB_NAME=dexdb
DB_HOST=localhost
DB_PORT=5432

# Blockchain Configuration
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
RPC_URL=https://public-node.rsk.co

# Server Configuration
PORT=3001
```

### Order Matching Configuration

The system uses configurable parameters stored in the database:

```sql
INSERT INTO order_config (key, value, description) VALUES 
('MIN_ORDER_SIZE', '0.0001', 'Minimum order quantity allowed'),
('MAX_ORDER_SIZE', '1000000', 'Maximum order quantity allowed'),
('MAX_LEVERAGE', '20', 'Maximum leverage allowed'),
('MAINTENANCE_MARGIN_RATIO', '0.05', 'Maintenance margin ratio (5%)'),
('MAX_SLIPPAGE_BPS', '5000', 'Maximum slippage in basis points (50%)');
```

## API Endpoints

### Cron Management

```bash
# Start the cron job service
POST /cron/start

# Stop the cron job service  
POST /cron/stop

# Get service status
GET /cron/status

# Manual trigger order matching
POST /cron/trigger/matching

# Manual trigger contract execution
POST /cron/trigger/execution
```

### Monitoring

```bash
# Get order matching statistics
GET /cron/matching/stats

# Get order book depth
GET /cron/matching/depth

# Get pending trades
GET /cron/trades/pending

# System health check
GET /cron/health
```

### Response Examples

#### Cron Status Response
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalRuns": 1450,
      "successfulRuns": 1449,
      "failedRuns": 1,
      "isRunning": true,
      "totalMatches": 47,
      "totalTrades": 47,
      "successRate": "99.93%",
      "averageProcessingTime": 45.2
    },
    "healthReport": {
      "timestamp": "2024-01-01T12:00:00.000Z",
      "orderMatching": {...},
      "contractService": {...}
    }
  }
}
```

#### Manual Trigger Response
```json
{
  "success": true,
  "matches": [
    {
      "match": {
        "buyOrder": {...},
        "sellOrder": {...},
        "executionPrice": 50000,
        "matchQuantity": 0.1
      },
      "executionResult": {
        "tradeId": 123,
        "transactionHash": "0xabc...",
        "gasUsed": "150000"
      }
    }
  ],
  "processingTime": 234
}
```

## Deployment

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Set Up Database

```bash
# Run the database schemas
psql -d your_database -f schema/orders_schema.sql
psql -d your_database -f schema/trades_schema.sql
```

### 3. Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

### 4. Start the Server

```bash
npm start
# or for development
npm run dev
```

The server will:
1. Start on port 3001 [[memory:7284266]]
2. Initialize database connections
3. Start the cron job service after 2 seconds
4. Begin processing orders automatically

### 5. Verify Operation

```bash
# Check system health
curl http://localhost:3001/cron/health

# Check if cron is running
curl http://localhost:3001/cron/status

# View order book depth
curl http://localhost:3001/cron/matching/depth
```

## Order Matching Process Flow

### 1. Order Placement
- Users place orders via `PUT /orders` endpoint
- Orders undergo comprehensive validation
- Valid orders are stored with `OPEN` status

### 2. Automated Matching (Every 2 seconds)
```
1. Fetch open buy and sell orders
2. Sort by price priority (buy DESC, sell ASC)
3. Find compatible pairs:
   - Price matching (buy >= sell)
   - Slippage tolerance check
   - User validation (different users)
   - Risk limit validation
4. Create trade records with PENDING status
5. Update order quantities and status
```

### 3. Contract Execution (Every 5 seconds)
```
1. Fetch pending trades
2. Validate user balances on contract
3. Prepare bulk transfer data
4. Execute bulkTransfer() transaction
5. Wait for confirmation
6. Update trade status to EXECUTED
```

### 4. Order Lifecycle
- `OPEN` → `PARTIAL` → `FILLED` (successful execution)
- `OPEN` → `CANCELED` (manual cancellation)

## Slippage Calculation

The system calculates slippage for both buy and sell orders:

```javascript
function calculateSlippage(expectedPrice, executionPrice, side) {
  if (side === 'BUY') {
    // For buy orders, slippage when execution > expected
    if (executionPrice > expectedPrice) {
      return Math.round(((executionPrice - expectedPrice) / expectedPrice) * 10000);
    }
  } else {
    // For sell orders, slippage when execution < expected  
    if (executionPrice < expectedPrice) {
      return Math.round(((expectedPrice - executionPrice) / expectedPrice) * 10000);
    }
  }
  return 0; // No slippage (favorable execution)
}
```

## Risk Management

### Position Limits
- **Single Order**: Maximum $1M exposure per order
- **User Total**: Maximum $5M total exposure per user
- **Leverage Concentration**: Maximum 3 high-leverage positions (>10x)

### Market Protection
- **Price Deviation**: Orders cannot deviate >10% from market price
- **Market Impact**: Orders cannot consume >20% of order book depth
- **Balance Verification**: Pre-execution balance checks on smart contract

## Monitoring and Alerting

### Health Checks
The system provides comprehensive health monitoring:

```javascript
{
  "status": "healthy",
  "components": {
    "cronService": "healthy",
    "orderMatching": "healthy", 
    "contractService": "healthy",
    "database": "healthy"
  },
  "metrics": {
    "totalMatches": 1250,
    "averageProcessingTime": 45,
    "successRate": "99.8%"
  }
}
```

### Performance Metrics
- **Processing Time**: Average order matching time
- **Success Rate**: Percentage of successful runs
- **Match Rate**: Number of successful matches per minute
- **Gas Usage**: Average gas consumption per transaction

## Error Handling

### Common Scenarios
1. **No Matching Orders**: Normal operation, no action needed
2. **Insufficient Balance**: Skip trade, log warning
3. **Gas Price Spike**: Retry with higher gas price
4. **Network Congestion**: Queue trades for next cycle
5. **Contract Error**: Mark trades as failed, alert admin

### Recovery Mechanisms
- **Automatic Retry**: Failed operations retry on next cycle
- **Manual Intervention**: API endpoints for manual processing
- **Circuit Breaker**: Pause system on repeated failures
- **Graceful Shutdown**: Clean stop on system signals

## Security Considerations

### Private Key Management
- Store private keys securely (use environment variables)
- Consider using hardware wallets for production
- Implement key rotation policies

### Access Control
- Protect admin endpoints with authentication
- Rate limit API calls
- Monitor for suspicious activity

### Smart Contract Security
- Validate all transaction parameters
- Implement slippage protection
- Use multi-signature wallets for contract ownership

## Performance Optimization

### Database Optimization
- Proper indexing on orders and trades tables
- Connection pooling for high throughput
- Query optimization for large datasets

### Blockchain Optimization
- Batch multiple trades in single transaction
- Dynamic gas pricing for faster execution
- Balance checks before transaction submission

### Memory Management
- Process orders in batches to avoid memory issues
- Clean up completed trade data periodically
- Monitor memory usage and implement limits

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
# Test order matching
curl -X POST http://localhost:3001/cron/trigger/matching

# Test contract execution
curl -X POST http://localhost:3001/cron/trigger/execution
```

### Load Testing
```bash
# Create multiple test orders
for i in {1..100}; do
  curl -X PUT http://localhost:3001/orders \
    -H "Content-Type: application/json" \
    -d '{...order_data...}'
done
```

## Troubleshooting

### Common Issues

1. **Cron Not Starting**
   - Check database connectivity
   - Verify environment variables
   - Review server logs

2. **No Matches Found**
   - Verify order book has compatible orders
   - Check slippage tolerance settings
   - Review price spreads

3. **Contract Execution Failing**
   - Check private key and contract address
   - Verify network connectivity
   - Monitor gas prices

4. **High Memory Usage**
   - Reduce batch sizes
   - Clean up old trade data
   - Restart service periodically

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

This comprehensive order matching system provides automated, efficient, and secure trade execution for your perpetual futures DEX, processing orders every 2 seconds with full slippage protection and smart contract integration. 