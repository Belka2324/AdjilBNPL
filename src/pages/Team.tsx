import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StaffRecord, StaffRole } from '../lib/types'
import { fetchStaff, INSTITUTIONS } from '../lib/data'

const ROLE_LABELS: Record<StaffRole, { ar: string; en: string; fr: string }> = {
  ceo: { ar: 'الرئيس التنفيذي', en: 'CEO', fr: 'PDG' },
  administrator: { ar: 'مدير النظام', en: 'Administrator', fr: 'Administrateur' },
  partner: { ar: 'شريك', en: 'Partner', fr: 'Partenaire' },
  support: { ar: 'الدعم الفني', en: 'Support', fr: 'Support' }
}

export default function Team() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all')
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const loadStaff = async () => {
      setLoading(true)
      const data = await fetchStaff()
      setStaff(data)
      setLoading(false)
    }
    loadStaff()
  }, [])

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    
    // In a real app, we would call createStaff here
    setShowAddModal(false)
    const data = await fetchStaff()
    setStaff(data)
    setLoading(false)
  }

  const filteredStaff = staff.filter(s => {
    const matchesSearch =
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm)
    const matchesRole = roleFilter === 'all' || s.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleStaffClick = (staffId: string) => {
    navigate(`/staff/${staffId}`)
  }

  const getRoleBadge = (role: StaffRole) => {
    const colors: Record<StaffRole, string> = {
      ceo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      administrator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      partner: 'bg-green-500/20 text-green-400 border-green-500/30',
      support: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[role]}`}>
        {ROLE_LABELS[role].ar}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">فريق العمل</h1>
          <p className="text-slate-500 text-sm">Team Members / Équipe</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-nexus-accent text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          إضافة عضو جديد
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="البحث بالاسم أو اسم المستخدم أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl pr-10 py-2.5 px-4 outline-none focus:ring-2 focus:ring-nexus-gold/50 text-sm text-slate-800"
            />
          </div>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as StaffRole | 'all')}
          className="bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-nexus-gold/50 text-sm min-w-[180px] text-slate-800"
        >
          <option value="all">جميع الأدوار / All Roles</option>
          <option value="ceo">الرئيس التنفيذي / CEO</option>
          <option value="administrator">مدير النظام / Admin</option>
          <option value="partner">شريك / Partner</option>
          <option value="support">الدعم الفني / Support</option>
        </select>
      </div>

      {/* Table */}
      <div className="nexus-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexus-gold"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-right text-xs font-bold text-slate-500 p-4">الاسم</th>
                  <th className="text-right text-xs font-bold text-slate-500 p-4">اسم المستخدم</th>
                  <th className="text-right text-xs font-bold text-slate-500 p-4">الهاتف</th>
                  <th className="text-right text-xs font-bold text-slate-500 p-4">المنصب</th>
                  <th className="text-right text-xs font-bold text-slate-500 p-4">المؤسسة</th>
                  <th className="text-right text-xs font-bold text-slate-500 p-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStaff.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => handleStaffClick(member.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-slate-800"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-nexus-gold/20 flex items-center justify-center text-nexus-gold text-xs font-black">
                          {member.first_name[0]}{member.last_name[0]}
                        </div>
                        <div className="font-bold text-sm">{member.first_name} {member.last_name}</div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-black text-nexus-gold">{member.username || member.email.split('@')[0]}</td>
                    <td className="p-4 text-sm text-slate-500">{member.phone}</td>
                    <td className="p-4">{getRoleBadge(member.role)}</td>
                    <td className="p-4 text-xs font-bold text-slate-400">
                      {member.institution || 'Adjil HQ'}
                    </td>
                    <td className="p-4">
                      <span className={`w-2 h-2 inline-block rounded-full ${member.is_active ? 'bg-emerald-400 shadow-lg shadow-emerald-400/20' : 'bg-rose-400'}`}></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">إضافة عضو جديد للفريق</h3>
                <p className="text-xs text-slate-400">Create new staff account</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الاسم / First Name</label>
                  <input name="first_name" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-nexus-gold/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">اللقب / Last Name</label>
                  <input name="last_name" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-nexus-gold/50" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">اسم المستخدم / Username (للدخول)</label>
                <input name="username" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-nexus-gold/50" placeholder="admin" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">البريد الإلكتروني / Email</label>
                <input name="email" type="email" required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-nexus-gold/50" placeholder="admin@adjil.dz" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الرتبة / Role</label>
                  <select name="role" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-nexus-gold/50">
                    <option value="administrator">Administrator</option>
                    <option value="partner">Partner</option>
                    <option value="support">Support</option>
                    <option value="ceo">CEO</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">المؤسسة / Institution</label>
                  <input name="institution" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-nexus-gold/50" placeholder="Adjil HQ" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all active:scale-[0.98]">
                  إنشاء الحساب وتفعيل الصلاحيات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
