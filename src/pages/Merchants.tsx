import { useEffect, useMemo, useState } from 'react'
import { fetchUsers, updateUserStatus, addToBlacklist } from '../lib/data'
import { UserRecord } from '../lib/types'

type Props = {
  isAdmin?: boolean
}

export default function Merchants({ isAdmin = false }: Props) {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<UserRecord | null>(null)
  const [showActions, setShowActions] = useState(false)

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

  const handleFreeze = async () => {
    if (!selected) return
    await updateUserStatus(selected.id, 'frozen')
    setUsers((prev) => prev.map((u) => (u.id === selected.id ? { ...u, status: 'frozen' } : u)))
    setSelected({ ...selected, status: 'frozen' })
    setShowActions(false)
  }

  const handleBlacklist = async () => {
    if (!selected) return
    await addToBlacklist(selected.id)
    setUsers((prev) => prev.map((u) => (u.id === selected.id ? { ...u, status: 'blacklisted' } : u)))
    setSelected({ ...selected, status: 'blacklisted' })
    setShowActions(false)
  }

  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
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
                <th className="text-right py-2">الرصيد</th>
                <th className="text-right py-2">المستحق</th>
                <th className="text-right py-2">الحد</th>
                <th className="text-right py-2">الحالة</th>
                <th className="text-right py-2">وثائق</th>
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
                  <td className="py-3">{u.activity || '—'}</td>
                  <td className="py-3">{Number(u.balance || 0).toLocaleString('fr-DZ')} دج</td>
                  <td className="py-3">{Number(u.outstanding || 0).toLocaleString('fr-DZ')} دج</td>
                  <td className="py-3">{Number(u.credit_limit || 0).toLocaleString('fr-DZ')} دج</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      u.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      u.status === 'frozen' ? 'bg-blue-100 text-blue-700' :
                      u.status === 'blacklisted' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {u.status || '—'}
                    </span>
                  </td>
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

      {/* Account Details Panel */}
      <div className="nexus-card p-6 space-y-4">
        <div className="font-bold">تفاصيل الحساب</div>
        {selected ? (
          <div className="space-y-3 text-sm">
            <div className="font-semibold text-lg">{selected.name}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-slate-500">البريد:</div>
              <div>{selected.email || '—'}</div>
              <div className="text-slate-500">الهاتف:</div>
              <div>{selected.phone || '—'}</div>
              <div className="text-slate-500">النشاط:</div>
              <div>{selected.activity || '—'}</div>
              <div className="text-slate-500">الولاية:</div>
              <div>{selected.wilaya || '—'}</div>
              <div className="text-slate-500">الرصيد:</div>
              <div className="font-semibold">{Number(selected.balance || 0).toLocaleString('fr-DZ')} دج</div>
              <div className="text-slate-500">المستحق:</div>
              <div className="text-orange-600">{Number(selected.outstanding || 0).toLocaleString('fr-DZ')} دج</div>
              <div className="text-slate-500">الحد الائتماني:</div>
              <div>{Number(selected.credit_limit || 0).toLocaleString('fr-DZ')} دج</div>
              <div className="text-slate-500">الحالة:</div>
              <div>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  selected.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  selected.status === 'frozen' ? 'bg-blue-100 text-blue-700' :
                  selected.status === 'blacklisted' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {selected.status || '—'}
                </span>
              </div>
            </div>
            
            {/* Action Buttons - Only for Admin */}
            {isAdmin && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="font-semibold mb-2">إجراءات الحساب</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="flex-1 bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors"
                  >
                    إجراءات ▼
                  </button>
                </div>
                
                {showActions && (
                  <div className="space-y-2 mt-2">
                    {selected.status !== 'frozen' && selected.status !== 'blacklisted' && (
                      <button
                        onClick={handleFreeze}
                        className="w-full bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        ❄️ تجميد الحساب
                      </button>
                    )}
                    {selected.status !== 'blacklisted' && (
                      <button
                        onClick={handleBlacklist}
                        className="w-full bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        🛑 إضافة للقائمة السوداء
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Documents */}
            <div className="pt-3 border-t border-slate-100">
              <div className="font-semibold mb-2">الوثائق</div>
              <div className="flex flex-wrap gap-2">
                {selected.doc_id_front && <span className="nexus-pill bg-blue-100 text-blue-700">بطاقة الهوية</span>}
                {selected.doc_commercial_register && <span className="nexus-pill bg-purple-100 text-purple-700">السجل التجاري</span>}
                {selected.doc_rib && <span className="nexus-pill bg-green-100 text-green-700">RIB</span>}
                {!selected.doc_id_front && !selected.doc_commercial_register && !selected.doc_rib && (
                  <div className="text-xs text-slate-400">لا توجد وثائق</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">اختر تاجراً لعرض التفاصيل</div>
        )}
      </div>
    </div>
  )
}
