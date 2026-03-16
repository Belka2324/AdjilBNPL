-- Complete Staff RLS Policies
-- Run this in Supabase SQL Editor to enable full CRUD operations on staff table

-- Enable RLS if not already enabled
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Allow anon read staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated read staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated insert staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated update staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated delete staff" ON public.staff;
DROP POLICY IF EXISTS "Allow service role manage staff" ON public.staff;
DROP POLICY IF EXISTS "Allow staff update own" ON public.staff;
DROP POLICY IF EXISTS "Allow anon update last_login" ON public.staff;

-- Policy 1: Anyone can read staff (needed for login)
CREATE POLICY "Allow anyone read staff" ON public.staff 
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read staff" ON public.staff 
    FOR SELECT TO authenticated USING (true);

-- Policy 2: Anyone can insert (for registration - if needed)
CREATE POLICY "Allow anon insert staff" ON public.staff 
    FOR INSERT TO anon WITH CHECK (true);

-- Policy 3: Authenticated users can update staff
CREATE POLICY "Allow authenticated update staff" ON public.staff 
    FOR UPDATE TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Policy 4: Authenticated users can delete staff
CREATE POLICY "Allow authenticated delete staff" ON public.staff 
    FOR DELETE TO authenticated 
    USING (true);

-- Policy 5: Service role has full access
CREATE POLICY "Allow service role manage staff" ON public.staff 
    FOR ALL TO service_role USING (true);

-- Note: For production, you should restrict insert/update/delete to only CEO or Administrators
-- This is a simplified version for development
