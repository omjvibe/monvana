-- =====================================================
-- MONVANA BANK - SUPABASE AUTH USER SYNC FIX
-- Migration: 033_fix_signup_trigger.sql
-- Description: Hardens account generation and sync trigger to prevent signup 500 errors
-- =====================================================

-- 1. Redefine account number generator with explicit schema references and search_path isolation
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate a random 10-digit account number
        new_number := LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
        -- Check if it already exists in public.wallets
        SELECT COUNT(*) INTO exists_count FROM public.wallets WHERE account_number = new_number;
        EXIT WHEN exists_count = 0;
    END LOOP;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Redefine handle_new_user to catch any database exceptions and report them clearly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID;
    usd_acc TEXT;
    btc_acc TEXT;
    eth_acc TEXT;
    usdt_acc TEXT;
    acc_name TEXT;
    first_name TEXT;
    last_name TEXT;
BEGIN
    BEGIN
        -- Extract first name and last name from raw_user_meta_data if present
        first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
        last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');
        
        -- Insert user into public.users
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
            new.id::text,
            new.email,
            NULLIF(first_name, ''),
            NULLIF(last_name, ''),
            new.raw_user_meta_data->>'avatar_url',
            new.raw_user_meta_data->>'phone',
            COALESCE(new.raw_user_meta_data->>'role', 'user'),
            'active',
            FALSE
        )
        RETURNING id INTO new_user_id;

        -- Account name for wallets
        IF first_name <> '' OR last_name <> '' THEN
            acc_name := TRIM(first_name || ' ' || last_name);
        ELSE
            acc_name := new.email;
        END IF;

        -- Generate account numbers using the public.generate_account_number() function
        usd_acc := public.generate_account_number();
        
        -- Create USD wallet
        INSERT INTO public.wallets (
            user_id, currency, balance, account_type, account_number, account_name, is_primary
        ) VALUES (
            new_user_id, 'USD', 0.00, 'savings', usd_acc, acc_name, TRUE
        );

        -- Create crypto wallets (BTC, ETH, USDT)
        btc_acc := public.generate_account_number();
        INSERT INTO public.wallets (
            user_id, currency, balance, account_type, account_number, account_name, is_primary
        ) VALUES (
            new_user_id, 'BTC', 0.00, 'crypto', btc_acc, acc_name || ' - BTC', FALSE
        );

        eth_acc := public.generate_account_number();
        INSERT INTO public.wallets (
            user_id, currency, balance, account_type, account_number, account_name, is_primary
        ) VALUES (
            new_user_id, 'ETH', 0.00, 'crypto', eth_acc, acc_name || ' - ETH', FALSE
        );

        usdt_acc := public.generate_account_number();
        INSERT INTO public.wallets (
            user_id, currency, balance, account_type, account_number, account_name, is_primary
        ) VALUES (
            new_user_id, 'USDT', 0.00, 'crypto', usdt_acc, acc_name || ' - USDT', FALSE
        );

        -- Log audit action
        INSERT INTO public.audit_logs (
            actor_id, actor_email, action, target_type, target_id, target_name, details, category
        ) VALUES (
            new_user_id, new.email, 'user_registered', 'user', new_user_id, acc_name, 
            jsonb_build_object('auth_id', new.id::text, 'email', new.email), 'auth'
        );

        RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
        -- Re-raise exception with clean context
        RAISE EXCEPTION 'handle_new_user trigger failed: %, STATE: %', SQLERRM, SQLSTATE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-create the trigger to execute public.handle_new_user()
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
