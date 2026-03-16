// Mail service: insert support tickets and rely on Supabase trigger to email
import { getSupabaseClient } from '../services/supabaseClient.js';
import { saveLocalTicket } from '../utils/storage.js';

export async function createSupportTicket({ userEmail, subject, description }) {
  const client = getSupabaseClient();
  const payload = {
    user_email: userEmail || null,
    subject: subject || null,
    description: description || null
  };
  if (!client) {
    // Fallback: save locally
    saveLocalTicket(payload);
    return { ok: false, offline: true };
  }
  const { data, error } = await client.from('support_tickets').insert(payload).select().maybeSingle();
  if (error) {
    saveLocalTicket(payload);
    return { ok: false, error: error.message };
  }
  return { ok: true, ticket: data };
}

