-- Create support tickets table (non-breaking, preserves existing schema)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT,
    subject TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable HTTP extension for trigger-based webhooks (if available)
CREATE EXTENSION IF NOT EXISTS http;

-- Edge Function URL placeholder. Replace with your Supabase Functions URL.
-- Example: https://<PROJECT-REF>.functions.supabase.co/send-support-email
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_settings WHERE name = 'adjil_edge_function_url'
    ) THEN
        PERFORM set_config('adjil_edge_function_url', 'https://YOUR_PROJECT.functions.supabase.co/send-support-email', true);
    END IF;
END $$;

-- Trigger function: POST ticket payload to Edge Function upon insert
CREATE OR REPLACE FUNCTION public.notify_new_ticket()
RETURNS TRIGGER AS $$
DECLARE
    edge_url TEXT := current_setting('adjil_edge_function_url', true);
    payload JSONB;
BEGIN
    payload := jsonb_build_object(
        'id', NEW.id,
        'user_email', NEW.user_email,
        'subject', NEW.subject,
        'description', NEW.description,
        'created_at', NEW.created_at
    );
    PERFORM http_post(
        edge_url,
        payload::text,
        'application/json'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on insert
DROP TRIGGER IF EXISTS trg_notify_new_ticket ON public.support_tickets;
CREATE TRIGGER trg_notify_new_ticket
AFTER INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.notify_new_ticket();

