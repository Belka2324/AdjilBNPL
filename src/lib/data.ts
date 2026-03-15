import { Institution, StaffRecord, TicketRecord, TransactionRecord, UserRecord } from './types'
import { supabase, hasSupabase } from './supabase'

const CACHE_KEYS = {
  users: 'adjil_users_cache',
  staff: 'adjil_staff_cache',
  transactions: 'adjil_transactions_cache',
  tickets: 'adjil_tickets_cache'
}

const CACHE_DURATION = 5 * 60 * 1000

const getCached = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key)
      return null
    }
    return data
  } catch {
    return null
  }
}

const setCache = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch (e) {
    console.warn('Cache write failed:', e)
  }
}

export const clearCache = () => {
  Object.values(CACHE_KEYS).forEach(k => localStorage.removeItem(k))
}

export const INSTITUTIONS: Institution[] = [
  {
    id: 'bna',
    name: 'البنك الوطني الجزائري',
    name_en: 'BNA - Banque Nationale d\'Algérie',
    name_fr: 'Banque Nationale d\'Algérie',
    logo: '/assets/banks/bna.png',
    code: 'BNA'
  },
  {
    id: 'badr',
    name: 'بنك الفلاحة والتنميةRural',
    name_en: 'BADR - Banque Agriculture et Développement Rural',
    name_fr: 'Banque de l\'Agriculture et du Développement Rural',
    logo: '/assets/banks/badr.jpg',
    code: 'BADR'
  },
  {
    id: 'cnep',
    name: 'الصندوق الوطني للتوفير والاحتياط',
    name_en: 'CNEP - Caisse Nationale d\'Epargne et de Prévoyance',
    name_fr: 'Caisse Nationale d\'Epargne et de Prévoyance',
    logo: '/assets/banks/cnep.png',
    code: 'CNEP'
  },
  {
    id: 'bea',
    name: 'بنك خارجية الجزائر',
    name_en: 'BEA - Banque Extérieure d\'Algérie',
    name_fr: 'Banque Extérieure d\'Algérie',
    logo: '/assets/banks/bea.jpg',
    code: 'BEA'
  },
  {
    id: 'ccp',
    name: 'بريد الجزائر - CCP',
    name_en: 'Algerie Poste - CCP',
    name_fr: 'Algerie Poste - CCP',
    logo: '/assets/banks/ccp.png',
    code: 'CCP'
  },
  {
    id: 'bnp',
    name: 'بي إن بي باريبا',
    name_en: 'BNP Paribas',
    name_fr: 'BNP Paribas',
    logo: '/assets/banks/bnp.png',
    code: 'BNP'
  }
]

export const getInstitutionById = (id: string): Institution | undefined => {
  return INSTITUTIONS.find(inst => inst.id === id)
}

export const getInstitutionByCode = (code: string): Institution | undefined => {
  return INSTITUTIONS.find(inst => inst.code === code)
}

// ============================================
// User Management Functions
// ============================================

export const fetchUsers = async (): Promise<UserRecord[]> => {
  const cached = getCached<UserRecord[]>(CACHE_KEYS.users)
  if (cached) return cached
  
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
      return getCached<UserRecord[]>(CACHE_KEYS.users) || getDemoUsers()
    }
    if (data && data.length > 0) {
      setCache(CACHE_KEYS.users, data)
      return data
    }
  }
  
  const demo = getDemoUsers()
  setCache(CACHE_KEYS.users, demo)
  return demo
}

export const fetchTeamMembers = async (): Promise<UserRecord[]> => {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['admin', 'administrator', 'partner', 'support', 'ceo'])
    
    if (error) {
      console.error('Error fetching team members:', error)
      return []
    }
    return data || []
  }
  return []
}

export const moveFromBlacklistToFrozen = async (userId: string, reason?: string): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('users')
      .update({ status: 'frozen' })
      .eq('id', userId)
    
    if (error) {
      console.error('Error moving user to frozen:', error)
      throw error
    }
    clearCache()
  } else {
    console.log('Moving user to frozen:', userId, reason)
  }
}

export const updateUserStatus = async (userId: string, status: string): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
    
    if (error) {
      console.error('Error updating user status:', error)
      throw error
    }
    clearCache()
  }
}

export const addToBlacklist = async (userId: string): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('users')
      .update({ status: 'blacklisted' })
      .eq('id', userId)
    
    if (error) {
      console.error('Error adding user to blacklist:', error)
      throw error
    }
    clearCache()
  }
}

export const removeFromBlacklist = async (userId: string): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', userId)
    
    if (error) {
      console.error('Error removing user from blacklist:', error)
      throw error
    }
    clearCache()
  }
}

export const deleteTeamMember = async (userId: string): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) {
      console.error('Error deleting team member:', error)
      throw error
    }
  }
}

export const createTeamMember = async (member: {
  name: string
  email: string
  password: string
  role: string
  username: string
}): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('users')
      .insert({
        name: member.name,
        email: member.email,
        role: member.role,
        status: 'active'
      })
    
    if (error) {
      console.error('Error creating team member:', error)
      throw error
    }
  }
}

// ============================================
// Staff Table Functions (new staff table)
// ============================================

export const fetchStaff = async (): Promise<StaffRecord[]> => {
  const cached = getCached<StaffRecord[]>(CACHE_KEYS.staff)
  if (cached) return cached
  
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching staff:', error)
      return getCached<StaffRecord[]>(CACHE_KEYS.staff) || getDemoStaff()
    }
    if (data && data.length > 0) {
      setCache(CACHE_KEYS.staff, data)
      return data
    }
  }
  
  const demo = getDemoStaff()
  setCache(CACHE_KEYS.staff, demo)
  return demo
}

export const fetchStaffById = async (id: string): Promise<StaffRecord | null> => {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching staff member:', error)
      return null
    }
    return data
  }
  
  const demo = getDemoStaff()
  return demo.find(s => s.id === id) || null
}

export const createStaff = async (member: Omit<StaffRecord, 'id' | 'created_at' | 'updated_at' | 'reports_count' | 'messages_count'>): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('staff')
      .insert(member)
    
    if (error) {
      console.error('Error creating staff member:', error)
      throw error
    }
    clearCache()
  }
}

export const updateStaff = async (id: string, updates: Partial<StaffRecord>): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('staff')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      console.error('Error updating staff member:', error)
      throw error
    }
    clearCache()
  }
}

export const deleteStaff = async (id: string): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting staff member:', error)
      throw error
    }
    clearCache()
  }
}

// ============================================
// Transaction Functions
// ============================================

export const fetchTransactions = async (): Promise<TransactionRecord[]> => {
  const cached = getCached<TransactionRecord[]>(CACHE_KEYS.transactions)
  if (cached) return cached
  
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching transactions:', error)
      return getCached<TransactionRecord[]>(CACHE_KEYS.transactions) || getDemoTransactions()
    }
    if (data && data.length > 0) {
      setCache(CACHE_KEYS.transactions, data)
      return data
    }
  }
  
  const demo = getDemoTransactions()
  setCache(CACHE_KEYS.transactions, demo)
  return demo
}

export const updateTransactionPaidStatus = async (transactionId: string, paid: boolean): Promise<void> => {
  if (hasSupabase && supabase) {
    const { error } = await supabase
      .from('transactions')
      .update({ 
        paid, 
        paid_at: paid ? new Date().toISOString() : null 
      })
      .eq('id', transactionId)
    
    if (error) {
      console.error('Error updating transaction paid status:', error)
      throw error
    }
    clearCache()
  }
}

export const fetchTickets = async (): Promise<TicketRecord[]> => {
  const cached = getCached<TicketRecord[]>(CACHE_KEYS.tickets)
  if (cached) return cached
  
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching tickets:', error)
      return getCached<TicketRecord[]>(CACHE_KEYS.tickets) || getDemoTickets()
    }
    if (data && data.length > 0) {
      setCache(CACHE_KEYS.tickets, data)
      return data
    }
  }
  
  const demo = getDemoTickets()
  setCache(CACHE_KEYS.tickets, demo)
  return demo
}

const getDemoTickets = (): TicketRecord[] => [
  { id: 't1', user_email: 'ahmed@example.com', subject: 'مشكلة في الدفع', description: 'لا أستطيع إكمال عملية الدفع', status: 'open', created_at: '2024-01-20' },
  { id: 't2', user_email: 'sarah@example.com', subject: 'استفسار حول الفاتورة', description: 'أريد توضيح حول تفاصيل الفاتورة', status: 'pending', created_at: '2024-01-19' },
  { id: 't3', user_email: 'karim@example.com', subject: 'طلب تأجيل دفع', description: 'أرجو تأجيل موعد الدفع لمدة شهر', status: 'resolved', created_at: '2024-01-18' },
  { id: 't4', user_email: 'fatima@example.com', subject: 'مشكلة في الحساب', description: 'لا أستطيع تسجيل الدخول', status: 'open', created_at: '2024-01-17' }
]

// Demo transactions for development
const getDemoTransactions = (): TransactionRecord[] => [
  { id: 'tx1', amount: 25000, method: 'BNPL', status: 'completed', paid: true, paid_at: '2024-01-15', created_at: '2024-01-14', merchant_name: 'متجر الإلكترونيات', customer_name: 'أحمد محمد', merchant_id: 'm1', customer_id: 'u1', merchant_activity: 'إلكترونيات', merchant_location: 'الجزائر', customer_card: '****1234' },
  { id: 'tx2', amount: 15000, method: 'BNPL', status: 'pending', paid: false, created_at: '2024-01-16', merchant_name: 'متجر الملابس', customer_name: 'سارة علي', merchant_id: 'm2', customer_id: 'u2', merchant_activity: 'ملابس', merchant_location: 'وهران', customer_card: '****5678' },
  { id: 'tx3', amount: 8000, method: 'INSTALLMENT', status: 'completed', paid: true, paid_at: '2024-01-10', created_at: '2024-01-08', merchant_name: 'صيدلية المدينة', customer_name: 'كريم بن يوسف', merchant_id: 'm3', customer_id: 'u3', merchant_activity: 'صيدلية', merchant_location: 'قسنطينة', customer_card: '****9012' },
  { id: 'tx4', amount: 45000, method: 'BNPL', status: 'completed', paid: true, paid_at: '2024-01-18', created_at: '2024-01-17', merchant_name: 'معرض السيارات', customer_name: 'فاطمة زهراء', merchant_id: 'm4', customer_id: 'u4', merchant_activity: 'سيارات', merchant_location: 'عنابة', customer_card: '****3456' },
  { id: 'tx5', amount: 12000, method: 'BNPL', status: 'frozen', paid: false, created_at: '2024-01-19', merchant_name: 'مطعم الطعام', customer_name: 'ياسين بوعبد الله', merchant_id: 'm5', customer_id: 'u5', merchant_activity: 'مطعم', merchant_location: 'سطيف', customer_card: '****7890' },
  { id: 'tx6', amount: 35000, method: 'INSTALLMENT', status: 'completed', paid: true, paid_at: '2024-01-20', created_at: '2024-01-19', merchant_name: 'متجر الأثاث', customer_name: 'منى حسن', merchant_id: 'm6', customer_id: 'u6', merchant_activity: 'أثاث', merchant_location: 'الجزائر', customer_card: '****1111' },
  { id: 'tx7', amount: 5000, method: 'BNPL', status: 'pending', paid: false, created_at: '2024-01-21', merchant_name: 'محل التدريب', customer_name: 'رشيد طويل', merchant_id: 'm7', customer_id: 'u7', merchant_activity: 'تعليم', merchant_location: 'وهران', customer_card: '****2222' },
  { id: 'tx8', amount: 20000, method: 'BNPL', status: 'completed', paid: true, paid_at: '2024-01-22', created_at: '2024-01-21', merchant_name: 'صالون تجميل', customer_name: 'هاجر سعيد', merchant_id: 'm8', customer_id: 'u8', merchant_activity: 'تجميل', merchant_location: 'قسنطينة', customer_card: '****3333' }
]

// Demo data for development
const getDemoUsers = (): UserRecord[] => [
  {
    id: '1',
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    role: 'customer',
    status: 'active',
    balance: 5000,
    location: 'الجزائر'
  },
  {
    id: '2',
    name: 'سارة علي',
    email: 'sarah@example.com',
    role: 'customer',
    status: 'active',
    balance: 0,
    location: 'وهران'
  }
]

// Demo staff data for development
const getDemoStaff = (): StaffRecord[] => [
  {
    id: '1',
    first_name: 'أحمد',
    last_name: 'محمد',
    email: 'ahmed.mohamed@adjil.dz',
    phone: '+213 770 000 001',
    address: 'الجزائر العاصمة',
    role: 'ceo',
    institution: 'Adjil HQ',
    bank_name: 'BNA',
    is_active: true,
    created_at: '2024-01-15',
    reports_count: 5,
    messages_count: 23
  },
  {
    id: '2',
    first_name: 'سارة',
    last_name: 'بلقاسم',
    email: 'sarah.belkasim@adjil.dz',
    phone: '+213 770 000 002',
    address: 'وهران',
    role: 'administrator',
    institution: 'Adjil HQ',
    bank_name: 'CNEP',
    is_active: true,
    created_at: '2024-02-01',
    reports_count: 12,
    messages_count: 45
  },
  {
    id: '3',
    first_name: 'كريم',
    last_name: 'بن يوسف',
    email: 'karim.benyoussef@adjil.dz',
    phone: '+213 770 000 003',
    address: 'قسنطينة',
    role: 'partner',
    institution: 'BNA',
    bank_name: 'BADR',
    is_active: true,
    created_at: '2024-03-10',
    reports_count: 3,
    messages_count: 15
  },
  {
    id: '4',
    first_name: 'فاطمة',
    last_name: 'زهراء',
    email: 'fatima.zahra@adjil.dz',
    phone: '+213 770 000 004',
    address: 'عنابة',
    role: 'support',
    institution: 'Adjil HQ',
    bank_name: 'CCP',
    is_active: true,
    created_at: '2024-04-05',
    reports_count: 8,
    messages_count: 67
  },
  {
    id: '5',
    first_name: 'ياسين',
    last_name: 'بوعبد الله',
    email: 'yacine.bouabdallah@adjil.dz',
    phone: '+213 770 000 005',
    address: 'سطيف',
    role: 'partner',
    institution: 'BADR',
    bank_name: 'BNA',
    is_active: false,
    created_at: '2024-05-20',
    reports_count: 1,
    messages_count: 4
  }
]
