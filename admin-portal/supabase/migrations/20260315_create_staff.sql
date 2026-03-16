-- Staff Table: Stores admin/team accounts separate from customers/merchants
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ceo', 'administrator', 'partner', 'support')),
    is_active BOOLEAN DEFAULT true,
    is_ceo BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anon/authenticated users to read staff (needed for login)
CREATE POLICY "Allow anon read staff" ON public.staff 
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated read staff" ON public.staff 
    FOR SELECT TO authenticated USING (true);

-- Policy: Allow service role to manage staff
CREATE POLICY "Allow service role manage staff" ON public.staff 
    FOR ALL TO service_role USING (true);

-- Insert default admin CEO user (password: admin - should be changed)
INSERT INTO public.staff (username, password, email, full_name, role, is_active, is_ceo)
VALUES ('admin', 'admin', 'admin@adjil.dz', 'المدير العام / CEO', 'ceo', true, true)
ON CONFLICT (username) DO NOTHING;

-- Insert demo staff users
INSERT INTO public.staff (username, password, email, full_name, role, is_active, is_ceo)
VALUES 
    ('support', 'support123', 'support@adjil.dz', 'دعم فني / Support', 'support', true, false),
    ('partner', 'partner123', 'partner@adjil.dz', 'شريك / Partner', 'partner', true, false),
    ('admin_user', 'admin123', 'admin@adjil.dz', 'مدير نظام / Administrator', 'administrator', true, false)
ON CONFLICT (username) DO NOTHING;
