-- =====================================================
-- MONVANA BANK - DATABASE SCHEMA
-- Supabase PostgreSQL Migration Script
-- Version: 1.0.0
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE
-- Synced with Clerk via webhook
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    avatar_url TEXT,
    country VARCHAR(100),
    occupation VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'banned')),
    transaction_pin VARCHAR(255) DEFAULT '1234',
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WALLETS TABLE
-- Each user has one wallet per currency
-- =====================================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'USD',
    balance DECIMAL(20, 2) DEFAULT 0.00,
    account_type VARCHAR(50) DEFAULT 'savings',
    account_number VARCHAR(20) UNIQUE,
    account_name VARCHAR(200),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- =====================================================
-- TRANSACTIONS TABLE
-- All financial activities
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES wallets(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'loan', 'investment', 'donation', 'bonus', 'fee', 'refund')),
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'on_hold', 'approved', 'cancelled', 'failed')),
    description TEXT,
    reference VARCHAR(100) UNIQUE,
    recipient_name VARCHAR(200),
    recipient_account VARCHAR(100),
    recipient_bank VARCHAR(200),
    swift_code VARCHAR(20),
    routing_number VARCHAR(20),
    admin_note TEXT,
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BILLING CODES TABLE
-- 5-code verification system for withdrawals
-- =====================================================
CREATE TABLE IF NOT EXISTS billing_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    code_type VARCHAR(50) NOT NULL CHECK (code_type IN ('imf', 'vat', 'lbt', 'upgrade_fee', 'withdrawal_fee')),
    code VARCHAR(20) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LOANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(20, 2) NOT NULL,
    term_months INTEGER NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    monthly_payment DECIMAL(20, 2),
    total_payable DECIMAL(20, 2),
    remaining_balance DECIMAL(20, 2),
    purpose VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected', 'defaulted')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    next_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVESTMENT PLANS TABLE
-- Admin-created investment offerings
-- =====================================================
CREATE TABLE IF NOT EXISTS investment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    min_amount DECIMAL(20, 2) NOT NULL,
    max_amount DECIMAL(20, 2) NOT NULL,
    roi_percentage DECIMAL(5, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    features JSONB DEFAULT '[]',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVESTMENTS TABLE
-- User investments in plans
-- =====================================================
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES investment_plans(id),
    amount DECIMAL(20, 2) NOT NULL,
    expected_return DECIMAL(20, 2) NOT NULL,
    actual_return DECIMAL(20, 2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matured', 'cancelled', 'withdrawn')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    maturity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CHARITIES TABLE
-- Admin-approved charities for donations
-- =====================================================
CREATE TABLE IF NOT EXISTS charities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image_url TEXT,
    website_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    total_donations DECIMAL(20, 2) DEFAULT 0,
    donor_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DONATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    charity_id UUID NOT NULL REFERENCES charities(id),
    amount DECIMAL(20, 2) NOT NULL,
    transaction_id UUID REFERENCES transactions(id),
    is_anonymous BOOLEAN DEFAULT FALSE,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VIRTUAL CARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS virtual_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_name VARCHAR(100),
    card_number VARCHAR(255) NOT NULL, -- Encrypted
    expiry_date VARCHAR(10) NOT NULL,
    cvv VARCHAR(255) NOT NULL, -- Encrypted
    card_type VARCHAR(20) DEFAULT 'visa',
    balance DECIMAL(20, 2) DEFAULT 0,
    spending_limit DECIMAL(20, 2) DEFAULT 5000,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CRYPTO ADDRESSES TABLE
-- User deposit addresses
-- =====================================================
CREATE TABLE IF NOT EXISTS crypto_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    network VARCHAR(50) NOT NULL, -- Bitcoin, Ethereum, USDT, etc.
    address VARCHAR(255) NOT NULL,
    label VARCHAR(100),
    total_deposits DECIMAL(20, 8) DEFAULT 0,
    last_deposit_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, network)
);

-- =====================================================
-- MESSAGES TABLE
-- Support chat messages
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOGS TABLE
-- Complete activity trail for compliance
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    actor_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    target_name VARCHAR(200),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    category VARCHAR(50) CHECK (category IN ('auth', 'financial', 'security', 'settings', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BANK INFO TABLE
-- Bank configuration (singleton)
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) DEFAULT 'Monvana Bank',
    tagline VARCHAR(500),
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    website_url TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(20) DEFAULT '#292524',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_id UUID NOT NULL REFERENCES users(id),
    bonus_amount DECIMAL(20, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired')),
    credited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_account_number ON wallets(account_number);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);

CREATE INDEX IF NOT EXISTS idx_billing_codes_user_id ON billing_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_codes_transaction_id ON billing_codes(transaction_id);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = clerk_id OR role = 'admin');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = clerk_id);

-- Wallets policies
CREATE POLICY "Users can view own wallets" ON wallets
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

CREATE POLICY "Users can update own wallets" ON wallets
    FOR UPDATE USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

-- Investment plans are public read
CREATE POLICY "Anyone can view active investment plans" ON investment_plans
    FOR SELECT USING (is_active = TRUE);

-- Charities are public read
CREATE POLICY "Anyone can view active charities" ON charities
    FOR SELECT USING (is_active = TRUE);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_codes_updated_at BEFORE UPDATE ON billing_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_plans_updated_at BEFORE UPDATE ON investment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charities_updated_at BEFORE UPDATE ON charities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_virtual_cards_updated_at BEFORE UPDATE ON virtual_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_addresses_updated_at BEFORE UPDATE ON crypto_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_info_updated_at BEFORE UPDATE ON bank_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate unique account number
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        new_number := LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
        SELECT COUNT(*) INTO exists_count FROM wallets WHERE account_number = new_number;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate unique transaction reference
CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(
        CASE 
            WHEN NEW.type = 'deposit' THEN 'DEP-'
            WHEN NEW.type = 'withdrawal' THEN 'WTH-'
            WHEN NEW.type = 'transfer' THEN 'TRF-'
            WHEN NEW.type = 'loan' THEN 'LON-'
            ELSE 'TXN-'
        END || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
    );
END;
$$ LANGUAGE plpgsql;

-- Auto-generate transaction reference
CREATE OR REPLACE FUNCTION set_transaction_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference IS NULL THEN
        NEW.reference := UPPER(
            CASE 
                WHEN NEW.type = 'deposit' THEN 'DEP-'
                WHEN NEW.type = 'withdrawal' THEN 'WTH-'
                WHEN NEW.type = 'transfer' THEN 'TRF-'
                WHEN NEW.type = 'loan' THEN 'LON-'
                ELSE 'TXN-'
            END || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_reference_trigger BEFORE INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION set_transaction_reference();

-- Generate referral code for new users
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code_trigger BEFORE INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default bank info
INSERT INTO bank_info (name, tagline, description, contact_email, contact_phone, features)
VALUES (
    'Monvana Bank',
    'Your Trusted Digital Banking Partner',
    'A secure, modern online banking platform designed with compliance, security, and your financial success in mind.',
    'support@monvana.online',
    '+1 (800) 123-4567',
    '{"wire_transfers": true, "crypto_deposits": true, "loans": true, "investments": true, "virtual_cards": true, "referral_program": true}'
) ON CONFLICT DO NOTHING;

-- Insert default investment plans
INSERT INTO investment_plans (name, description, min_amount, max_amount, roi_percentage, duration_days, features)
VALUES 
    ('Starter Plan', 'Perfect for beginners looking to grow their savings with low risk.', 500, 5000, 8, 30, '["Low risk", "Guaranteed returns", "Daily updates"]'),
    ('Growth Plan', 'Balanced investment option for moderate risk-takers.', 5000, 25000, 12, 60, '["Medium risk", "Higher returns", "Priority support"]'),
    ('Premium Plan', 'Maximum returns for experienced investors.', 25000, 100000, 18, 90, '["Best returns", "Dedicated manager", "Flexible withdrawal"]')
ON CONFLICT DO NOTHING;

-- Insert sample charities
INSERT INTO charities (name, description, category, is_active)
VALUES 
    ('Red Cross International', 'Providing humanitarian aid and disaster relief worldwide.', 'Humanitarian', true),
    ('UNICEF', 'Working for children''s rights, survival, development and protection.', 'Children', true),
    ('World Wildlife Fund', 'Conservation of nature and reduction of threats to wildlife.', 'Environment', true),
    ('Doctors Without Borders', 'Medical humanitarian organization providing aid in conflict zones.', 'Health', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON users TO authenticated;
GRANT INSERT, UPDATE ON wallets TO authenticated;
GRANT INSERT ON transactions TO authenticated;
GRANT INSERT ON donations TO authenticated;
GRANT INSERT ON messages TO authenticated;

-- Grant full access to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
