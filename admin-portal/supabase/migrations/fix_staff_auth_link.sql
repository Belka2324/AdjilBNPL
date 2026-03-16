-- Migration to fix staff table to link with auth.users
-- Run this in Supabase SQL Editor

-- Step 1: Create a backup of existing staff data
CREATE TABLE IF NOT EXISTS public.staff_backup AS 
SELECT * FROM public.staff;

-- Step 2: Drop the old staff table (data will be preserved in backup)
DROP TABLE IF EXISTS public.staff CASCADE;

-- Step 3: Create new staff table that links to auth.users
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ceo', 'administrator', 'partner', 'support')),
    is_active BOOLEAN DEFAULT true,
    is_ceo BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read staff
CREATE POLICY "Allow authenticated read staff" ON public.staff 
    FOR SELECT TO authenticated USING (true);

-- Policy: Allow service role to manage staff
CREATE POLICY "Allow service role manage staff" ON public.staff 
    FOR ALL TO service_role USING (true);

-- Policy: Allow users to update their own profile
CREATE POLICY "Allow staff update own" ON public.staff 
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id);

-- Step 4: Now create users in auth.users first, then link them
-- This must be done through Supabase Dashboard or Admin API
-- After creating users, insert them into staff table

-- Example (run AFTER creating users in auth.users):
-- INSERT INTO public.staff (id, username, email, full_name, role, is_active, is_ceo)
-- VALUES 
--     ('USER_ID_1', 'admin', 'admin@adjil.dz', 'المدير العام', 'ceo', true, true),
--     ('USER_ID_2', 'support', 'support@adjil.dz', 'دعم فني', 'support', true, false);
