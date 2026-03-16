import { useEffect, useMemo, useState } from 'react'
import { fetchTransactions, finalizePendingTransactions } from '../lib/data'
import { TransactionRecord } from '../lib/types'
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime'

export default function Transactions() {
  const [initialItems, setInitialItems] = useState<TransactionRecord[]>([])
  const [query, setQuery] = useState('')
  const [isFinalizing, setIsFinalizing] = useState(false)

  useEffect(() => {
    fetchTransactions().then(setInitialItems)
  }, [])

  const { data: items } = useSupabaseRealtime<TransactionRecord>('transactions', initialItems)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return items.filter(
      (t) =>
        String(t.id || '').toLowerCase().includes(q) ||
        String(t.customer_name || '').toLowerCase().includes(q) ||
        String(t.merchant_name || '').toLowerCase().includes(q)
    )
  }, [items, query])

  const handleFinalizeBatch = async () => {
    const pendingTxs = items.filter(t => t.status === 'pending')
    if (pendingTxs.length === 0) {
      alert('لا توجد معاملات قيد الانتظار / No pending transactions')
      return
    }

    if (!confirm(`هل أنت متأكد من تسوية ${pendingTxs.length} معاملة وتوليد ملف CSV؟\n\nAre you sure you want to finalize ${pendingTxs.length} transactions and generate a CSV?`)) {
      return
    }

    setIsFinalizing(true)
    try {
      const ids = pendingTxs.map(t => String(t.id))
      await finalizePendingTransactions(ids)

      // Generate CSV
      let csvContent = "ID,Date,Amount,Merchant,Customer,Method,Status\n"
      pendingTxs.forEach(t => {
        const row = [
          t.id,
          t.created_at,
          t.amount,
          t.merchant_name || '',
          t.customer_name || '',
          t.method || '',
          'completed'
        ].map(val => `"${val}"`).join(",")
        csvContent += row + "\n"
      })

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.setAttribute('download', `Settlement_Batch_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      alert('تمت التسوية بنجاح / Successfully finalized')
    } catch (err: any) {
      alert('Error finalizing transactions: ' + err.message)
    } finally {
      setIsFinalizing(false)
    }
  }

  return (
    <div className="nexus-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="font-bold flex items-center gap-4">
          <span>المعاملات / Transactions / Opérations</span>
          <button 
            onClick={handleFinalizeBatch}
            disabled={isFinalizing}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {isFinalizing ? (
              <span><i className="fa-solid fa-spinner fa-spin mr-2"></i> جاري التسوية...</span>
            ) : (
              <span><i className="fa-solid fa-file-csv mr-2"></i> تسوية CSV (Finalize Batch)</span>
            )}
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none w-full sm:w-auto"
          placeholder="بحث"
        />
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="text-right py-2">المعرف</th>
              <th className="text-right py-2">المبلغ</th>
              <th className="text-right py-2">الطريقة</th>
              <th className="text-right py-2">التاجر</th>
              <th className="text-right py-2">الزبون</th>
              <th className="text-right py-2">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="py-3">{t.id}</td>
                <td className="py-3">{Number(t.amount || 0).toLocaleString('fr-DZ')} دج</td>
                <td className="py-3">{t.method || '—'}</td>
                <td className="py-3">{t.merchant_name || '—'}</td>
                <td className="py-3">{t.customer_name || '—'}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    t.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    t.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {t.status === 'pending' ? 'قيد المعالجة (Pending)' : t.status || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-xs text-slate-400 mt-4">لا توجد نتائج</div>}
      </div>
    </div>
  )
}
