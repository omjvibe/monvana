-- 🏦 Monvana Bank - Wallet Swap & Exchange Rates
-- 
-- This migration adds:
-- 1. exchange_rates table for admin-managed currency conversion rates
-- 2. RLS policies (permissive read, service-role write)

-- 1. Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(20, 8) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_currency, to_currency)
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates(is_active);

-- 3. Enable RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Permissive read (auth is Clerk-based, not Supabase Auth)
CREATE POLICY "Anyone can view exchange rates" ON exchange_rates
FOR SELECT USING (true);

-- Service role handles writes via API
CREATE POLICY "Service role can manage exchange rates" ON exchange_rates
FOR ALL USING (true) WITH CHECK (true);

-- 4. Auto-update timestamp trigger
CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Seed default exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
    ('USD', 'BTC', 0.0000150),
    ('USD', 'ETH', 0.000300),
    ('USD', 'USDT', 1.000000),
    ('USD', 'USDC', 1.000000),
    ('USD', 'EUR', 0.920000),
    ('USD', 'GBP', 0.790000),
    ('BTC', 'USD', 66700.00),
    ('BTC', 'ETH', 20.000000),
    ('BTC', 'USDT', 66700.00),
    ('ETH', 'USD', 3335.00),
    ('ETH', 'BTC', 0.050000),
    ('ETH', 'USDT', 3335.00),
    ('USDT', 'USD', 1.000000),
    ('USDT', 'BTC', 0.0000150),
    ('USDT', 'ETH', 0.000300),
    ('USDC', 'USD', 1.000000),
    ('EUR', 'USD', 1.087000),
    ('GBP', 'USD', 1.265000)
ON CONFLICT (from_currency, to_currency) DO NOTHING;
