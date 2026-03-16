// Lightweight Supabase client initializer for frontend services
// Reads environment variables injected at build/deploy (Netlify)
// Falls back to existing global supabase client if available.

export function getSupabaseClient() {
  if (window.supabaseClient) return window.supabaseClient;
  const url = window?.ENV_SUPABASE_URL || (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : null);
  const key = window?.ENV_SUPABASE_ANON_KEY || (typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : null);
  if (!url || !key || !window.supabase) {
    console.warn('Supabase client not initialized: missing URL/KEY or supabase library');
    return null;
  }
  try {
    const client = window.supabase.createClient(url, key);
    window.supabaseClient = client;
    return client;
  } catch (err) {
    console.error('Supabase init error:', err);
    return null;
  }
}

