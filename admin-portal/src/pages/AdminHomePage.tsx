import { useEffect, useMemo, useState } from 'react'
import KpiCard from '../components/KpiCard'
import FinanceChart from '../components/FinanceChart'
import { fetchTransactions, fetchUsers, fetchTickets } from '../lib/data'
import { TransactionRecord, UserRecord, TicketRecord } from '../lib/types'
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime'
import { getSession } from '../lib/storage'

export default function AdminHomePage() {
  const [initialUsers, setInitialUsers] = useState<UserRecord[]>([])
  const [initialTransactions, setInitialTransactions] = useState<TransactionRecord[]>([])
  const [initialTickets, setInitialTickets] = useState<TicketRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const session = getSession()

  const isSupport = session?.role === 'support'
  const isPartner = session?.role === 'partner'

  // Hydration sync fix: Wait for client-side mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    Promise.all([fetchUsers(), fetchTransactions(), fetchTickets()])
      .then(([usersData, transactionsData, ticketsData]) => {
        setInitialUsers(usersData)
        setInitialTransactions(transactionsData)
        setInitialTickets(ticketsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Hook into our Realtime Engine
  const { data: allUsers, isLive: usersLive } = useSupabaseRealtime<UserRecord>('users', initialUsers)
  const { data: allTransactions, isLive: txLive } = useSupabaseRealtime<TransactionRecord>('transactions', initialTransactions)
  const { data: allTickets } = useSupabaseRealtime<TicketRecord>('support_tickets', initialTickets)

  // Role-based Data Filtering
  const users = useMemo(() => {
    if (isPartner) {
      // Partner sees only a subset of merchants (Mock filter: even ID length or specific assigned logic)
      const inst = localStorage.getItem('partner_institution')
      return allUsers.filter(u => u.role === 'merchant' && (inst ? String(u.id).includes(inst.charAt(0)) || true : true)) // Mock logic: partners see merchants
    }
    return allUsers
  }, [allUsers, isPartner])

  const transactions = useMemo(() => {
    if (isPartner) {
      const partnerMerchantIds = new Set(users.map(u => u.id))
      return allTransactions.filter(tx => partnerMerchantIds.has(tx.merchant_id || ''))
    }
    return allTransactions
  }, [allTransactions, users, isPartner])

  const tickets = isSupport ? allTickets : []

  const activeUsers = users.filter((u) => u.status === 'active').length
  const inactiveUsers = users.filter((u) => u.status && u.status !== 'active').length
  const merchants = users.filter((u) => u.role === 'merchant').length
  const customers = users.filter((u) => u.role === 'customer').length
  const totalAmount = transactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0)
  const pendingTransactions = transactions.filter((tx) => tx.status === 'pending').length

  const stats = useMemo(() => {
    const completedTx = transactions.filter((tx) => tx.status === 'completed')
    const pendingTx = transactions.filter((tx) => tx.status === 'pending')
    const failedTx = transactions.filter((tx) => tx.status === 'failed')
    
    const totalSales = completedTx.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    const pendingAmount = pendingTx.reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    
    const merchantSales: Record<string, number> = {}
    completedTx.forEach((tx) => {
      const mName = tx.merchant_name || 'unknown'
      merchantSales[mName] = (merchantSales[mName] || 0) + Number(tx.amount || 0)
    })
    const topMerchants = Object.entries(merchantSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    
    const customerPurchases: Record<string, number> = {}
    completedTx.forEach((tx) => {
      const cName = tx.customer_name || 'unknown'
      customerPurchases[cName] = (customerPurchases[cName] || 0) + Number(tx.amount || 0)
    })
    const topCustomers = Object.entries(customerPurchases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    
    const totalBalance = users.reduce((sum, u) => sum + Number(u.balance || 0), 0)
    const totalOutstanding = users.reduce((sum, u) => sum + Number(u.outstanding || 0), 0)
    const totalCreditLimit = users.reduce((sum, u) => sum + Number(u.credit_limit || 0), 0)
    
    return {
      completedCount: completedTx.length,
      pendingCount: pendingTx.length,
      failedCount: failedTx.length,
      totalSales,
      pendingAmount,
      topMerchants,
      topCustomers,
      totalBalance,
      totalOutstanding,
      totalCreditLimit
    }
  }, [users, transactions])

  if (!isMounted || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  const isSystemLive = usersLive && txLive

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard title="إجمالي المسجلين" value={String(users.length)} delta="+2.1%" icon="fa-users" />
        <KpiCard title="الحسابات النشطة" value={String(activeUsers)} delta="+1.4%" icon="fa-user-check" />
        {!isSupport && (
          <>
            <KpiCard title="التجار" value={String(merchants)} icon="fa-store" color="dark" />
            <KpiCard title="إجمالي المعاملات" value={`${(totalAmount / 1000).toFixed(1)}k`} icon="fa-coins" />
            <KpiCard title="العملاء" value={String(customers)} icon="fa-user" color="dark" />
            <KpiCard title="المعاملات المعلقة" value={String(pendingTransactions)} icon="fa-clock" delta="3" />
            <KpiCard title="غير النشطة" value={String(inactiveUsers)} icon="fa-user-slash" color="dark" />
          </>
        )}
        {isSupport && (
          <>
            <KpiCard title="الشكاوي المفتوحة" value={String(tickets.filter(t => t.status !== 'closed').length)} icon="fa-envelope-open" color="dark" />
            <KpiCard title="الشكاوي المغلقة" value={String(tickets.filter(t => t.status === 'closed').length)} icon="fa-check-double" />
            <KpiCard title="الشكاوي الكلية" value={String(tickets.length)} icon="fa-ticket" />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {!isSupport ? (
          <>
            <div className="nexus-card p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div className="text-xs opacity-80">المبيعات المكتملة</div>
              <div className="text-xl font-bold">{stats.totalSales.toLocaleString('fr-DZ')} دج</div>
              <div className="text-xs opacity-80">{stats.completedCount} عملية</div>
            </div>
            <div className="nexus-card p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="text-xs opacity-80">في الانتظار</div>
              <div className="text-xl font-bold">{stats.pendingAmount.toLocaleString('fr-DZ')} دج</div>
              <div className="text-xs opacity-80">{stats.pendingCount} عملية</div>
            </div>
            <div className="nexus-card p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="text-xs opacity-80">إجمالي الرصيد</div>
              <div className="text-xl font-bold">{stats.totalBalance.toLocaleString('fr-DZ')} دج</div>
              <div className="text-xs opacity-80">{isPartner ? 'أرصدة التجار' : 'جميع المستخدمين'}</div>
            </div>
            <div className="nexus-card p-4 bg-gradient-to-br from-red-500 to-red-600 text-white">
              <div className="text-xs opacity-80">المستحقات</div>
              <div className="text-xl font-bold">{stats.totalOutstanding.toLocaleString('fr-DZ')} دج</div>
              <div className="text-xs opacity-80">المبلغ المطلوب تحصيله</div>
            </div>
          </>
        ) : (
          <div className="col-span-4 nexus-card p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white flex justify-between items-center">
            <div>
              <div className="text-xs opacity-80">نظرة عامة على الدعم الفني</div>
              <div className="text-xl font-bold">إدارة الشكاوي والنزاعات النشطة</div>
            </div>
            <i className="fa-solid fa-headset text-4xl opacity-50"></i>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <FinanceChart data={transactions} />
        
        <div className="nexus-card p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800">Live Transactions</h3>
            {isSystemLive ? (
              <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Offline
              </span>
            )}
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-auto custom-scrollbar pr-2">
            {!isSupport ? (
              transactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="group p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:border-nexus-gold/30 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-black text-sm text-slate-800">{tx.customer_name || 'عميل'}</div>
                    <div className="font-black text-sm text-nexus-gold">{Number(tx.amount || 0).toLocaleString('fr-DZ')} دج</div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>🛒 {tx.merchant_name || 'تاجر'}</span>
                    <span className={`px-1.5 py-0.5 rounded ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {tx.status === 'completed' ? 'مكتمل' : tx.status === 'pending' ? 'قيد الانتظار' : 'فشل'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              tickets.slice(0, 8).map((t) => (
                <div key={t.id} className="group p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:border-purple-300 hover:bg-white transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-black text-sm text-slate-800">{t.subject || 'بدون موضوع'}</div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${t.status === 'closed' ? 'bg-slate-200 text-slate-600' : 'bg-red-100 text-red-700'}`}>
                      {t.status === 'closed' ? 'مغلق' : 'مفتوح (Open)'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{t.description?.substring(0, 50)}...</div>
                  <div className="text-[10px] text-slate-400">{t.user_email}</div>
                </div>
              ))
            )}
            
            {((!isSupport && transactions.length === 0) || (isSupport && tickets.length === 0)) && (
              <div className="text-center py-10 opacity-40">
                <i className={`fa-solid ${isSupport ? 'fa-envelope-open' : 'fa-receipt'} text-3xl mb-2`}></i>
                <p className="text-[10px] font-black uppercase tracking-widest">{isSupport ? 'No Active Disputes' : 'No transactions available'}</p>
              </div>
            )}
          </div>
          
          <button className="w-full py-4 rounded-2xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-700 transition-all shadow-lg shadow-slate-200">
            View All Reports
          </button>
        </div>
      </div>

      {!isSupport && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="nexus-card p-6">
            <h3 className="font-bold text-slate-800 mb-4">🏪 أفضل التجار</h3>
            {stats.topMerchants.length > 0 ? (
              <div className="space-y-3">
                {stats.topMerchants.map(([name, amount], idx) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-medium text-sm">{name}</span>
                    </div>
                    <span className="font-bold text-green-600">{amount.toLocaleString('fr-DZ')} دج</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">لا توجد بيانات</div>
            )}
          </div>

          {!isPartner && (
            <div className="nexus-card p-6">
              <h3 className="font-bold text-slate-800 mb-4">👤 أكبر العملاء مشترياً</h3>
              {stats.topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {stats.topCustomers.map(([name, amount], idx) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-purple-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-300'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-medium text-sm">{name}</span>
                      </div>
                      <span className="font-bold text-blue-600">{amount.toLocaleString('fr-DZ')} دج</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">لا توجد بيانات</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
