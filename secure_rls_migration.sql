
-- SECURE RLS MIGRATION
-- Use this file to restrict access if you switch to Supabase Auth (GoTrue).
-- Currently, your app uses "Custom Auth" in JS, so it requires public access.
-- However, below is the correct way to secure it if you enable Supabase Auth.

-- 1. Drop insecure policies
DROP POLICY IF EXISTS "Allow public insert access" ON public.transactions;
DROP POLICY IF EXISTS "Allow public update access" ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert access" ON public.users;
DROP POLICY IF EXISTS "Allow public update access" ON public.users;

-- 2. Secure Users Table
-- Only allow users to update their own profile based on auth.uid()
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow new users to sign up (insert themselves)
-- Ideally this is handled by a trigger on auth.users, but for client-side insert:
CREATE POLICY "Users can insert their own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. Secure Transactions Table
-- Only allow inserting transactions where the user is a participant (e.g. the customer paying)
CREATE POLICY "Participants can insert transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
    auth.uid() = customer_id 
    OR 
    auth.uid() = merchant_id
);

-- Only allow participants to view their transactions
-- (Replacing the public read policy if desired)
-- DROP POLICY "Allow public read access" ON public.transactions;
CREATE POLICY "Participants can view own transactions" 
ON public.transactions 
FOR SELECT 
USING (
    auth.uid() = customer_id 
    OR 
    auth.uid() = merchant_id
);

-- Note: Since the current app uses a custom 'users' table and NOT Supabase Auth (auth.users),
-- the above policies will BREAK the app unless you migrate to Supabase Auth.
-- To fix the "Linter Warning" while keeping Custom Auth, you technically can't without a backend.
-- The warning correctly identifies that your database is open to the public.
