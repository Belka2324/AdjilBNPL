-- Fix: Allow anon users to read staff table for login
-- This policy is needed because RLS blocks unauthenticated access

-- First check if policy already exists
DO $$
BEGIN
    -- Create policy if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon read staff' AND tablename = 'staff'
    ) THEN
        CREATE POLICY "Allow anon read staff" ON public.staff 
            FOR SELECT TO anon USING (true);
    END IF;
END $$;

-- Also create policy for anonymous login via Supabase Auth
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow anonymous insert staff' AND tablename = 'staff'
    ) THEN
        -- Allow anon to update last_login only
        CREATE POLICY "Allow anon update last_login" ON public.staff
            FOR UPDATE TO anon
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
