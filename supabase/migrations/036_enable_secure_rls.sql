-- =====================================================
-- MONVANA BANK - RE-ENABLE SECURE ROW LEVEL SECURITY (RLS)
-- Migration: 036_enable_secure_rls.sql
-- Description: Re-enables RLS with strict, secure policies
-- =====================================================

-- 1. Clean up old helper functions if they exist
DROP FUNCTION IF EXISTS public.get_current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 2. Create helper functions with SECURITY DEFINER to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.users WHERE clerk_id = auth.uid()::text;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.users WHERE clerk_id = auth.uid()::text), FALSE);
$$;

-- 3. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Helper macro to drop all existing policies on a table
-- Drop old and new policies to ensure idempotency
DROP POLICY IF EXISTS "Enable read for users table" ON public.users;
DROP POLICY IF EXISTS "Enable update for users table" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users table" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;

DROP POLICY IF EXISTS "Enable read for wallets" ON public.wallets;
DROP POLICY IF EXISTS "Enable update for wallets" ON public.wallets;
DROP POLICY IF EXISTS "Enable insert for wallets" ON public.wallets;
DROP POLICY IF EXISTS "Enable delete for wallets" ON public.wallets;
DROP POLICY IF EXISTS "wallets_select" ON public.wallets;
DROP POLICY IF EXISTS "wallets_insert" ON public.wallets;
DROP POLICY IF EXISTS "wallets_update" ON public.wallets;
DROP POLICY IF EXISTS "wallets_delete" ON public.wallets;

DROP POLICY IF EXISTS "Enable read for transactions" ON public.transactions;
DROP POLICY IF EXISTS "Enable insert for transactions" ON public.transactions;
DROP POLICY IF EXISTS "Enable update for transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;

DROP POLICY IF EXISTS "Enable read for billing_codes" ON public.billing_codes;
DROP POLICY IF EXISTS "Enable insert for billing_codes" ON public.billing_codes;
DROP POLICY IF EXISTS "Enable update for billing_codes" ON public.billing_codes;
DROP POLICY IF EXISTS "billing_codes_select" ON public.billing_codes;
DROP POLICY IF EXISTS "billing_codes_insert" ON public.billing_codes;
DROP POLICY IF EXISTS "billing_codes_update" ON public.billing_codes;
DROP POLICY IF EXISTS "billing_codes_delete" ON public.billing_codes;

DROP POLICY IF EXISTS "Enable read for loans" ON public.loans;
DROP POLICY IF EXISTS "Enable insert for loans" ON public.loans;
DROP POLICY IF EXISTS "Enable update for loans" ON public.loans;
DROP POLICY IF EXISTS "loans_select" ON public.loans;
DROP POLICY IF EXISTS "loans_insert" ON public.loans;
DROP POLICY IF EXISTS "loans_update" ON public.loans;
DROP POLICY IF EXISTS "loans_delete" ON public.loans;

DROP POLICY IF EXISTS "Anyone can view active investment plans" ON public.investment_plans;
DROP POLICY IF EXISTS "investment_plans_select" ON public.investment_plans;
DROP POLICY IF EXISTS "investment_plans_all" ON public.investment_plans;

DROP POLICY IF EXISTS "Enable read for investments" ON public.investments;
DROP POLICY IF EXISTS "Enable insert for investments" ON public.investments;
DROP POLICY IF EXISTS "investments_select" ON public.investments;
DROP POLICY IF EXISTS "investments_insert" ON public.investments;
DROP POLICY IF EXISTS "investments_update" ON public.investments;
DROP POLICY IF EXISTS "investments_delete" ON public.investments;

DROP POLICY IF EXISTS "Anyone can view active charities" ON public.charities;
DROP POLICY IF EXISTS "charities_select" ON public.charities;
DROP POLICY IF EXISTS "charities_all" ON public.charities;

DROP POLICY IF EXISTS "Enable read for donations" ON public.donations;
DROP POLICY IF EXISTS "Enable insert for donations" ON public.donations;
DROP POLICY IF EXISTS "donations_select" ON public.donations;
DROP POLICY IF EXISTS "donations_insert" ON public.donations;
DROP POLICY IF EXISTS "donations_update" ON public.donations;
DROP POLICY IF EXISTS "donations_delete" ON public.donations;

DROP POLICY IF EXISTS "Enable read for virtual_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Enable insert for virtual_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "Enable update for virtual_cards" ON public.virtual_cards;
DROP POLICY IF EXISTS "virtual_cards_select" ON public.virtual_cards;
DROP POLICY IF EXISTS "virtual_cards_insert" ON public.virtual_cards;
DROP POLICY IF EXISTS "virtual_cards_update" ON public.virtual_cards;
DROP POLICY IF EXISTS "virtual_cards_delete" ON public.virtual_cards;

DROP POLICY IF EXISTS "Enable read for crypto_addresses" ON public.crypto_addresses;
DROP POLICY IF EXISTS "Enable insert for crypto_addresses" ON public.crypto_addresses;
DROP POLICY IF EXISTS "crypto_addresses_select" ON public.crypto_addresses;
DROP POLICY IF EXISTS "crypto_addresses_insert" ON public.crypto_addresses;
DROP POLICY IF EXISTS "crypto_addresses_update" ON public.crypto_addresses;
DROP POLICY IF EXISTS "crypto_addresses_delete" ON public.crypto_addresses;

DROP POLICY IF EXISTS "Enable read for messages" ON public.messages;
DROP POLICY IF EXISTS "Enable insert for messages" ON public.messages;
DROP POLICY IF EXISTS "Enable update for messages" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;

DROP POLICY IF EXISTS "Enable read for audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Enable insert for audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_all" ON public.audit_logs;

DROP POLICY IF EXISTS "bank_info_select" ON public.bank_info;
DROP POLICY IF EXISTS "bank_info_all" ON public.bank_info;

DROP POLICY IF EXISTS "referrals_select" ON public.referrals;
DROP POLICY IF EXISTS "referrals_all" ON public.referrals;

DROP POLICY IF EXISTS "Enable all for favorite_contacts" ON public.favorite_contacts;
DROP POLICY IF EXISTS "favorite_contacts_select" ON public.favorite_contacts;
DROP POLICY IF EXISTS "favorite_contacts_insert" ON public.favorite_contacts;
DROP POLICY IF EXISTS "favorite_contacts_update" ON public.favorite_contacts;
DROP POLICY IF EXISTS "favorite_contacts_delete" ON public.favorite_contacts;

DROP POLICY IF EXISTS "Enable read for notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable insert for notifications" ON public.notifications;
DROP POLICY IF EXISTS "Enable update for notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

DROP POLICY IF EXISTS "Enable read for loan_applications" ON public.loan_applications;
DROP POLICY IF EXISTS "Enable insert for loan_applications" ON public.loan_applications;
DROP POLICY IF EXISTS "Enable update for loan_applications" ON public.loan_applications;
DROP POLICY IF EXISTS "loan_applications_select" ON public.loan_applications;
DROP POLICY IF EXISTS "loan_applications_insert" ON public.loan_applications;
DROP POLICY IF EXISTS "loan_applications_update" ON public.loan_applications;
DROP POLICY IF EXISTS "loan_applications_delete" ON public.loan_applications;

DROP POLICY IF EXISTS "Enable all for loan_documents" ON public.loan_documents;
DROP POLICY IF EXISTS "loan_documents_select" ON public.loan_documents;
DROP POLICY IF EXISTS "loan_documents_all" ON public.loan_documents;

DROP POLICY IF EXISTS "Anyone can view bank settings" ON public.bank_settings;
DROP POLICY IF EXISTS "bank_settings_select" ON public.bank_settings;
DROP POLICY IF EXISTS "bank_settings_all" ON public.bank_settings;

DROP POLICY IF EXISTS "Anyone can view exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Service role can manage exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_select" ON public.exchange_rates;
DROP POLICY IF EXISTS "exchange_rates_all" ON public.exchange_rates;

DROP POLICY IF EXISTS "Users can view deposit methods" ON public.deposit_methods;
DROP POLICY IF EXISTS "Service role can manage deposit methods" ON public.deposit_methods;
DROP POLICY IF EXISTS "deposit_methods_select" ON public.deposit_methods;
DROP POLICY IF EXISTS "deposit_methods_all" ON public.deposit_methods;

DROP POLICY IF EXISTS "Users can view own otps" ON public.otps;
DROP POLICY IF EXISTS "Service role has full access to otps" ON public.otps;
DROP POLICY IF EXISTS "otps_select" ON public.otps;
DROP POLICY IF EXISTS "otps_all" ON public.otps;

DROP POLICY IF EXISTS "admin_emails_all" ON public.admin_emails;

DROP POLICY IF EXISTS "kyc_submissions_select" ON public.kyc_submissions;
DROP POLICY IF EXISTS "kyc_submissions_insert" ON public.kyc_submissions;
DROP POLICY IF EXISTS "kyc_submissions_update" ON public.kyc_submissions;
DROP POLICY IF EXISTS "kyc_submissions_delete" ON public.kyc_submissions;


-- 5. CREATE NEW SECURE POLICIES

-- Users
CREATE POLICY "users_select" ON public.users FOR SELECT USING (clerk_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (clerk_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (clerk_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (public.is_admin());

-- Wallets
CREATE POLICY "wallets_select" ON public.wallets FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "wallets_insert" ON public.wallets FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "wallets_update" ON public.wallets FOR UPDATE USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "wallets_delete" ON public.wallets FOR DELETE USING (public.is_admin());

-- Transactions
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (public.is_admin());
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (public.is_admin());

-- Billing Codes
CREATE POLICY "billing_codes_select" ON public.billing_codes FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "billing_codes_insert" ON public.billing_codes FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "billing_codes_update" ON public.billing_codes FOR UPDATE USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "billing_codes_delete" ON public.billing_codes FOR DELETE USING (public.is_admin());

-- Loans
CREATE POLICY "loans_select" ON public.loans FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "loans_insert" ON public.loans FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "loans_update" ON public.loans FOR UPDATE USING (public.is_admin());
CREATE POLICY "loans_delete" ON public.loans FOR DELETE USING (public.is_admin());

-- Investment Plans
CREATE POLICY "investment_plans_select" ON public.investment_plans FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "investment_plans_all" ON public.investment_plans FOR ALL USING (public.is_admin());

-- Investments
CREATE POLICY "investments_select" ON public.investments FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "investments_insert" ON public.investments FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "investments_update" ON public.investments FOR UPDATE USING (public.is_admin());
CREATE POLICY "investments_delete" ON public.investments FOR DELETE USING (public.is_admin());

-- Charities
CREATE POLICY "charities_select" ON public.charities FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "charities_all" ON public.charities FOR ALL USING (public.is_admin());

-- Donations
CREATE POLICY "donations_select" ON public.donations FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "donations_insert" ON public.donations FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "donations_update" ON public.donations FOR UPDATE USING (public.is_admin());
CREATE POLICY "donations_delete" ON public.donations FOR DELETE USING (public.is_admin());

-- Virtual Cards
CREATE POLICY "virtual_cards_select" ON public.virtual_cards FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "virtual_cards_insert" ON public.virtual_cards FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "virtual_cards_update" ON public.virtual_cards FOR UPDATE USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "virtual_cards_delete" ON public.virtual_cards FOR DELETE USING (public.is_admin());

-- Crypto Addresses
CREATE POLICY "crypto_addresses_select" ON public.crypto_addresses FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "crypto_addresses_insert" ON public.crypto_addresses FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "crypto_addresses_update" ON public.crypto_addresses FOR UPDATE USING (public.is_admin());
CREATE POLICY "crypto_addresses_delete" ON public.crypto_addresses FOR DELETE USING (public.is_admin());

-- Messages
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (public.is_admin());

-- Audit Logs
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (actor_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (actor_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "audit_logs_all" ON public.audit_logs FOR ALL USING (public.is_admin());

-- Bank Info
CREATE POLICY "bank_info_select" ON public.bank_info FOR SELECT USING (true);
CREATE POLICY "bank_info_all" ON public.bank_info FOR ALL USING (public.is_admin());

-- Referrals
CREATE POLICY "referrals_select" ON public.referrals FOR SELECT USING (referrer_id = public.get_current_user_id() OR referred_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "referrals_all" ON public.referrals FOR ALL USING (public.is_admin());

-- Favorite Contacts
CREATE POLICY "favorite_contacts_select" ON public.favorite_contacts FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "favorite_contacts_insert" ON public.favorite_contacts FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "favorite_contacts_update" ON public.favorite_contacts FOR UPDATE USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "favorite_contacts_delete" ON public.favorite_contacts FOR DELETE USING (user_id = public.get_current_user_id() OR public.is_admin());

-- Notifications
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (user_id = public.get_current_user_id() OR public.is_admin());

-- Loan Applications
CREATE POLICY "loan_applications_select" ON public.loan_applications FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "loan_applications_insert" ON public.loan_applications FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "loan_applications_update" ON public.loan_applications FOR UPDATE USING (public.is_admin());
CREATE POLICY "loan_applications_delete" ON public.loan_applications FOR DELETE USING (public.is_admin());

-- Loan Documents
CREATE POLICY "loan_documents_select" ON public.loan_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.loan_applications 
    WHERE loan_applications.id = loan_documents.application_id 
    AND (loan_applications.user_id = public.get_current_user_id() OR public.is_admin())
  )
);
CREATE POLICY "loan_documents_all" ON public.loan_documents FOR ALL USING (public.is_admin());

-- Bank Settings
CREATE POLICY "bank_settings_select" ON public.bank_settings FOR SELECT USING (true);
CREATE POLICY "bank_settings_all" ON public.bank_settings FOR ALL USING (public.is_admin());

-- Exchange Rates
CREATE POLICY "exchange_rates_select" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "exchange_rates_all" ON public.exchange_rates FOR ALL USING (public.is_admin());

-- Deposit Methods
CREATE POLICY "deposit_methods_select" ON public.deposit_methods FOR SELECT USING (true);
CREATE POLICY "deposit_methods_all" ON public.deposit_methods FOR ALL USING (public.is_admin());

-- OTPs
CREATE POLICY "otps_select" ON public.otps FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "otps_all" ON public.otps FOR ALL USING (public.is_admin());

-- Admin Emails
CREATE POLICY "admin_emails_all" ON public.admin_emails FOR ALL USING (public.is_admin());

-- KYC Submissions
CREATE POLICY "kyc_submissions_select" ON public.kyc_submissions FOR SELECT USING (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "kyc_submissions_insert" ON public.kyc_submissions FOR INSERT WITH CHECK (user_id = public.get_current_user_id() OR public.is_admin());
CREATE POLICY "kyc_submissions_update" ON public.kyc_submissions FOR UPDATE USING (public.is_admin());
CREATE POLICY "kyc_submissions_delete" ON public.kyc_submissions FOR DELETE USING (public.is_admin());
