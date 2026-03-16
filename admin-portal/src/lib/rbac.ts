import { Role } from './types'

export type NavItem = {
  key: string
  label: string
  path: string
}

export const roleAccess: Record<Role, string[]> = {
  administrator: [
    'overview',
    'users',
    'merchants',
    'transactions',
    'blacklist',
    'frozen',
    'complaints',
    'invoices',
    'audit',
    'settings',
    'team',
    'messages'
  ],
  ceo: [
    'overview',
    'users',
    'merchants',
    'transactions',
    'blacklist',
    'frozen',
    'complaints',
    'invoices',
    'audit',
    'settings',
    'team',
    'messages'
  ],
  // Partner can see merchants, customers, transactions, invoices, messages
  partner: ['overview', 'merchants', 'users', 'transactions', 'invoices', 'messages'],
  // Support can see users, merchants, complaints, messages
  support: ['overview', 'users', 'merchants', 'complaints', 'messages'],
  // Admin role (same as administrator)
  admin: ['overview', 'users', 'merchants', 'transactions', 'blacklist', 'frozen', 'complaints', 'invoices', 'audit', 'settings', 'team', 'messages'],
  // Customer role (limited access)
  customer: ['overview'],
  // Merchant role (limited access)
  merchant: ['overview']
}

export const navItems: NavItem[] = [
  { key: 'overview', label: 'لوحة الإحصائيات / Tableau de bord / Dashboard', path: 'home' },
  { key: 'merchants', label: 'التجار / Marchands / Merchants', path: 'merchants' },
  { key: 'users', label: 'الزبائن / Clients / Customers', path: 'users' },
  { key: 'transactions', label: 'العمليات / Opérations / Transactions', path: 'transactions' },
  { key: 'blacklist', label: 'القائمة السوداء / Blacklist / Blacklist', path: 'blacklist' },
  { key: 'frozen', label: 'التحقق من الحسابات / Vérification / Verification', path: 'frozen' },
  { key: 'complaints', label: 'الشكاوي / Réclamations / Complaints', path: 'complaints' },
  { key: 'invoices', label: 'الفواتير / Factures / Invoices', path: 'invoices' },
  { key: 'audit', label: 'سجل النشاط / Audit / Logs', path: 'audit' },
  { key: 'settings', label: 'الإعدادات / Paramètres / Settings', path: 'settings' },
  { key: 'team', label: 'فريق العمل / Équipe / Team', path: 'team' },
  { key: 'messages', label: 'الرسائل / Messages / Chat', path: 'messages' }
]
