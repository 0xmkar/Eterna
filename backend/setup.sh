#!/bin/bash

# Order Matching System Setup Script
echo "🚀 Setting up Order Matching and Contract Execution System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
    echo "⚠️  PostgreSQL is not running or not accessible on localhost:5432"
    echo "Please ensure PostgreSQL is installed and running."
    echo "You may need to:"
    echo "  - Start PostgreSQL service"
    echo "  - Create the database: createdb dexdb"
    echo "  - Configure user permissions"
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cat > .env << EOF
# Database Configuration
DB_USER=dex
DB_PASSWORD=dex
DB_NAME=dexdb
DB_HOST=localhost
DB_PORT=5432

# Blockchain Configuration
# Replace with your actual contract address
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
# Replace with your actual private key (keep this secure!)
PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
# Rootstock RPC URL (public node or your own)
RPC_URL=https://public-node.rsk.co

# Server Configuration
PORT=3001
NODE_ENV=development

# Optional: Debug settings
DEBUG=false
LOG_LEVEL=info
EOF
    echo "✅ Created .env file. Please edit it with your actual configuration!"
else
    echo "ℹ️  .env file already exists."
fi

# Display database setup instructions
echo ""
echo "🗄️  Database Setup Instructions:"
echo "1. Ensure PostgreSQL is running"
echo "2. Create the database if it doesn't exist:"
echo "   createdb dexdb"
echo "3. Run the database schemas:"
echo "   psql -d dexdb -f schema/orders_schema.sql"
echo "   psql -d dexdb -f schema/trades_schema.sql"
echo ""

# Display next steps
echo "🎯 Next Steps:"
echo "1. Edit the .env file with your actual configuration"
echo "2. Set up the database using the commands above"
echo "3. Start the server: npm start"
echo "4. Check the health: curl http://localhost:3001/cron/health"
echo ""
echo "📚 Documentation:"
echo "- Order Validation: ORDER_VALIDATION_README.md"
echo "- Order Matching: ORDER_MATCHING_README.md"
echo ""
echo "🚀 Ready to launch your perpetual futures DEX!" 