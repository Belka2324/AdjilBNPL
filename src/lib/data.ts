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

const setLocal = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data))
}

// Map admin portal status to Supabase status
const toSupabaseStatus = (status: string): string => {
  switch (status) {
    case 'frozen': return 'suspended'
    case 'blacklisted': return 'inactive'
    default: return status
  }
}

// Map Supabase status to admin portal display status
const toDisplayStatus = (status: string): string => {
  switch (status) {
    case 'suspended': return 'frozen'
    case 'inactive': return 'blacklisted'
    default: return status
  }
}

const normalizeUsers = (users: UserRecord[]) =>
  users.map((u) => ({
    ...u,
    status: toDisplayStatus(u.status || 'active'),
    balance: Number(u.balance || 0),
    credit_limit: Number(u.credit_limit || 0)
  }))

// Initialize local storage with sample data
const initLocalStorage = () => {
  if (!localStorage.getItem('adjil_users')) {
    const sampleUsers: UserRecord[] = [
      {
        id: 'user-1',
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '0550123456',
        role: 'customer',
        status: 'active',
        balance: 50000,
        credit_limit: 100000,
        wilaya: 'الجزائر',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-2',
        name: 'متجر الإلكتروني',
        email: 'store@example.com',
        phone: '0551987654',
        role: 'merchant',
        status: 'active',
        balance: 150000,
        outstanding: 25000,
        credit_limit: 500000,
        activity: 'تجارة إلكترونية',
        wilaya: 'وهران',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-3',
        name: 'علي يمان',
        email: 'ali@example.com',
        phone: '0553987654',
        role: 'customer',
        status: 'frozen',
        balance: 10000,
        credit_limit: 50000,
        wilaya: 'قسنطينة',
        created_at: new Date().toISOString()
      },
      {
        id: 'user-4',
        name: 'تجار الخليج',
        email: 'gulf@example.com',
        phone: '0555987654',
        role: 'merchant',
        status: 'blacklisted',
        balance: 0,
        outstanding: 0,
        credit_limit: 0,
        activity: 'متجر مواد غذائية',
        wilaya: 'سطيف',
        created_at: new Date().toISOString()
      }
    ]
    setLocal('adjil_users', sampleUsers)
  }
  
  if (!localStorage.getItem('adjil_team_members')) {
    const sampleTeam: UserRecord[] = [
      {
        id: 'admin-1',
        name: 'مدير النظام',
        email: 'admin@adjil.dz',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ]
    setLocal('adjil_team_members', sampleTeam)
  }
}

// Initialize on first load
initLocalStorage()

export const fetchUsers = async (): Promise<UserRecord[]> => {
  // Try Supabase first
  if (supabase) {
    try {
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      if (data && data.length > 0) {
        // Update localStorage with Supabase data
        setLocal('adjil_users', data)
        return normalizeUsers(data)
      }
    } catch (e) {
      console.log('Supabase not available, using local data')
    }
  }
  
  // Fallback to localStorage
  const local = parse<UserRecord[]>('adjil_users', [])
  return normalizeUsers(local)
}

export const fetchTeamMembers = async (): Promise<UserRecord[]> => {
  if (supabase) {
    try {
      const { data } = await supabase.from('users').select('*').in('role', ['administrator', 'admin', 'partner', 'support']).order('created_at', { ascending: false })
      if (data && data.length > 0) {
        setLocal('adjil_team_members', data)
        return data
      }
    } catch (e) {
      console.log('Supabase not available, using local data')
    }
  }
  
  return parse<UserRecord[]>('adjil_team_members', [])
}

export const fetchTransactions = async (): Promise<TransactionRecord[]> => {
  if (supabase) {
    try {
      const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
      if (data && data.length > 0) {
        return data
      }
    } catch (e) {
      console.log('Supabase not available')
    }
  }
  return parse<TransactionRecord[]>('adjil_transactions', [])
}

export const fetchTickets = async (): Promise<TicketRecord[]> => {
  if (supabase) {
    try {
      const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false })
      if (data && data.length > 0) {
        return data
      }
    } catch (e) {
      console.log('Supabase not available')
    }
  }
  return parse<TicketRecord[]>('adjil_tickets', [])
}

export const updateUserStatus = async (userId: string, status: string, reason?: string): Promise<void> => {
  const supabaseStatus = toSupabaseStatus(status)
  
  // Update in Supabase
  if (supabase) {
    try {
      await supabase.from('users').update({ status: supabaseStatus }).eq('id', userId)
    } catch (e) {
      console.log('Supabase update failed')
    }
  }
  
  // Update localStorage
  let local = parse<UserRecord[]>('adjil_users', [])
  const userIndex = local.findIndex((u) => u.id === userId)
  
  if (userIndex >= 0) {
    local[userIndex] = { ...local[userIndex], status }
    setLocal('adjil_users', local)
  }
  
  // Add notification
  addNotification({
    title: status === 'active' ? '✅ تم تفعيل الحساب' : status === 'frozen' ? '❄️ تم تجميد الحساب' : '🛑 تم إضافة الحساب للقائمة السوداء',
    message: reason || `تم تغيير حالة الحساب إلى: ${status === 'frozen' ? 'مجمّد' : status === 'blacklisted' ? 'قائمة سوداء' : status}`,
    type: status === 'active' ? 'success' : status === 'frozen' ? 'warning' : 'error'
  })
}

export const addToBlacklist = async (userId: string, reason?: string): Promise<void> => {
  const supabaseStatus = toSupabaseStatus('blacklisted')
  
  // Update in Supabase
  if (supabase) {
    try {
      await supabase.from('users').update({ status: supabaseStatus }).eq('id', userId)
    } catch (e) {
      console.log('Supabase update failed')
    }
  }
  
  // Update localStorage
  let local = parse<UserRecord[]>('adjil_users', [])
  const userIndex = local.findIndex((u) => u.id === userId)
  
  if (userIndex >= 0) {
    local[userIndex] = { ...local[userIndex], status: 'blacklisted' }
    setLocal('adjil_users', local)
  }
  
  // Add notification
  addNotification({
    title: '🛑 تم إضافة الحساب للقائمة السوداء',
    message: reason || 'تم إضافتك إلى القائمة السوداء من قبل الإدارة',
    type: 'error'
  })
}

export const removeFromBlacklist = async (userId: string): Promise<void> => {
  const supabaseStatus = toSupabaseStatus('active')
  
  // Update in Supabase
  if (supabase) {
    try {
      await supabase.from('users').update({ status: supabaseStatus }).eq('id', userId)
    } catch (e) {
      console.log('Supabase update failed')
    }
  }
  
  // Update localStorage
  let local = parse<UserRecord[]>('adjil_users', [])
  const userIndex = local.findIndex((u) => u.id === userId)
  
  if (userIndex >= 0) {
    local[userIndex] = { ...local[userIndex], status: 'active' }
    setLocal('adjil_users', local)
  }
  
  // Add notification
  addNotification({
    title: '✅ تم سحبك من القائمة السوداء',
    message: 'تم إعادة حسابك إلى قائمة المستخدمين النشطين',
    type: 'success'
  })
}

// Move account from blacklist to frozen (suspended)
export const moveFromBlacklistToFrozen = async (userId: string, reason?: string): Promise<void> => {
  const supabaseStatus = toSupabaseStatus('frozen')
  
  // Update in Supabase
  if (supabase) {
    try {
      await supabase.from('users').update({ status: supabaseStatus }).eq('id', userId)
    } catch (e) {
      console.log('Supabase update failed')
    }
  }
  
  // Update localStorage
  let local = parse<UserRecord[]>('adjil_users', [])
  const userIndex = local.findIndex((u) => u.id === userId)
  
  if (userIndex >= 0) {
    local[userIndex] = { ...local[userIndex], status: 'frozen' }
    setLocal('adjil_users', local)
  }
  
  // Add notification
  addNotification({
    title: '❄️ تم نقل الحساب إلى قائمة المجمدة',
    message: reason || 'تم نقل حسابك من القائمة السوداء إلى قائمة الحسابات المجمدة',
    type: 'warning'
  })
}

export const createTeamMember = async (userData: { name: string; email: string; password: string; role: string; username: string }): Promise<void> => {
  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    name: userData.name,
    email: userData.email,
    role: userData.role as any,
    status: 'active',
    created_at: new Date().toISOString()
  }
  
  // Store username and password separately for login (in real app would hash password)
  const loginInfo = {
    id: newUser.id,
    username: userData.username,
    password: userData.password, // In real app, hash this!
    role: userData.role,
    created_at: new Date().toISOString()
  }
  
  // Save to Supabase
  if (supabase) {
    try {
      await supabase.from('users').insert([newUser])
    } catch (e) {
      console.log('Supabase insert failed')
    }
  }
  
  // Save to local team members
  let teamMembers = parse<UserRecord[]>('adjil_team_members', [])
  teamMembers = [newUser, ...teamMembers]
  setLocal('adjil_team_members', teamMembers)
  
  // Save login credentials
  let loginData = parse<any[]>('adjil_login_data', [])
  loginData = [loginInfo, ...loginData]
  setLocal('adjil_login_data', loginData)
}

type NotificationType = 'info' | 'warning' | 'error' | 'success'

export const deleteTeamMember = async (userId: string): Promise<void> => {
  // Delete from Supabase
  if (supabase) {
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId)
      if (error) {
        console.error('Supabase delete error:', error)
      }
    } catch (e) {
      console.log('Supabase delete failed:', e)
    }
  }
  
  // Delete from local team members
  let teamMembers = parse<UserRecord[]>('adjil_team_members', [])
  teamMembers = teamMembers.filter((u) => u.id !== userId)
  setLocal('adjil_team_members', teamMembers)
  
  // Delete login credentials
  let loginData = parse<any[]>('adjil_login_data', [])
  loginData = loginData.filter((u) => u.id !== userId)
  setLocal('adjil_login_data', loginData)
  
  // Add notification
  addNotification({
    title: '✅ تم حذف الحساب',
    message: 'تم حذف حساب عضو الفريق وجميع بيانات الدخول',
    type: 'success'
  })
}

export const addNotification = (notification: { title: string; message: string; type: NotificationType }) => {
  const newNotif = {
    id: crypto.randomUUID(),
    ...notification,
    created_at: new Date().toISOString(),
    read: false
  }
  
  const existing = parse<any[]>('adjil_notifications', [])
  const updated = [newNotif, ...existing]
  localStorage.setItem('adjil_notifications', JSON.stringify(updated))
}

export const updateTransactionPaidStatus = async (transactionId: string, paid: boolean): Promise<void> => {
  const paidAt = paid ? new Date().toISOString() : null
  
  // Update in Supabase
  if (supabase) {
    try {
      await supabase.from('transactions').update({ paid, paid_at: paidAt }).eq('id', transactionId)
    } catch (e) {
      console.log('Supabase update failed')
    }
  }
  
  // Update localStorage
  let local = parse<TransactionRecord[]>('adjil_transactions', [])
  const txIndex = local.findIndex((t) => t.id === transactionId)
  
  if (txIndex >= 0) {
    local[txIndex] = { ...local[txIndex], paid, paid_at: paidAt || undefined }
    setLocal('adjil_transactions', local)
  }
  
  // Add notification
  addNotification({
    title: paid ? '✅ تم الدفع للتاجر' : '❌ تم إلغاء الدفع',
    message: paid ? `تم تأكيد دفع الفاتورة ${transactionId.slice(0, 8)}...` : `تم إلغاء دفع الفاتورة ${transactionId.slice(0, 8)}...`,
    type: paid ? 'success' : 'warning'
  })
}
