import { useEffect, useState } from 'react'
import KpiCard from '../components/KpiCard'
import FinanceChart from '../components/FinanceChart'
import { fetchTransactions, fetchUsers } from '../lib/data'
import { TransactionRecord, UserRecord } from '../lib/types'

export default function Dashboard() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchUsers(), fetchTransactions()])
      .then(([usersData, transactionsData]) => {
        setUsers(usersData)
        setTransactions(transactionsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const activeUsers = users.filter((u) => u.status === 'active').length
  const inactiveUsers = users.filter((u) => u.status && u.status !== 'active').length
  const merchants = users.filter((u) => u.role === 'merchant').length
  const customers = users.filter((u) => u.role === 'customer').length
  const totalAmount = transactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0)
  const pendingTransactions = transactions.filter((tx) => tx.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Compact KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard title="إجمالي المسجلين" value={String(users.length)} delta="+2.1%" icon="fa-users" />
        <KpiCard title="الحسابات النشطة" value={String(activeUsers)} delta="+1.4%" icon="fa-user-check" />
        <KpiCard title="التجار" value={String(merchants)} icon="fa-store" color="dark" />
        <KpiCard title="إجمالي المعاملات" value={`${(totalAmount / 1000).toFixed(1)}k`} icon="fa-coins" />
        <KpiCard title="العملاء" value={String(customers)} icon="fa-user" color="dark" />
        <KpiCard title="المعاملات المعلقة" value={String(pendingTransactions)} icon="fa-clock" delta="3" />
        <KpiCard title="غير النشطة" value={String(inactiveUsers)} icon="fa-user-slash" color="dark" />
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <FinanceChart data={transactions} />
        
        <div className="nexus-card p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-800">Live Transactions</h3>
            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-auto custom-scrollbar pr-2">
            {transactions.slice(0, 8).map((tx) => (
              <div key={tx.id} className="group p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:border-nexus-gold/30 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-black text-sm text-slate-800">{tx.customer_name || 'عميل'}</div>
                  <div className="font-black text-sm text-nexus-gold">{Number(tx.amount || 0).toLocaleString('fr-DZ')} دج</div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{tx.id?.slice(0, 8)}</span>
                  <span>{tx.method || 'BNPL'}</span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-10 opacity-40">
                <i className="fa-solid fa-receipt text-3xl mb-2"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No transactions available</p>
              </div>
            )}
          </div>
          
          <button className="w-full py-4 rounded-2xl bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-700 transition-all shadow-lg shadow-slate-200">
            View All Reports
          </button>
        </div>
      </div>
    </div>
  )
}
