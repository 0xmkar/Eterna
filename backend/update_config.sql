-- Update order configuration for more lenient validation (testing mode)

-- Update minimum order size
UPDATE order_config SET value = '0.0001' WHERE key = 'MIN_ORDER_SIZE';

-- Update maintenance margin ratio (reduced for testing)
UPDATE order_config SET value = '0.01' WHERE key = 'MAINTENANCE_MARGIN_RATIO';

-- Update initial margin multiplier (reduced for testing)
UPDATE order_config SET value = '1.1' WHERE key = 'INITIAL_MARGIN_MULTIPLIER';

-- Add or update additional configuration values
INSERT INTO order_config (key, value, description) VALUES 
('MAX_PRICE_DEVIATION', '0.5', 'Maximum price deviation from market (50% for testing)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO order_config (key, value, description) VALUES 
('MAX_SINGLE_ORDER_EXPOSURE', '10000000', 'Maximum single order exposure ($10M for testing)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO order_config (key, value, description) VALUES 
('MAX_TOTAL_USER_EXPOSURE', '50000000', 'Maximum total user exposure ($50M for testing)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update users table to give some initial margin for testing
-- WARNING: This is for testing only - in production, users should deposit funds properly
UPDATE users SET 
    available_margin = GREATEST(available_margin, 1000),
    total_margin = GREATEST(total_margin, 1000)
WHERE available_margin < 100;

-- Display updated configuration
SELECT key, value, description FROM order_config ORDER BY key; 