import { useEffect, useMemo, useState } from 'react'
import { fetchTransactions } from '../lib/data'
import { TransactionRecord } from '../lib/types'

const toCsv = (rows: TransactionRecord[]) => {
  const header = ['id', 'amount', 'method', 'status', 'created_at', 'merchant_name', 'customer_name']
  const lines = rows.map((r) => [
    r.id,
    r.amount ?? '',
    r.method ?? '',
    r.status ?? '',
    r.created_at ?? '',
    r.merchant_name ?? '',
    r.customer_name ?? ''
  ])
  return [header.join(','), ...lines.map((l) => l.join(','))].join('\n')
}

export default function Invoices() {
  const [items, setItems] = useState<TransactionRecord[]>([])

  useEffect(() => {
    fetchTransactions().then(setItems)
  }, [])

  const total = useMemo(
    () => items.reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [items]
  )

  const handleExport = () => {
    const blob = new Blob([toCsv(items)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'adjil_invoices.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="nexus-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-bold">إدارة الفواتير / Factures / Invoices</div>
        <button onClick={handleExport} className="bg-nexus-accent text-white px-4 py-2 rounded-xl text-sm">
          تصدير CSV
        </button>
      </div>
      <div className="text-sm text-slate-500">إجمالي المبالغ: {total.toLocaleString('fr-DZ')} دج</div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="text-right py-2">المعرف</th>
              <th className="text-right py-2">المبلغ</th>
              <th className="text-right py-2">الطريقة</th>
              <th className="text-right py-2">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="py-3">{t.id}</td>
                <td className="py-3">{Number(t.amount || 0).toLocaleString('fr-DZ')} دج</td>
                <td className="py-3">{t.method || '—'}</td>
                <td className="py-3">{t.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="text-xs text-slate-400 mt-4">لا توجد بيانات</div>}
      </div>
    </div>
  )
}
