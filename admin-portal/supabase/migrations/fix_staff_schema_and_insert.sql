-- Fix Staff Table Schema and RLS Policies
-- Run this in Supabase SQL Editor

-- Step 1: Add missing columns if they don't exist
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS institution TEXT DEFAULT 'Adjil HQ';

-- Step 2: Enable RLS if not already enabled
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing conflicting policies
DROP POLICY IF EXISTS "Allow anon read staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated read staff" ON public.staff;
DROP POLICY IF EXISTS "Allow service role manage staff" ON public.staff;

-- Step 4: Create policies for SELECT (needed for login)
CREATE POLICY "Allow anon read staff" ON public.staff 
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read staff" ON public.staff 
    FOR SELECT TO authenticated USING (true);

-- Step 5: Create INSERT policy for anon (needed for creating new staff)
CREATE POLICY "Allow anon insert staff" ON public.staff 
    FOR INSERT TO anon WITH CHECK (true);

-- Step 6: Create UPDATE policy for authenticated users
CREATE POLICY "Allow authenticated update staff" ON public.staff 
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Step 7: Create DELETE policy for authenticated users
CREATE POLICY "Allow authenticated delete staff" ON public.staff 
    FOR DELETE TO authenticated USING (true);

-- Step 8: Service role has full access
CREATE POLICY "Allow service role manage staff" ON public.staff 
    FOR ALL TO service_role USING (true);

-- Step 9: Allow updating last_login without auth (for login tracking)
CREATE POLICY "Allow anon update last_login" ON public.staff 
    FOR UPDATE TO anon USING (true) WITH CHECK (true);
