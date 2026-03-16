-- Fix Security Definer Vulnerability for active_synced_users view
-- Run this in Supabase SQL Editor

-- Step 1: Check current view definition
SELECT pg_get_viewdef('public.active_synced_users', true) as view_definition;

-- Step 2: Check view security properties using pg_get_userdef
SELECT 
    proname,
    prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname = 'active_synced_users';

-- Step 3: Alternative - check if view exists
SELECT * FROM pg_views WHERE viewname = 'active_synced_users' AND schemaname = 'public';
