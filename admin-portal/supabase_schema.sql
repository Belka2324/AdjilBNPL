
-- Users Table: Stores both customers and merchants
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Note: In production, use Supabase Auth instead of storing passwords
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('customer', 'merchant')),
    balance DECIMAL(12, 2) DEFAULT 0,
    outstanding DECIMAL(12, 2) DEFAULT 0, -- For merchants: pending receivables
    pin TEXT, -- 4 digit PIN for transactions
    card_number TEXT, -- Generated card number for customers
    
    -- Merchant specific fields
    activity TEXT, -- Business activity type
    location TEXT, -- Address/Location text
    wilaya TEXT, -- State/Province
    coords TEXT, -- GPS Coordinates "lat,lng"
    
    -- Documents (stored as file paths/URLs)
    doc_id_front TEXT,
    doc_id_back TEXT,
    doc_payslip TEXT,
    doc_rib TEXT,
    doc_commercial_register TEXT,
    doc_contract TEXT,
    subscription_plan TEXT,
    credit_limit DECIMAL(12, 2) DEFAULT 0
);

-- Transactions Table: Records all payments and transfers
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    method TEXT DEFAULT 'BNPL_DIRECT',
    
    -- Relationships
    merchant_id UUID REFERENCES public.users(id),
    customer_id UUID REFERENCES public.users(id),
    
    -- Snapshot data (in case user details change)
    merchant_name TEXT,
    customer_name TEXT,
    customer_card TEXT
);

-- RLS Policies (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
-- Note: Since we are not using Supabase Auth yet (custom auth in main.js), 
-- we will allow public access for now to make the migration easier.
-- In a real app, you should restrict this.

CREATE POLICY "Allow public read access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.transactions FOR UPDATE USING (true);
