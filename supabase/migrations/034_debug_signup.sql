-- =====================================================
-- MONVANA BANK - SIGNUP DEBUG FUNCTION
-- Migration: 034_debug_signup.sql
-- Description: Exposes RPCs to simulate handle_new_user and inspect triggers on auth.users
-- =====================================================

CREATE OR REPLACE FUNCTION public.debug_signup(
    p_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    new_user_id UUID;
    usd_acc TEXT;
    btc_acc TEXT;
    eth_acc TEXT;
    usdt_acc TEXT;
    acc_name TEXT;
BEGIN
    BEGIN
        -- Insert user into public.users with ON CONFLICT resolution
        INSERT INTO public.users (
            clerk_id,
            email,
            first_name,
            last_name,
            avatar_url,
            phone,
            role,
            status,
            is_verified
        ) VALUES (
            p_id::text,
            p_email,
            NULLIF(p_first_name, ''),
            NULLIF(p_last_name, ''),
            NULL,
            NULL,
            'user',
            'active',
            FALSE
        )
        ON CONFLICT (email) DO UPDATE SET
            clerk_id = EXCLUDED.clerk_id,
            first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
            last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
            avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
            phone = COALESCE(EXCLUDED.phone, public.users.phone),
            role = EXCLUDED.role,
            status = 'active',
            updated_at = NOW()
        RETURNING id INTO new_user_id;

        acc_name := TRIM(COALESCE(p_first_name, '') || ' ' || COALESCE(p_last_name, ''));
        IF acc_name = '' THEN
            acc_name := p_email;
        END IF;

        -- Generate account numbers using the public.generate_account_number() function
        usd_acc := public.generate_account_number();
        
        -- Create USD wallet
        INSERT INTO public.wallets (
            user_id, currency, balance, account_type, account_number, account_name, is_primary
        ) VALUES (
            new_user_id, 'USD', 0.00, 'savings', usd_acc, acc_name, TRUE
        ) ON CONFLICT (user_id, currency) DO NOTHING;

        -- Create crypto wallets (BTC, ETH, USDT)
        btc_acc := public.generate_account_number();
        INSERT INTO public.wallets (
            user_id, currency, balance, account_type, account_number, account_name, is_primary
        ) VALUES (
            new_user_id, 'BTC', 0.00, 'crypto', btc_acc, acc_name || ' - BTC', FALSE
        ) ON CONFLICT (user_id, currency) DO NOTHING;

        eth_acc := public.generate_account_number();
        INSERT INTO public.wallets (
            user_id, currency, balance, account_type, account_number, account_name, is_primary
        ) VALUES (
            new_user_id, 'ETH', 0.00, 'crypto', eth_acc, acc_name || ' - ETH', FALSE
        ) ON CONFLICT (user_id, currency) DO NOTHING;

        usdt_acc := public.generate_account_number();
        INSERT INTO public.wallets (
            user_id, currency, balance, account_type, account_number, account_name, is_primary
        ) VALUES (
            new_user_id, 'USDT', 0.00, 'crypto', usdt_acc, acc_name || ' - USDT', FALSE
        ) ON CONFLICT (user_id, currency) DO NOTHING;

        -- Log audit action
        INSERT INTO public.audit_logs (
            actor_id, actor_email, action, target_type, target_id, target_name, details, category
        ) VALUES (
            new_user_id, p_email, 'user_registered', 'user', new_user_id, acc_name, 
            jsonb_build_object('auth_id', p_id::text, 'email', p_email), 'auth'
        );

        RETURN 'SUCCESS: User and wallets created successfully.';
    EXCEPTION WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM || ' (STATE: ' || SQLSTATE || ')';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper to retrieve triggers defined on auth.users
CREATE OR REPLACE FUNCTION public.get_auth_triggers()
RETURNS TABLE (
    trigger_name TEXT,
    action_timing TEXT,
    event_manipulation TEXT,
    function_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tgname::text AS trigger_name,
        CASE (t.tgtype & 2)::boolean WHEN true THEN 'BEFORE' ELSE 'AFTER' END::text AS action_timing,
        CASE (t.tgtype & 4)::boolean WHEN true THEN 'INSERT' ELSE 'UPDATE' END::text AS event_manipulation,
        p.proname::text AS function_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE n.nspname = 'auth' AND c.relname = 'users';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
