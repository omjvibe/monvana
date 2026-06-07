-- =====================================================
-- MONVANA BANK - CONSOLIDATED DATABASE SCHEMA
-- Supabase PostgreSQL Schema (Consolidated from migrations 001–029)
-- Version: 2.0.0
-- Last Updated: 2026-05-03
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CLEANUP SECTION (Resets database for a fresh setup)
-- =====================================================
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS kyc_submissions CASCADE;
DROP TABLE IF EXISTS admin_emails CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS bank_info CASCADE;
DROP TABLE IF EXISTS crypto_addresses CASCADE;
DROP TABLE IF EXISTS virtual_cards CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS charities CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS investment_plans CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS loan_documents CASCADE;
DROP TABLE IF EXISTS loan_applications CASCADE;
DROP TABLE IF EXISTS billing_codes CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS favorite_contacts CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS deposit_methods CASCADE;
DROP TABLE IF EXISTS deposit_proofs CASCADE;
DROP TABLE IF EXISTS bank_settings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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
    kyc_status VARCHAR(20) DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'approved', 'rejected', 'expired')),
    kyc_id_type VARCHAR(50),
    kyc_id_number VARCHAR(100),
    kyc_details JSONB DEFAULT '{}',
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id) ON DELETE SET NULL,
    account_type VARCHAR(50) DEFAULT 'standard',
    daily_limit DECIMAL(20, 2) DEFAULT 10000,
    monthly_limit DECIMAL(20, 2) DEFAULT 100000,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WALLETS TABLE
-- Each user can have multiple wallets (USD, BTC, ETH, USDT)
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
    deposit_address TEXT,
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
    type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'loan', 'investment', 'donation', 'bonus', 'fee', 'refund', 'charge')),
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'on_hold', 'approved', 'cancelled', 'failed')),
    description TEXT,
    reference VARCHAR(100) UNIQUE,
    recipient_name VARCHAR(200),
    recipient_account VARCHAR(100),
    recipient_bank VARCHAR(200),
    swift_code VARCHAR(20),
    routing_number VARCHAR(50),
    sender_name VARCHAR(200),
    sender_account VARCHAR(100),
    sender_bank VARCHAR(200),
    admin_note TEXT,
    proof_url TEXT,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
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
    application_id UUID,
    amount DECIMAL(20, 2) NOT NULL,
    term_months INTEGER NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    monthly_payment DECIMAL(20, 2),
    total_payable DECIMAL(20, 2),
    remaining_balance DECIMAL(20, 2),
    purpose VARCHAR(200),
    description TEXT,
    loan_type VARCHAR(50),
    collateral_type VARCHAR(100),
    collateral_value DECIMAL(20, 2),
    has_guarantor BOOLEAN DEFAULT FALSE,
    guarantor_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected', 'defaulted')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    next_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVESTMENT PLANS TABLE
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
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVESTMENTS TABLE
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
    goal_amount DECIMAL(20, 2),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
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
    card_number VARCHAR(255) NOT NULL,
    expiry_date VARCHAR(10) NOT NULL,
    cvv VARCHAR(255) NOT NULL,
    card_type VARCHAR(20) DEFAULT 'visa',
    balance DECIMAL(20, 2) DEFAULT 0,
    spending_limit DECIMAL(20, 2) DEFAULT 5000,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CRYPTO ADDRESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crypto_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    network VARCHAR(50) NOT NULL,
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
-- AUDIT LOGS TABLE (Restructured in migration 011)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BANK INFO TABLE (Singleton)
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
    primary_color VARCHAR(20) DEFAULT '#1e40af',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bonus_amount DECIMAL(20, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired')),
    credited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FAVORITE CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS favorite_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_number TEXT,
    bank_name TEXT,
    swift_code TEXT,
    routing_number TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LOAN APPLICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id),
    application_number VARCHAR(50) UNIQUE,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'pending_documents', 'approved', 'rejected', 'withdrawn')),
    loan_type VARCHAR(50) NOT NULL CHECK (loan_type IN ('personal', 'business', 'salary', 'student', 'emergency', 'car', 'home', 'international')),
    loan_amount DECIMAL(20, 2) NOT NULL,
    loan_purpose TEXT,
    repayment_duration INTEGER NOT NULL,
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    urgency_level VARCHAR(30),
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(30),
    phone_number VARCHAR(50),
    alternative_phone VARCHAR(50),
    email VARCHAR(255),
    country_of_residence VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    residential_address TEXT,
    years_at_address VARCHAR(20),
    residential_status VARCHAR(30),
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    id_expiry_date DATE,
    nationality VARCHAR(100),
    tax_id_number VARCHAR(100),
    employment_status VARCHAR(50),
    employer_name VARCHAR(200),
    employer_address TEXT,
    job_title VARCHAR(100),
    years_employed VARCHAR(20),
    monthly_income DECIMAL(20, 2),
    other_income_sources TEXT,
    monthly_expenses DECIMAL(20, 2),
    existing_debts DECIMAL(20, 2),
    has_existing_loans BOOLEAN DEFAULT FALSE,
    existing_loan_details TEXT,
    credit_score VARCHAR(20),
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(200),
    business_name VARCHAR(200),
    business_address TEXT,
    business_type VARCHAR(100),
    nature_of_business VARCHAR(200),
    years_in_operation INTEGER,
    business_reg_number VARCHAR(100),
    annual_revenue DECIMAL(20, 2),
    number_of_employees INTEGER,
    school_name VARCHAR(200),
    school_address TEXT,
    course_of_study VARCHAR(200),
    degree_level VARCHAR(50),
    expected_graduation VARCHAR(20),
    student_id VARCHAR(100),
    car_make VARCHAR(100),
    car_model VARCHAR(100),
    car_year INTEGER,
    car_condition VARCHAR(30),
    estimated_car_value DECIMAL(20, 2),
    dealer_name VARCHAR(200),
    property_address TEXT,
    property_type VARCHAR(50),
    property_value DECIMAL(20, 2),
    down_payment DECIMAL(20, 2),
    is_first_home BOOLEAN,
    country_applying_from VARCHAR(100),
    international_purpose TEXT,
    foreign_currency VARCHAR(10),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relation VARCHAR(50),
    has_collateral BOOLEAN DEFAULT FALSE,
    collateral_type VARCHAR(100),
    collateral_value DECIMAL(20, 2),
    collateral_description TEXT,
    has_guarantor BOOLEAN DEFAULT FALSE,
    guarantor_name VARCHAR(200),
    guarantor_phone VARCHAR(50),
    guarantor_address TEXT,
    guarantor_relation VARCHAR(50),
    guarantor_occupation VARCHAR(100),
    guarantor_income DECIMAL(20, 2),
    agree_to_terms BOOLEAN DEFAULT FALSE,
    signature_name VARCHAR(200),
    submission_date DATE,
    documents JSONB DEFAULT '[]',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    rejection_reason TEXT,
    interest_rate DECIMAL(5, 2),
    monthly_payment DECIMAL(20, 2),
    total_payable DECIMAL(20, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE
);

-- Add application_id FK to loans after loan_applications is created
ALTER TABLE loans ADD CONSTRAINT loans_application_id_fkey
    FOREIGN KEY (application_id) REFERENCES loan_applications(id);

-- =====================================================
-- LOAN DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255),
    file_path TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BANK SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EXCHANGE RATES TABLE (Migration 014)
-- =====================================================
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

-- =====================================================
-- ADMIN EMAILS TABLE (Migration 015/016)
-- RLS disabled — security enforced at API level
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resend_id VARCHAR(255) UNIQUE,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT,
    content_html TEXT,
    content_text TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('inbound', 'outbound')),
    status VARCHAR(50) DEFAULT 'sent',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- KYC SUBMISSIONS TABLE (Migration 017/023)
-- RLS disabled — security enforced at API level
-- =====================================================
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_type VARCHAR(50) NOT NULL,
    id_number VARCHAR(100) NOT NULL,
    id_front_url TEXT,
    id_back_url TEXT,
    selfie_url TEXT,
    address_proof_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    admin_note TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEPOSIT METHODS TABLE (Migrations 011/013/020)
-- =====================================================
CREATE TABLE IF NOT EXISTS deposit_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    wallet_address TEXT,
    bank_name VARCHAR(200),
    account_number VARCHAR(100),
    account_name VARCHAR(200),
    routing_number VARCHAR(50),
    swift_code VARCHAR(20),
    additional_info TEXT,
    qr_code_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_universal BOOLEAN DEFAULT FALSE,
    is_transfer_option BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- OTP TABLE (Migration 029)
-- =====================================================
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) DEFAULT 'transfer' CHECK (type IN ('transfer', 'withdrawal', 'security', 'login')),
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON wallets(user_id, currency);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_proof ON transactions(proof_url) WHERE proof_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_billing_codes_user_id ON billing_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_codes_transaction_id ON billing_codes(transaction_id);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorite_contacts_user ON favorite_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_loan_type ON loan_applications(loan_type);
CREATE INDEX IF NOT EXISTS idx_loan_applications_created_at ON loan_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loan_applications_application_number ON loan_applications(application_number);

CREATE INDEX IF NOT EXISTS idx_loan_documents_application_id ON loan_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_loan_documents_document_type ON loan_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_bank_settings_key ON bank_settings(key);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates(is_active);

CREATE INDEX IF NOT EXISTS idx_admin_emails_from ON admin_emails(from_email);
CREATE INDEX IF NOT EXISTS idx_admin_emails_to ON admin_emails(to_email);
CREATE INDEX IF NOT EXISTS idx_admin_emails_type ON admin_emails(type);
CREATE INDEX IF NOT EXISTS idx_admin_emails_resend_id ON admin_emails(resend_id);

CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);

CREATE INDEX IF NOT EXISTS idx_deposit_methods_user ON deposit_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_methods_active ON deposit_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_deposit_methods_universal ON deposit_methods(is_universal);

CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_code ON otps(code);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
-- NOTE: Since we use Clerk for auth (not Supabase Auth), all RLS
-- policies are permissive. Security is enforced at the API level
-- via service role key + Clerk auth verification.

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
ALTER TABLE bank_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- Disable RLS on tables that had persistent issues
ALTER TABLE admin_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions DISABLE ROW LEVEL SECURITY;

-- Permissive policies (Clerk auth — security at API level)
CREATE POLICY "Enable read for users table" ON users FOR SELECT USING (true);
CREATE POLICY "Enable update for users table" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable insert for users table" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (true);

CREATE POLICY "Enable read for wallets" ON wallets FOR SELECT USING (true);
CREATE POLICY "Enable update for wallets" ON wallets FOR UPDATE USING (true);
CREATE POLICY "Enable insert for wallets" ON wallets FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for transactions" ON transactions FOR UPDATE USING (true);

CREATE POLICY "Enable read for billing_codes" ON billing_codes FOR SELECT USING (true);
CREATE POLICY "Enable insert for billing_codes" ON billing_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for billing_codes" ON billing_codes FOR UPDATE USING (true);

CREATE POLICY "Enable read for loans" ON loans FOR SELECT USING (true);
CREATE POLICY "Enable insert for loans" ON loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for loans" ON loans FOR UPDATE USING (true);

CREATE POLICY "Anyone can view active investment plans" ON investment_plans FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Enable read for investments" ON investments FOR SELECT USING (true);
CREATE POLICY "Enable insert for investments" ON investments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view active charities" ON charities FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Enable read for donations" ON donations FOR SELECT USING (true);
CREATE POLICY "Enable insert for donations" ON donations FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for virtual_cards" ON virtual_cards FOR SELECT USING (true);
CREATE POLICY "Enable insert for virtual_cards" ON virtual_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for virtual_cards" ON virtual_cards FOR UPDATE USING (true);

CREATE POLICY "Enable read for crypto_addresses" ON crypto_addresses FOR SELECT USING (true);
CREATE POLICY "Enable insert for crypto_addresses" ON crypto_addresses FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Enable insert for messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for messages" ON messages FOR UPDATE USING (true);

CREATE POLICY "Enable read for audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable all for favorite_contacts" ON favorite_contacts FOR ALL USING (true);

CREATE POLICY "Enable read for notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert for notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for notifications" ON notifications FOR UPDATE USING (true);

CREATE POLICY "Enable read for loan_applications" ON loan_applications FOR SELECT USING (true);
CREATE POLICY "Enable insert for loan_applications" ON loan_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for loan_applications" ON loan_applications FOR UPDATE USING (true);

CREATE POLICY "Enable all for loan_documents" ON loan_documents FOR ALL USING (true);

CREATE POLICY "Anyone can view bank settings" ON bank_settings FOR SELECT USING (true);

CREATE POLICY "Anyone can view exchange rates" ON exchange_rates FOR SELECT USING (true);
CREATE POLICY "Service role can manage exchange rates" ON exchange_rates FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view deposit methods" ON deposit_methods FOR SELECT USING (true);
CREATE POLICY "Service role can manage deposit methods" ON deposit_methods FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view own otps" ON otps FOR SELECT USING (true);
CREATE POLICY "Service role has full access to otps" ON otps FOR ALL USING (true) WITH CHECK (true);

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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_codes_updated_at BEFORE UPDATE ON billing_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investment_plans_updated_at BEFORE UPDATE ON investment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charities_updated_at BEFORE UPDATE ON charities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_virtual_cards_updated_at BEFORE UPDATE ON virtual_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crypto_addresses_updated_at BEFORE UPDATE ON crypto_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_info_updated_at BEFORE UPDATE ON bank_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON loan_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_settings_updated_at BEFORE UPDATE ON bank_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON exchange_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_emails_updated_at BEFORE UPDATE ON admin_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kyc_submissions_updated_at BEFORE UPDATE ON kyc_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
                WHEN NEW.type = 'charge' THEN 'CHG-'
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

-- Generate loan application number
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.application_number IS NULL THEN
        NEW.application_number := 'LN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
            LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_application_number_trigger BEFORE INSERT ON loan_applications
    FOR EACH ROW EXECUTE FUNCTION generate_application_number();

-- Utility function to get user documents
CREATE OR REPLACE FUNCTION get_user_documents(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    application_id UUID,
    document_type TEXT,
    file_name TEXT,
    file_path TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT ld.id, ld.application_id, ld.document_type, ld.file_name, ld.file_path, ld.file_size, ld.created_at
    FROM loan_documents ld
    JOIN loan_applications la ON la.id = ld.application_id
    WHERE la.user_id = user_uuid
    ORDER BY ld.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Deposit proofs bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'deposit-proofs', 'deposit-proofs', true, 5242880,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']::text[]
) ON CONFLICT (id) DO NOTHING;

-- KYC documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc', 'kyc', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for deposit-proofs
DROP POLICY IF EXISTS "Allow user uploads to deposit-proofs" ON storage.objects;
CREATE POLICY "Allow user uploads to deposit-proofs" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deposit-proofs');

DROP POLICY IF EXISTS "Allow public read of deposit-proofs" ON storage.objects;
CREATE POLICY "Allow public read of deposit-proofs" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'deposit-proofs');

-- Storage policies for KYC
DROP POLICY IF EXISTS "Allow public upload to kyc" ON storage.objects;
CREATE POLICY "Allow public upload to kyc" ON storage.objects
    FOR INSERT TO public WITH CHECK (bucket_id = 'kyc');

DROP POLICY IF EXISTS "Allow public select from kyc" ON storage.objects;
CREATE POLICY "Allow public select from kyc" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'kyc');

DROP POLICY IF EXISTS "Allow public update of kyc" ON storage.objects;
CREATE POLICY "Allow public update of kyc" ON storage.objects
    FOR UPDATE TO public USING (bucket_id = 'kyc') WITH CHECK (bucket_id = 'kyc');

DROP POLICY IF EXISTS "Allow public delete of kyc" ON storage.objects;
CREATE POLICY "Allow public delete of kyc" ON storage.objects
    FOR DELETE TO public USING (bucket_id = 'kyc');

-- =====================================================
-- INITIAL / SEED DATA
-- =====================================================

-- Default bank info
INSERT INTO bank_info (name, tagline, description, contact_email, contact_phone, logo_url, primary_color, features)
VALUES (
    'Monvana Bank',
    'Your Trusted Digital Banking Partner',
    'A secure, modern online banking platform designed with compliance, security, and your financial success in mind.',
    'support@monvana.online',
    '+1 (800) 123-4567',
    '/logo.png',
    '#1e40af',
    '{"wire_transfers": true, "crypto_deposits": true, "loans": true, "investments": true, "virtual_cards": true, "referral_program": true, "kyc_mandatory": false}'
) ON CONFLICT DO NOTHING;

-- Default investment plans
INSERT INTO investment_plans (name, description, min_amount, max_amount, roi_percentage, duration_days, features)
VALUES 
    ('Starter Plan', 'Perfect for beginners looking to grow their savings with low risk.', 500, 5000, 8, 30, '["Low risk", "Guaranteed returns", "Daily updates"]'),
    ('Growth Plan', 'Balanced investment option for moderate risk-takers.', 5000, 25000, 12, 60, '["Medium risk", "Higher returns", "Priority support"]'),
    ('Premium Plan', 'Maximum returns for experienced investors.', 25000, 100000, 18, 90, '["Best returns", "Dedicated manager", "Flexible withdrawal"]')
ON CONFLICT DO NOTHING;

-- Sample charities
INSERT INTO charities (name, description, category, is_active)
VALUES 
    ('Red Cross International', 'Providing humanitarian aid and disaster relief worldwide.', 'Humanitarian', true),
    ('UNICEF', 'Working for children''s rights, survival, development and protection.', 'Children', true),
    ('World Wildlife Fund', 'Conservation of nature and reduction of threats to wildlife.', 'Environment', true),
    ('Doctors Without Borders', 'Medical humanitarian organization providing aid in conflict zones.', 'Health', true)
ON CONFLICT DO NOTHING;

-- Default bank settings
INSERT INTO bank_settings (key, value) VALUES
    ('bank_name', 'Monvana Bank'),
    ('tagline', 'Your trusted financial partner'),
    ('maintenance_mode', 'false'),
    ('allow_registration', 'true'),
    ('allow_deposits', 'true'),
    ('allow_withdrawals', 'true'),
    ('allow_transfers', 'true'),
    ('allow_loans', 'true'),
    ('allow_investments', 'true'),
    ('require_kyc', 'true'),
    ('require_2fa', 'false'),
    ('large_transaction_alert', '10000'),
    ('daily_withdrawal_limit', '50000'),
    ('low_balance_alert', '100'),
    ('session_timeout', '30'),
    ('max_login_attempts', '5'),
    ('transfer_otp', 'false')
ON CONFLICT (key) DO NOTHING;

-- Default exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
    ('USD', 'BTC', 0.0000150), ('USD', 'ETH', 0.000300), ('USD', 'USDT', 1.000000),
    ('USD', 'USDC', 1.000000), ('USD', 'EUR', 0.920000), ('USD', 'GBP', 0.790000),
    ('BTC', 'USD', 66700.00), ('BTC', 'ETH', 20.000000), ('BTC', 'USDT', 66700.00),
    ('ETH', 'USD', 3335.00), ('ETH', 'BTC', 0.050000), ('ETH', 'USDT', 3335.00),
    ('USDT', 'USD', 1.000000), ('USDT', 'BTC', 0.0000150), ('USDT', 'ETH', 0.000300),
    ('USDC', 'USD', 1.000000), ('EUR', 'USD', 1.087000), ('GBP', 'USD', 1.265000)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON users TO authenticated;
GRANT INSERT, UPDATE ON wallets TO authenticated;
GRANT INSERT ON transactions TO authenticated;
GRANT INSERT ON donations TO authenticated;
GRANT INSERT ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON loan_applications TO authenticated;
GRANT SELECT, INSERT ON loan_documents TO authenticated;
GRANT SELECT ON bank_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON otps TO authenticated;

-- Service role (full access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Admin emails (RLS disabled, grant to all roles)
GRANT ALL ON TABLE admin_emails TO service_role;
GRANT ALL ON TABLE admin_emails TO anon;
GRANT ALL ON TABLE admin_emails TO authenticated;

-- KYC submissions (RLS disabled, grant to all roles)
GRANT ALL ON kyc_submissions TO anon;
GRANT ALL ON kyc_submissions TO authenticated;
GRANT ALL ON kyc_submissions TO service_role;

-- =====================================================
-- TABLE COMMENTS
-- =====================================================
COMMENT ON TABLE users IS 'User profiles synced with Clerk. RLS uses permissive policies — security enforced at API level.';
COMMENT ON TABLE wallets IS 'Multi-currency wallets (USD, BTC, ETH, USDT) per user.';
COMMENT ON TABLE transactions IS 'All financial activities including deposits, withdrawals, transfers, charges.';
COMMENT ON TABLE deposit_methods IS 'Admin-managed deposit methods. Supports universal (null user_id) and per-user methods.';
COMMENT ON TABLE admin_emails IS 'Admin email system. RLS disabled for reliability.';
COMMENT ON TABLE kyc_submissions IS 'Full KYC verification submissions. RLS disabled for reliability.';
COMMENT ON TABLE otps IS 'One-time passwords for secure transfers and other verification.';
COMMENT ON TABLE exchange_rates IS 'Admin-managed currency exchange rates for wallet swap feature.';
COMMENT ON COLUMN wallets.deposit_address IS 'Crypto deposit address assigned by admin for user deposits';
COMMENT ON COLUMN users.account_type IS 'User account type: standard, premium, business, vip';
COMMENT ON COLUMN transactions.proof_url IS 'URL to proof of payment image stored in Supabase Storage';
COMMENT ON COLUMN transactions.sender_name IS 'Name of the person/entity who initiated the deposit';
COMMENT ON TABLE loan_documents IS 'Stores metadata for uploaded loan application documents.';

