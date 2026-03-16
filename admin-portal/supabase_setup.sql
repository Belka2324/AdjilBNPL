-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT, -- For demo/simple auth, though Supabase Auth is preferred
    role TEXT CHECK (role IN ('customer', 'merchant')),
    status TEXT DEFAULT 'active',
    subscription_plan TEXT,
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    balance DECIMAL(12, 2) DEFAULT 0,
    outstanding DECIMAL(12, 2) DEFAULT 0,
    pin TEXT,
    card_number TEXT,
    activity TEXT,
    location TEXT,
    wilaya TEXT,
    coords TEXT,
    profile_picture TEXT,
    doc_id_front TEXT,
    doc_id_back TEXT,
    doc_payslip TEXT,
    doc_rib TEXT,
    doc_commercial_register TEXT,
    doc_contract TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id),
    merchant_id UUID REFERENCES public.users(id),
    amount DECIMAL(12, 2) NOT NULL,
    method TEXT,
    merchant_name TEXT,
    merchant_pin TEXT,
    merchant_activity TEXT,
    merchant_location TEXT,
    customer_name TEXT,
    customer_card TEXT,
    status TEXT DEFAULT 'completed',
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create RPC function for Atomic Transactions
-- This ensures that balance changes and transaction recording happen together or not at all.
CREATE OR REPLACE FUNCTION process_transaction(
    p_customer_id UUID,
    p_merchant_id UUID,
    p_amount DECIMAL,
    p_method TEXT,
    p_merchant_name TEXT,
    p_customer_name TEXT,
    p_customer_card TEXT,
    p_merchant_pin TEXT DEFAULT NULL,
    p_merchant_activity TEXT DEFAULT NULL,
    p_merchant_location TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_cust_balance DECIMAL;
    v_tx_id TEXT;
    v_low_balance_alert BOOLEAN := FALSE;
BEGIN
    -- 1. Check customer balance
    SELECT balance INTO v_cust_balance FROM public.users WHERE id = p_customer_id FOR UPDATE;
    
    IF v_cust_balance < p_amount THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- 2. Check for duplicate transaction (idempotency)
    IF p_idempotency_key IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.transactions WHERE idempotency_key = p_idempotency_key) THEN
            SELECT id INTO v_tx_id FROM public.transactions WHERE idempotency_key = p_idempotency_key;
            RETURN json_build_object('success', true, 'tx_id', v_tx_id, 'new_balance', v_cust_balance, 'message', 'Duplicate prevented');
        END IF;
    END IF;

    -- 3. Generate transaction ID
    v_tx_id := 'TX-' || extract(epoch from now())::bigint || '-' || floor(random() * 10000);

    -- 4. Deduct from customer
    UPDATE public.users 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE id = p_customer_id;

    -- 5. Add to merchant
    UPDATE public.users 
    SET balance = balance + p_amount,
        outstanding = outstanding + p_amount,
        updated_at = NOW()
    WHERE id = p_merchant_id;

    -- 6. Record transaction
    INSERT INTO public.transactions (
        id, customer_id, merchant_id, amount, method, 
        merchant_name, merchant_pin, merchant_activity, merchant_location,
        customer_name, customer_card, idempotency_key, created_at
    ) VALUES (
        v_tx_id, p_customer_id, p_merchant_id, p_amount, p_method,
        p_merchant_name, p_merchant_pin, p_merchant_activity, p_merchant_location,
        p_customer_name, p_customer_card, p_idempotency_key, NOW()
    );

    -- Check for low balance alert (e.g., < 2000 DZD)
    IF (v_cust_balance - p_amount) < 2000 THEN
        v_low_balance_alert := TRUE;
    END IF;

    RETURN json_build_object(
        'success', true, 
        'tx_id', v_tx_id, 
        'new_balance', v_cust_balance - p_amount,
        'low_balance_alert', v_low_balance_alert
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Basic RLS Policies (Allow authenticated access for now)
-- Adjust these based on your specific security needs
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable update for users on their own record" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable read access for transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert for transactions" ON public.transactions FOR INSERT WITH CHECK (true);
