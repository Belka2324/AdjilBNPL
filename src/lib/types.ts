export type Role = 'administrator' | 'partner' | 'support' | 'admin' | 'customer' | 'merchant' | 'ceo'

export type StaffRole = 'administrator' | 'partner' | 'support' | 'ceo'

export type StaffRecord = {
  id: string
  username?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  role: StaffRole
  institution?: string
  bank_name?: string
  avatar_url?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  reports_count?: number
  messages_count?: number
}

export type UserRecord = {
  id: string
  name?: string
  email?: string
  phone?: string
  role?: 'customer' | 'merchant' | 'admin' | 'partner' | 'support'
  status?: string
  balance?: number
  outstanding?: number
  subscription_plan?: string
  credit_limit?: number
  location?: string
  wilaya?: string
  doc_id_front?: string
  doc_id_back?: string
  doc_payslip?: string
  doc_rib?: string
  doc_commercial_register?: string
  doc_contract?: string
  created_at?: string
  activity?: string
  last_synced_at?: string
  coords?: string
}

export type TransactionRecord = {
  id: string
  amount?: number
  method?: string
  status?: string
  paid?: boolean
  paid_at?: string
  created_at?: string
  merchant_name?: string
  customer_name?: string
  merchant_id?: string
  customer_id?: string
  merchant_activity?: string
  merchant_location?: string
  customer_card?: string
}

export type TicketRecord = {
  id: string
  user_email?: string
  subject?: string
  description?: string
  status?: string
  created_at?: string
}

export type StaffReport = {
  id: string
  staff_id: string
  title: string
  description: string
  type: 'warning' | 'complaint' | 'praise' | 'other'
  created_by: string
  created_at: string
}

export type StaffCommunication = {
  id: string
  staff_id: string
  subject: string
  body: string
  direction: 'incoming' | 'outgoing'
  created_at: string
}

export type Institution = {
  id: string
  name: string
  name_en: string
  name_fr: string
  logo: string
  code: string
}
