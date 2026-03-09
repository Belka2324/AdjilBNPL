import { useEffect, useMemo, useState } from 'react'
import { fetchTransactions, fetchUsers } from '../lib/data'
import { TransactionRecord, UserRecord } from '../lib/types'

export default function Users() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<UserRecord | null>(null)

  useEffect(() => {
    fetchUsers().then((data) => {
      setUsers(data.filter((u) => u.role !== 'merchant'))
    })
    fetchTransactions().then(setTransactions)
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return users.filter(
      (u) =>
        String(u.name || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.phone || '').toLowerCase().includes(q)
    )
  }, [query, users])

  const userTxs = useMemo(() => {
    if (!selected) return []
    return transactions.filter((t) => t.customer_id === selected.id || t.customer_name === selected.name)
  }, [selected, transactions])

  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
      <div className="nexus-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-bold">الزبائن / Customers / Clients</div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none"
            placeholder="بحث"
          />
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="text-right py-2">الاسم</th>
                <th className="text-right py-2">الهاتف</th>
                <th className="text-right py-2">الباقة</th>
                <th className="text-right py-2">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelected(u)}
                >
                  <td className="py-3">{u.name || '—'}</td>
                  <td className="py-3">{u.phone || '—'}</td>
                  <td className="py-3">{u.subscription_plan || '—'}</td>
                  <td className="py-3">{u.status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-xs text-slate-400 mt-4">لا توجد نتائج</div>}
        </div>
      </div>

      <div className="nexus-card p-6 space-y-4">
        <div className="font-bold">تفاصيل الحساب</div>
        {selected ? (
          <div className="space-y-3 text-sm">
            <div className="font-semibold">{selected.name}</div>
            <div>البريد: {selected.email || '—'}</div>
            <div>الهاتف: {selected.phone || '—'}</div>
            <div>الولاية: {selected.wilaya || '—'}</div>
            <div>الرصيد: {Number(selected.balance || 0).toLocaleString('fr-DZ')} دج</div>
            <div className="pt-3 border-t border-slate-100">
              <div className="font-semibold mb-2">المعاملات الفردية</div>
              {userTxs.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex justify-between text-xs">
                  <span>{tx.id}</span>
                  <span>{Number(tx.amount || 0).toLocaleString('fr-DZ')} دج</span>
                </div>
              ))}
              {userTxs.length === 0 && <div className="text-xs text-slate-400">لا توجد معاملات</div>}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">اختر حساباً لعرض التفاصيل</div>
        )}
      </div>
    </div>
  )
}
