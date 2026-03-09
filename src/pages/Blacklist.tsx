import { useEffect, useState } from 'react'
import { fetchUsers } from '../lib/data'
import { UserRecord } from '../lib/types'

export default function Blacklist() {
  const [items, setItems] = useState<UserRecord[]>([])

  useEffect(() => {
    fetchUsers().then((data) => {
      setItems(data.filter((u) => ['blacklist', 'blacklisted'].includes(String(u.status || '').toLowerCase())))
    })
  }, [])

  return (
    <div className="nexus-card p-6 space-y-4">
      <div className="font-bold">القائمة السوداء / Blacklist</div>
      {items.length === 0 && <div className="text-xs text-slate-400">لا توجد حسابات في القائمة السوداء</div>}
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
