-- =====================================================
-- MONVANA BANK - SUPABASE AUTH USER SYNC SYSTEM
-- Migration: 032_supabase_auth_sync.sql
-- Description: Automatically sync auth.users to public.users and provision wallets
-- =====================================================

-- Trigger function for new users
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
    -- Extract first name and last name from raw_user_meta_data if present
    first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
    last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');
    
    -- Insert user
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function when a new user is created in auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Trigger function for updated users
CREATE OR REPLACE FUNCTION public.handle_updated_user()
RETURNS TRIGGER AS $$
DECLARE
    first_name TEXT;
    last_name TEXT;
BEGIN
    first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
    last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');
    
    UPDATE public.users SET
        email = new.email,
        first_name = NULLIF(first_name, ''),
        last_name = NULLIF(last_name, ''),
        avatar_url = new.raw_user_meta_data->>'avatar_url',
        phone = new.raw_user_meta_data->>'phone',
        role = COALESCE(new.raw_user_meta_data->>'role', role)
    WHERE clerk_id = new.id::text;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute when a user is updated in auth
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_user();


-- Trigger function for deleted users
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.users WHERE clerk_id = old.id::text;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute when a user is deleted from auth
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_user();
