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
    'settings'
  ],
  partner: ['overview', 'merchants', 'transactions', 'invoices'],
  support: ['overview', 'users', 'complaints']
}

export const navItems: NavItem[] = [
  { key: 'overview', label: 'لوحة الإحصائيات / Tableau de bord / Dashboard', path: '/dashboard' },
  { key: 'merchants', label: 'التجار / Marchands / Merchants', path: '/dashboard/merchants' },
  { key: 'users', label: 'الزبائن / Clients / Customers', path: '/dashboard/users' },
  { key: 'transactions', label: 'العمليات / Opérations / Transactions', path: '/dashboard/transactions' },
  { key: 'blacklist', label: 'القائمة السوداء / Blacklist / Blacklist', path: '/dashboard/blacklist' },
  { key: 'frozen', label: 'حسابات مجمدة / Comptes gelés / Frozen', path: '/dashboard/frozen' },
  { key: 'complaints', label: 'الشكاوي / Réclamations / Complaints', path: '/dashboard/complaints' },
  { key: 'invoices', label: 'الفواتير / Factures / Invoices', path: '/dashboard/invoices' },
  { key: 'audit', label: 'سجل النشاط / Audit / Logs', path: '/dashboard/audit' },
  { key: 'settings', label: 'الإعدادات / Paramètres / Settings', path: '/dashboard/settings' }
]
