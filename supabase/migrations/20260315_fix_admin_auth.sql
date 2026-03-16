-- Migration: Align Admin Auth Table and Seed Credentials
-- Date: 2026-03-15
-- Target: active project database

-- 1. Ensure admin_user_sync has the correct columns and snake_case aliases
DO $$ 
BEGIN 
    -- Add username if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_user_sync' AND column_name='username') THEN
        ALTER TABLE public.admin_user_sync ADD COLUMN username TEXT;
    END IF;

    -- Add password if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_user_sync' AND column_name='password') THEN
        ALTER TABLE public.admin_user_sync ADD COLUMN password TEXT;
    END IF;

    -- Handle snake_case for is_active (mapping from isActive if needed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_user_sync' AND column_name='is_active') THEN
        -- If isActive exists, we can use it, but for our code let's ensure is_active exists
        ALTER TABLE public.admin_user_sync ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Seed the requested admin user
-- We'll set adjilUserId to a dummy value since it's NOT NULL in the original schema
INSERT INTO public.admin_user_sync (username, password, role, is_active, email, "adjilUserId", name)
VALUES ('admin', 'admin', 'ceo', true, 'admin@adjil.dz', 'ADMIN_SEED_001', 'System Administrator')
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Also seed into staff table just in case other parts of the system use it
INSERT INTO public.staff (first_name, last_name, email, role, is_active, password_hash)
VALUES ('Admin', 'CEO', 'admin@adjil.dz', 'ceo', true, 'admin')
ON CONFLICT (email) DO UPDATE 
SET role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Update existing users to have a default password if needed
UPDATE public.admin_user_sync SET password = 'password' WHERE password IS NULL;
UPDATE public.admin_user_sync SET username = email WHERE username IS NULL;
