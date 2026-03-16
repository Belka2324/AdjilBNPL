
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://opxiwposdessahcimksq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9weGl3cG9zZGVzc2FoY2lta3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzM0MTcsImV4cCI6MjA4NzU0OTQxN30.NC6Xr9mCt0Dg_n__uAX858MDo-IeK2KuCdgHzVhG3OA';

let supabase = null;

export const getSupabaseClient = () => {
    if (supabase) return supabase;

    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabase;
    } catch (error) {
        console.error('Supabase initialization failed:', error);
        return null;
    }
};

export default getSupabaseClient;
