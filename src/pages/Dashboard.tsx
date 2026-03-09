import { useEffect, useState } from 'react'
import KpiCard from '../components/KpiCard'
import FinanceChart from '../components/FinanceChart'
import { fetchTransactions, fetchUsers } from '../lib/data'
import { TransactionRecord, UserRecord } from '../lib/types'

export default function Dashboard() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])

  useEffect(() => {
    fetchUsers().then(setUsers)
    fetchTransactions().then(setTransactions)
  }, [])

  const activeUsers = users.filter((u) => u.status === 'active').length
  const inactiveUsers = users.filter((u) => u.status && u.status !== 'active').length
  const totalAmount = transactions.reduce((acc, tx) => acc + Number(tx.amount || 0), 0)

  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-4 gap-4">
        <KpiCard title="إجمالي المسجلين / Total users" value={String(users.length)} delta="+2.1%" />
        <KpiCard title="الحسابات النشطة / Active" value={String(activeUsers)} delta="+1.4%" />
        <KpiCard title="غير النشطة / Inactive" value={String(inactiveUsers)} />
        <KpiCard title="إجمالي المعاملات / Volume" value={`${totalAmount.toLocaleString('fr-DZ')} دج`} />
      </div>
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <FinanceChart data={transactions} />
        <div className="nexus-card p-6 space-y-4">
          <div className="font-bold">Live Transactions</div>
          <div className="space-y-3 max-h-[360px] overflow-auto">
            {transactions.slice(0, 8).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-semibold">{tx.customer_name || 'عميل'}</div>
                  <div className="text-xs text-slate-400">{tx.id}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{Number(tx.amount || 0).toLocaleString('fr-DZ')} دج</div>
                  <div className="text-xs text-slate-400">{tx.method || 'BNPL'}</div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div className="text-xs text-slate-400">لا توجد معاملات حالياً</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
