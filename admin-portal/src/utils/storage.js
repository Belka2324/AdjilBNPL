// LocalStorage fallback for support tickets
const KEY = 'adjil_support_tickets_offline';

export function saveLocalTicket(ticket) {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push({ ...ticket, created_at: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn('Failed to save local ticket:', err);
  }
}

export function getLocalTickets() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

