import { useEffect, useState } from 'react'
import { fetchUsers } from '../lib/data'
import { UserRecord } from '../lib/types'

export default function Frozen() {
  const [items, setItems] = useState<UserRecord[]>([])

  useEffect(() => {
    fetchUsers().then((data) => {
      setItems(data.filter((u) => ['suspended', 'frozen', 'inactive'].includes(String(u.status || '').toLowerCase())))
    })
  }, [])

  return (
    <div className="nexus-card p-6 space-y-4">
      <div className="font-bold">حسابات مجمدة / Comptes gelés / Frozen</div>
      {items.length === 0 && <div className="text-xs text-slate-400">لا توجد حسابات مجمدة</div>}
      {items.map((u) => (
        <div key={u.id} className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
          <div>{u.name || '—'}</div>
          <div>{u.email || '—'}</div>
          <div>{u.role || '—'}</div>
        </div>
      ))}
    </div>
  )
}
