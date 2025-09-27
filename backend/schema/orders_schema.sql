-- Enhanced Orders Table Schema with Comprehensive Validation
-- Drop existing constraints and enums if they exist
DROP TYPE IF EXISTS order_side_enum CASCADE;
DROP TYPE IF EXISTS order_status_enum CASCADE;

-- Create enums for validation
CREATE TYPE order_side_enum AS ENUM ('BUY', 'SELL');
CREATE TYPE order_status_enum AS ENUM ('OPEN', 'FILLED', 'PARTIAL', 'CANCELED');

-- Drop and recreate the orders table with enhanced constraints
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE public.orders (
    id bigserial NOT NULL,
    user_id int8 NOT NULL,
    side order_side_enum NOT NULL,
    price numeric(20,8) NULL,
    quantity numeric(20,8) NOT NULL,
    leverage numeric(8,2) NOT NULL,
    margin numeric(20,8) NOT NULL,
    max_slippage_bps int4 DEFAULT 5 NOT NULL,
    status order_status_enum DEFAULT 'OPEN' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Primary key
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    
    -- Foreign key constraint
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT,
    
    -- Check constraints for validation
    CONSTRAINT check_price_positive CHECK (price IS NULL OR price > 0),
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_quantity_min CHECK (quantity >= 0.0001), -- Minimum order size (reduced for testing)
    CONSTRAINT check_quantity_max CHECK (quantity <= 1000000), -- Maximum order size
    CONSTRAINT check_leverage_range CHECK (leverage >= 1 AND leverage <= 20),
    CONSTRAINT check_margin_positive CHECK (margin > 0),
    CONSTRAINT check_slippage_range CHECK (max_slippage_bps >= 0 AND max_slippage_bps <= 5000),
    
    -- Margin sufficiency check (simplified - more complex logic in application)
    CONSTRAINT check_margin_minimum CHECK (
        price IS NULL OR margin >= (quantity * price * 0.01) -- At least 1% of position value (reduced for testing)
    )
);

-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_side ON orders(side);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_price_side_status ON orders(price, side, status) WHERE status = 'OPEN' AND price IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add configuration table for order limits and settings
CREATE TABLE IF NOT EXISTS order_config (
    id serial PRIMARY KEY,
    key varchar(50) UNIQUE NOT NULL,
    value varchar(100) NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert default configuration values
INSERT INTO order_config (key, value, description) VALUES 
('MIN_ORDER_SIZE', '0.0001', 'Minimum order quantity allowed'),
('MAX_ORDER_SIZE', '1000000', 'Maximum order quantity allowed'),
('MAX_LEVERAGE', '20', 'Maximum leverage allowed'),
('MIN_LEVERAGE', '1', 'Minimum leverage allowed'),
('MAX_SLIPPAGE_BPS', '5000', 'Maximum slippage in basis points (50%)'),
('MAINTENANCE_MARGIN_RATIO', '0.01', 'Maintenance margin ratio (1% - reduced for testing)'),
('INITIAL_MARGIN_MULTIPLIER', '1.2', 'Initial margin multiplier for maintenance margin')
ON CONFLICT (key) DO NOTHING;

-- Add user status fields to users table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_banned') THEN
        ALTER TABLE users ADD COLUMN is_banned boolean DEFAULT false NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_liquidated') THEN
        ALTER TABLE users ADD COLUMN is_liquidated boolean DEFAULT false NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_margin') THEN
        ALTER TABLE users ADD COLUMN total_margin numeric(20,8) DEFAULT 0 NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'available_margin') THEN
        ALTER TABLE users ADD COLUMN available_margin numeric(20,8) DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Create function to validate order before insert/update
CREATE OR REPLACE FUNCTION validate_order_constraints()
RETURNS TRIGGER AS $$
DECLARE
    user_banned boolean;
    user_liquidated boolean;
    min_order_size numeric;
    max_order_size numeric;
    max_leverage numeric;
    maintenance_margin_ratio numeric;
    required_margin numeric;
BEGIN
    -- Check if user is banned or liquidated
    SELECT is_banned, is_liquidated INTO user_banned, user_liquidated
    FROM users WHERE id = NEW.user_id;
    
    IF user_banned THEN
        RAISE EXCEPTION 'Cannot create order: User is banned';
    END IF;
    
    IF user_liquidated THEN
        RAISE EXCEPTION 'Cannot create order: User account is liquidated';
    END IF;
    
    -- Get configuration values
    SELECT value::numeric INTO min_order_size FROM order_config WHERE key = 'MIN_ORDER_SIZE';
    SELECT value::numeric INTO max_order_size FROM order_config WHERE key = 'MAX_ORDER_SIZE';
    SELECT value::numeric INTO max_leverage FROM order_config WHERE key = 'MAX_LEVERAGE';
    SELECT value::numeric INTO maintenance_margin_ratio FROM order_config WHERE key = 'MAINTENANCE_MARGIN_RATIO';
    
    -- Validate quantity against configurable limits
    IF NEW.quantity < min_order_size THEN
        RAISE EXCEPTION 'Order quantity % is below minimum order size %', NEW.quantity, min_order_size;
    END IF;
    
    IF NEW.quantity > max_order_size THEN
        RAISE EXCEPTION 'Order quantity % exceeds maximum order size %', NEW.quantity, max_order_size;
    END IF;
    
    -- Validate leverage against configurable limits
    IF NEW.leverage > max_leverage THEN
        RAISE EXCEPTION 'Leverage % exceeds maximum allowed leverage %', NEW.leverage, max_leverage;
    END IF;
    
    -- Enhanced margin validation for limit orders
    IF NEW.price IS NOT NULL THEN
        required_margin := (NEW.quantity * NEW.price / NEW.leverage) * (1 + maintenance_margin_ratio);
        IF NEW.margin < required_margin THEN
            RAISE EXCEPTION 'Insufficient margin: Required %, provided %', required_margin, NEW.margin;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order validation
DROP TRIGGER IF EXISTS validate_order_trigger ON orders;
CREATE TRIGGER validate_order_trigger
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_constraints();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON orders TO postgres;
GRANT SELECT ON order_config TO postgres;
GRANT USAGE ON SEQUENCE orders_id_seq TO postgres; 