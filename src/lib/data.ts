import { supabase } from './supabase'
import { TicketRecord, TransactionRecord, UserRecord } from './types'

const parse = <T>(key: string, fallback: T) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const normalizeUsers = (users: UserRecord[]) =>
  users.map((u) => ({
    ...u,
    balance: Number(u.balance || 0),
    credit_limit: Number(u.credit_limit || 0)
  }))

export const fetchUsers = async (): Promise<UserRecord[]> => {
  if (supabase) {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    return normalizeUsers((data as UserRecord[]) || [])
  }
  const local = parse<UserRecord[]>('adjil_users', [])
  return normalizeUsers(local)
}

export const fetchTransactions = async (): Promise<TransactionRecord[]> => {
  if (supabase) {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    return (data as TransactionRecord[]) || []
  }
  const local = parse<TransactionRecord[]>('adjil_transactions', [])
  return local
}

export const fetchTickets = async (): Promise<TicketRecord[]> => {
  if (supabase) {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false })
    return (data as TicketRecord[]) || []
  }
  const local = parse<TicketRecord[]>('adjil_tickets', [])
  return local
}
