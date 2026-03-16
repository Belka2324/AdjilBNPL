-- Fix: Allow authenticated admin/CEO to insert/update/delete staff
-- This policy is needed for the Team page to create new staff members

-- Check if policy already exists
DO $$
BEGIN
    -- Allow authenticated users to insert staff
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated insert staff' AND tablename = 'staff'
    ) THEN
        CREATE POLICY "Allow authenticated insert staff" ON public.staff
            FOR INSERT TO authenticated
            WITH CHECK (true);
    END IF;
    
    -- Allow authenticated users to update staff
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated update staff' AND tablename = 'staff'
    ) THEN
        CREATE POLICY "Allow authenticated update staff" ON public.staff
            FOR UPDATE TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
    
    -- Allow authenticated users to delete staff
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated delete staff' AND tablename = 'staff'
    ) THEN
        CREATE POLICY "Allow authenticated delete staff" ON public.staff
            FOR DELETE TO authenticated
            USING (true);
    END IF;
END $$;
