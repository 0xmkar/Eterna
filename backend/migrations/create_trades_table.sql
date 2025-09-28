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
    tx_hash varchar(66) NULL,
    executed_at timestamp DEFAULT now() NULL,
    created_at timestamp DEFAULT now() NULL,
    CONSTRAINT trades_pkey PRIMARY KEY (id),
    CONSTRAINT trades_buy_order_id_fkey FOREIGN KEY (buy_order_id) REFERENCES public.orders(id),
    CONSTRAINT trades_sell_order_id_fkey FOREIGN KEY (sell_order_id) REFERENCES public.orders(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trades_buy_order_id ON public.trades(buy_order_id);
CREATE INDEX IF NOT EXISTS idx_trades_sell_order_id ON public.trades(sell_order_id);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON public.trades(executed_at);
CREATE INDEX IF NOT EXISTS idx_trades_buyer_address ON public.trades(buyer_address);
CREATE INDEX IF NOT EXISTS idx_trades_seller_address ON public.trades(seller_address);
CREATE INDEX IF NOT EXISTS idx_trades_tx_hash ON public.trades(tx_hash); 