-- Trades Table Schema for Order Matching and Execution
-- Drop existing table if it exists
DROP TABLE IF EXISTS trades CASCADE;

-- Create trades table
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
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Primary key
    CONSTRAINT trades_pkey PRIMARY KEY (id),
    
    -- Foreign key constraints
    CONSTRAINT trades_buy_order_fkey FOREIGN KEY (buy_order_id) REFERENCES public.orders(id) ON DELETE RESTRICT,
    CONSTRAINT trades_sell_order_fkey FOREIGN KEY (sell_order_id) REFERENCES public.orders(id) ON DELETE RESTRICT,
    CONSTRAINT trades_buy_user_fkey FOREIGN KEY (buy_user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
    CONSTRAINT trades_sell_user_fkey FOREIGN KEY (sell_user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
    
    -- Check constraints
    CONSTRAINT check_price_positive CHECK (price > 0),
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_execution_status CHECK (execution_status IN ('PENDING', 'EXECUTED', 'FAILED', 'CANCELLED')),
    CONSTRAINT check_different_users CHECK (buy_user_id != sell_user_id),
    CONSTRAINT check_different_orders CHECK (buy_order_id != sell_order_id)
);

-- Create indexes for performance
CREATE INDEX idx_trades_execution_status ON trades(execution_status);
CREATE INDEX idx_trades_executed_at ON trades(executed_at DESC);
CREATE INDEX idx_trades_buy_user_id ON trades(buy_user_id);
CREATE INDEX idx_trades_sell_user_id ON trades(sell_user_id);
CREATE INDEX idx_trades_price_quantity ON trades(price, quantity);
CREATE INDEX idx_trades_transaction_hash ON trades(transaction_hash) WHERE transaction_hash IS NOT NULL;
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);

-- Create composite indexes for common queries
CREATE INDEX idx_trades_pending_execution ON trades(execution_status, executed_at) WHERE execution_status = 'PENDING';
CREATE INDEX idx_trades_user_activity ON trades(buy_user_id, sell_user_id, executed_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trades_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_trades_updated_at_column();

-- Create a view for trade statistics
CREATE OR REPLACE VIEW trade_statistics AS
SELECT 
    DATE_TRUNC('hour', executed_at) as hour,
    COUNT(*) as trade_count,
    SUM(quantity) as total_volume,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price,
    SUM(price * quantity) as total_value,
    COUNT(DISTINCT buy_user_id) as unique_buyers,
    COUNT(DISTINCT sell_user_id) as unique_sellers
FROM trades 
WHERE execution_status = 'EXECUTED'
GROUP BY DATE_TRUNC('hour', executed_at)
ORDER BY hour DESC;

-- Create a view for user trade activity
CREATE OR REPLACE VIEW user_trade_activity AS
SELECT 
    user_id,
    side,
    COUNT(*) as trade_count,
    SUM(quantity) as total_volume,
    SUM(price * quantity) as total_value,
    AVG(price) as avg_price,
    MIN(executed_at) as first_trade,
    MAX(executed_at) as last_trade
FROM (
    SELECT buy_user_id as user_id, 'BUY' as side, quantity, price, executed_at
    FROM trades WHERE execution_status = 'EXECUTED'
    UNION ALL
    SELECT sell_user_id as user_id, 'SELL' as side, quantity, price, executed_at
    FROM trades WHERE execution_status = 'EXECUTED'
) combined_trades
GROUP BY user_id, side
ORDER BY total_value DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON trades TO postgres;
GRANT SELECT ON trade_statistics TO postgres;
GRANT SELECT ON user_trade_activity TO postgres;
GRANT USAGE ON SEQUENCE trades_id_seq TO postgres; 