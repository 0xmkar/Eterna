# Eterna - Decentralized Perpetual Futures Trading Platform

![Eterna Logo](FE/public/placeholder-logo.svg)

A decentralized perpetual futures trading platform built on RootStock, enabling high-leverage Bitcoin trading with native rBTC collateral. Eterna provides a complete trading experience with automated order matching, real-time price feeds, and seamless wallet integration.

## 🚀 Features

### Core Trading Features
- **Leverage Trading**: Up to 50x leverage on Bitcoin perpetual futures
- **Native rBTC Support**: Use Bitcoin directly as collateral without wrapping
- **Order-Book**: Real-time order matching with slippage protection
- **Real-time Price Feeds**: Live Bitcoin price data via Redstone Oracle

### Technical Features
- **Smart Contract Integration**: Direct blockchain execution via `bulkTransfer`
- **Order Book**: Real-time order book with depth visualization
- **Trading Charts**: Interactive price charts with technical indicators via TradingView
- **Wallet Integration**: Seamless MetaMask and wallet connection
- **Responsive Design**: Modern UI built with Next.js and Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Backend API    │───▶│ Smart Contract  │
│   (Next.js)     │    │   (Express.js)   │    │  (DDexRBTC.sol) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   PostgreSQL     │
                       │   Database       │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Redstone Oracle │
                       │  (Price Feeds)   │
                       └──────────────────┘
```

## 📁 Project Structure

```
ddex/
├── FE/                          # Frontend (Next.js)
│   ├── app/                     # App router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── trade/              # Trading interface
│   │   ├── portfolio/          # Portfolio management
│   │   └── margin/             # Margin management
│   ├── components/             # React components
│   │   ├── trading-panel.tsx   # Main trading interface
│   │   ├── order-book.tsx      # Order book display
│   │   ├── positions-table.tsx # Position management
│   │   ├── wallet-connect.tsx  # Wallet integration
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API services
│   └── types/                  # TypeScript definitions
├── backend/                     # Backend (Express.js)
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   ├── cronJobs/               # Automated order matching
│   ├── migrations/             # Database migrations
│   └── config/                 # Configuration files
├── contracts/                   # Smart contracts
│   └── DDexRBTC.sol           # Main trading contract
└── README.md                   # This file
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **Wallet**: Ethers.js
- **Oracle**: Redstone Finance

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Native pg driver
- **Blockchain**: Ethers.js
- **Cron Jobs**: node-cron

### Smart Contracts
- **Language**: Solidity ^0.8.19
- **Network**: RootStock Testnet
- **Features**: rBTC deposits, transfers, bulk operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Git
- MetaMask or compatible wallet

### 1. Clone the Repository
```bash
git clone https://github.com/0xmkar/Eterna/
cd ddex
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env.template .env
# Edit .env with your configuration

# Set up PostgreSQL database
# Create database: perpetual_futures
# Run migrations from migrations/ folder

# Start the backend server
npm run dev
```

### 3. Frontend Setup

```bash
cd FE

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Smart Contract Deployment

Deploy the `DDexRBTC.sol` contract to RootStock Testnet and update the contract address in your environment variables.

## ⚙️ Configuration

### Backend Environment Variables

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

# Smart Contract Configuration
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
PRIVATE_KEY=your_private_key_here
RPC_URL=https://public-node.testnet.rsk.co

# Order Matching Configuration
ORDER_MATCHING_ENABLED=true
ORDER_MATCHING_INTERVAL_SECONDS=2
```

### Frontend Environment Variables

Create a `.env.local` file in the FE directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
NEXT_PUBLIC_RPC_URL=https://public-node.testnet.rsk.co
```

## 📊 Database Schema

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

### Trades Table
```sql
CREATE TABLE public.trades (
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

## 🔄 Order Matching System

The platform features an automated order matching engine that:

- **Runs** via cron job
- **Matches orders** based on price and slippage tolerance
- **Executes trades** on-chain via `bulkTransfer` function
- **Updates order status** to `FILLED` or `PARTIALLY_FILLED`
- **Records trades** in the database with transaction hashes

### Order Matching Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cron Job      │───▶│  Order Matching  │───▶│ Smart Contract  │
│                 │    │    Algorithm     │    │  (bulkTransfer) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │    Database      │
                       │  (Update Orders  │
                       │  & Record Trades)│
                       └──────────────────┘
```

## 🎯 API Endpoints

### Users API
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `GET /users/wallet/:address` - Get user by wallet address
- `PUT /users` - Create new user
- `PUT /users/:id` - Update user

### Orders API
- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order by ID
- `GET /orders/user/:userId` - Get orders by user ID
- `PUT /orders` - Create new order
- `PUT /orders/:id` - Update order

### Order Matching API
- `GET /order-matching/status` - Get matching system status
- `POST /order-matching/trigger` - Manually trigger matching

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd FE
npm run test
```

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred hosting service

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform

### Smart Contract Deployment
1. Compile contracts: `npx hardhat compile`
2. Deploy to RootStock Testnet
3. Update contract addresses in environment variables

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [Coming Soon]
- **Smart Contract**: [RootStock Explorer]
- **API Docs**: [Coming Soon]

---

**Built with ❤️ for the RootStock ecosystem**
