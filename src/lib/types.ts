export type Role = 'administrator' | 'partner' | 'support'

export type UserRecord = {
  id: string
  name?: string
  email?: string
  phone?: string
  role?: 'customer' | 'merchant'
  status?: string
  balance?: number
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
