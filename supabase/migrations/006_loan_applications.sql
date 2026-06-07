-- =====================================================
-- MONVANA BANK - LOAN APPLICATIONS SCHEMA UPDATE
-- Migration: 006_loan_applications.sql
-- Description: Add comprehensive loan application system
-- =====================================================

-- =====================================================
-- LOAN APPLICATIONS TABLE
-- Stores all the comprehensive loan application data
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id), -- Links to the loan after approval
    
    -- Application Status
    application_number VARCHAR(50) UNIQUE,
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'pending_documents', 'approved', 'rejected', 'withdrawn')),
    
    -- Loan Type & Details
    loan_type VARCHAR(50) NOT NULL CHECK (loan_type IN ('personal', 'business', 'salary', 'student', 'emergency', 'car', 'home', 'international')),
    loan_amount DECIMAL(20, 2) NOT NULL,
    loan_purpose TEXT,
    repayment_duration INTEGER NOT NULL, -- in months
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    urgency_level VARCHAR(30),
    
    -- Personal Information
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(30),
    phone_number VARCHAR(50),
    alternative_phone VARCHAR(50),
    email VARCHAR(255),
    
    -- Address Information
    country_of_residence VARCHAR(100),
    state_province VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    residential_address TEXT,
    years_at_address VARCHAR(20),
    residential_status VARCHAR(30),
    
    -- Identification
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    id_expiry_date DATE,
    nationality VARCHAR(100),
    tax_id_number VARCHAR(100),
    
    -- Financial Information
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
    
    -- Business Loan Specifics
    business_name VARCHAR(200),
    business_address TEXT,
    business_type VARCHAR(100),
    nature_of_business VARCHAR(200),
    years_in_operation INTEGER,
    business_reg_number VARCHAR(100),
    annual_revenue DECIMAL(20, 2),
    number_of_employees INTEGER,
    
    -- Student Loan Specifics
    school_name VARCHAR(200),
    school_address TEXT,
    course_of_study VARCHAR(200),
    degree_level VARCHAR(50),
    expected_graduation VARCHAR(20),
    student_id VARCHAR(100),
    
    -- Car Loan Specifics
    car_make VARCHAR(100),
    car_model VARCHAR(100),
    car_year INTEGER,
    car_condition VARCHAR(30),
    estimated_car_value DECIMAL(20, 2),
    dealer_name VARCHAR(200),
    
    -- Home Loan Specifics
    property_address TEXT,
    property_type VARCHAR(50),
    property_value DECIMAL(20, 2),
    down_payment DECIMAL(20, 2),
    is_first_home BOOLEAN,
    
    -- International Loan Specifics
    country_applying_from VARCHAR(100),
    international_purpose TEXT,
    foreign_currency VARCHAR(10),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relation VARCHAR(50),
    
    -- Collateral
    has_collateral BOOLEAN DEFAULT FALSE,
    collateral_type VARCHAR(100),
    collateral_value DECIMAL(20, 2),
    collateral_description TEXT,
    
    -- Guarantor
    has_guarantor BOOLEAN DEFAULT FALSE,
    guarantor_name VARCHAR(200),
    guarantor_phone VARCHAR(50),
    guarantor_address TEXT,
    guarantor_relation VARCHAR(50),
    guarantor_occupation VARCHAR(100),
    guarantor_income DECIMAL(20, 2),
    
    -- Declaration
    agree_to_terms BOOLEAN DEFAULT FALSE,
    signature_name VARCHAR(200),
    submission_date DATE,
    
    -- Document References (store document paths/IDs)
    documents JSONB DEFAULT '[]',
    
    -- Admin Processing
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT,
    rejection_reason TEXT,
    
    -- Calculated Fields (from loan if approved)
    interest_rate DECIMAL(5, 2),
    monthly_payment DECIMAL(20, 2),
    total_payable DECIMAL(20, 2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- LOAN DOCUMENTS TABLE
-- Store references to uploaded documents
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- id_front, id_back, proof_of_income, bank_statement, etc.
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
-- UPDATE EXISTING LOANS TABLE
-- Add reference to application
-- =====================================================
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES loan_applications(id),
ADD COLUMN IF NOT EXISTS loan_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS collateral_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS collateral_value DECIMAL(20, 2),
ADD COLUMN IF NOT EXISTS has_guarantor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guarantor_name VARCHAR(200);

-- =====================================================
-- BANK SETTINGS TABLE
-- For admin settings management
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_loan_type ON loan_applications(loan_type);
CREATE INDEX IF NOT EXISTS idx_loan_applications_created_at ON loan_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loan_applications_application_number ON loan_applications(application_number);

CREATE INDEX IF NOT EXISTS idx_loan_documents_application_id ON loan_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_loan_documents_document_type ON loan_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_bank_settings_key ON bank_settings(key);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Loan Applications
CREATE POLICY "Users can view own loan applications" ON loan_applications
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

CREATE POLICY "Users can create loan applications" ON loan_applications
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
    );

CREATE POLICY "Users can update own draft applications" ON loan_applications
    FOR UPDATE USING (
        user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        AND status IN ('draft', 'submitted')
    );

-- Loan Documents
CREATE POLICY "Users can view own loan documents" ON loan_documents
    FOR SELECT USING (
        application_id IN (
            SELECT id FROM loan_applications 
            WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        )
    );

CREATE POLICY "Users can upload loan documents" ON loan_documents
    FOR INSERT WITH CHECK (
        application_id IN (
            SELECT id FROM loan_applications 
            WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
        )
    );

-- Bank Settings - public read
CREATE POLICY "Anyone can view bank settings" ON bank_settings
    FOR SELECT USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger for loan_applications
CREATE TRIGGER update_loan_applications_updated_at 
    BEFORE UPDATE ON loan_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for bank_settings
CREATE TRIGGER update_bank_settings_updated_at 
    BEFORE UPDATE ON bank_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GENERATE APPLICATION NUMBER
-- =====================================================
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

CREATE TRIGGER set_application_number_trigger 
    BEFORE INSERT ON loan_applications
    FOR EACH ROW EXECUTE FUNCTION generate_application_number();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON loan_applications TO authenticated;
GRANT SELECT, INSERT ON loan_documents TO authenticated;
GRANT SELECT ON bank_settings TO authenticated;
GRANT ALL ON loan_applications TO service_role;
GRANT ALL ON loan_documents TO service_role;
GRANT ALL ON bank_settings TO service_role;

-- =====================================================
-- INSERT DEFAULT BANK SETTINGS
-- =====================================================
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
    ('max_login_attempts', '5')
ON CONFLICT (key) DO NOTHING;
