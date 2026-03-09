import { useEffect, useMemo, useState } from 'react'
import { fetchUsers } from '../lib/data'
import { UserRecord } from '../lib/types'

export default function Merchants() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchUsers().then((data) => {
      setUsers(data.filter((u) => u.role === 'merchant'))
    })
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

  return (
    <div className="nexus-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-bold">التجار / Marchands / Merchants</div>
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
              <th className="text-right py-2">النشاط</th>
              <th className="text-right py-2">الحالة</th>
              <th className="text-right py-2">وثائق</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-3">{u.name || '—'}</td>
                <td className="py-3">{u.phone || '—'}</td>
                <td className="py-3">{u.activity || '—'}</td>
                <td className="py-3">{u.status || '—'}</td>
                <td className="py-3">
                  <div className="flex gap-2 text-xs">
                    {u.doc_id_front && <span className="nexus-pill">ID</span>}
                    {u.doc_commercial_register && <span className="nexus-pill">CR</span>}
                    {u.doc_rib && <span className="nexus-pill">RIB</span>}
                  </div>
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
