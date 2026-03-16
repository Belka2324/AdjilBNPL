import { useEffect, useState } from 'react'
import { getSession } from '../lib/storage'
import { supabase, hasSupabase } from '../lib/supabase'
import { UserRecord, Role } from '../lib/types'
import { auditLog } from '../lib/data'

type Props = {
  // Get role from session - for now using a default
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'create'>('general')
  const [teamMembers, setTeamMembers] = useState<UserRecord[]>([])
  const [selectedMember, setSelectedMember] = useState<UserRecord | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Create form state
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'partner' | 'support'>('support')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  // Note: Client-side role check - in production, verify role on server
  // The isCEO flag is for UI display only; server should enforce authorization
  const session = getSession()
  const isCEO = session?.role === 'administrator' || session?.isCEO === true || session?.role === 'ceo'

  useEffect(() => {
    const fetchTeamData = async () => {
      if (hasSupabase && supabase) {
        // Fetch staff from staff table
        const { data: staffData } = await supabase
          .from('admin_users')
          .select('*')
          .in('role', ['administrator', 'partner', 'support', 'ceo'])
        
        // Also fetch admins from users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .in('role', ['admin', 'administrator'])
        
        // Combine both
        const allMembers = [
          ...(staffData || []).map(s => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            email: s.email,
            role: s.role,
            status: s.is_active ? 'active' : 'suspended'
          })),
          ...(userData || []).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status
          }))
        ]
        setTeamMembers(allMembers)
      }
    }
    
    if (activeTab === 'team') {
      fetchTeamData()
    }
  }, [activeTab])

  const handleCreateAccount = async () => {
    if (!newEmail || !newName || !newUsername) return
    setCreating(true)
    
    if (hasSupabase && supabase) {
      try {
        // Create auth user via Supabase Auth Admin API (server-side)
        // For client-side, we create a staff record and rely on auth
        const { data, error } = await supabase
          .from('admin_users')
          .insert({
            first_name: newName.split(' ')[0],
            last_name: newName.split(' ').slice(1).join(' ') || '',
            email: newEmail,
            role: newRole,
            is_active: true
          })
          .select()
        
        if (error) throw error
        
        // Clear form
        setNewEmail('')
        setNewPassword('')
        setNewUsername('')
        setNewName('')
        setNewRole('support')
        setShowCreateModal(false)
        
        // Refresh team list
        setSuccess('تم إنشاء حساب الفريق بنجاح')
        setError(null)
        const { data: staffData } = await supabase
          .from('admin_users')
          .select('*')
          .in('role', ['administrator', 'partner', 'support', 'ceo'])
        
        setTeamMembers((staffData || []).map(s => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          email: s.email,
          role: s.role,
          status: s.is_active ? 'active' : 'suspended'
        })))
      } catch (err) {
        console.error('Error creating team member:', err)
        setError('فشل في إنشاء حساب الفريق. يرجى المحاولة مرة أخرى.')
        setSuccess(null)
      }
    }
    setCreating(false)
  }

  const handleSuspend = async () => {
    if (!selectedMember) return
    
    if (hasSupabase && supabase) {
      // Try to update staff table first, then users table
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: selectedMember.status === 'suspended' })
        .eq('id', selectedMember.id)
      
      if (error) {
        // Try users table
        const { error: userError } = await supabase
          .from('users')
          .update({ status: selectedMember.status === 'suspended' ? 'active' : 'suspended' })
          .eq('id', selectedMember.id)
        
        if (userError) {
          setError('فشل في تحديث حالة الحساب. يرجى المحاولة مرة أخرى.')
          return
        }
      }
      
      // Log the action for audit
      const action = selectedMember.status === 'suspended' ? 'reactivate' : 'suspend'
      await auditLog('staff', selectedMember.id, action, { reason: `${action} staff member` })
    }
    
    // Update local state
    setTeamMembers((prev) => prev.map((u) => 
      u.id === selectedMember.id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u
    ))
    setShowSuspendModal(false)
    setSelectedMember(null)
    setSuccess(selectedMember.status === 'suspended' ? 'تم تفعيل الحساب بنجاح' : 'تم إيقاف الحساب بنجاح')
    setError(null)
  }

  const handleDelete = async () => {
    if (!selectedMember) return
    
    if (hasSupabase && supabase) {
      // Try to delete from staff table first, then users table
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', selectedMember.id)
      
      if (error) {
        const { error: userError } = await supabase
          .from('users')
          .delete()
          .eq('id', selectedMember.id)
        
        if (userError) {
          setError('فشل في حذف الحساب. يرجى المحاولة مرة أخرى.')
          return
        }
      }
      
      // Log the action for audit
      await auditLog('staff', selectedMember.id, 'delete', { reason: 'delete staff member' })
    }
    
    // Update local state
    setTeamMembers((prev) => prev.filter((u) => u.id !== selectedMember.id))
    setShowDeleteModal(false)
    setSelectedMember(null)
    setSuccess('تم حذف الحساب بنجاح')
    setError(null)
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'مدير / Admin'
      case 'partner': return 'شريك / Partner'
      case 'support': return 'دعم / Support'
      default: return role || '—'
    }
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}
      {/* Tabs */}
      <div className="nexus-card p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'general' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          الإعدادات العامة
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'team' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          فريق العمل
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'create' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          إنشاء حساب جديد
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="nexus-card p-6 space-y-4">
          <div className="font-bold">الإعدادات العامة / Paramètres / Settings</div>
          <div className="text-sm text-slate-500">
            إدارة مفاتيح الربط، صلاحيات المستخدمين، وسياسات الأمان حسب متطلبات المنصة.
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-xs text-slate-400">سياسة الوصول</div>
              <div className="font-semibold">Role-Based Access Control</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-xs text-slate-400">المزامنة</div>
              <div className="font-semibold">Supabase / Local</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-xs text-slate-400">نظام الفوترة</div>
              <div className="font-semibold">مفوتر / BNPL</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-xs text-slate-400">حالة النظام</div>
              <div className="font-semibold text-emerald-600">نشط</div>
            </div>
          </div>
        </div>
      )}

      {/* Team Management - Only for CEO */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {isCEO ? (
            <>
              <div className="nexus-card p-6 space-y-4">
                <div className="font-bold">فريق العمل / Équipe / Team</div>
                <div className="text-sm text-slate-500">
                  إدارة حسابات فريق العمل (الCEO يستطيع إيقاف وتفعيل وحذف الحسابات)
                </div>
              </div>

              {/* Team Tables */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Admins */}
                <div className="nexus-card p-4 space-y-3">
                  <div className="font-semibold text-slate-700 border-b pb-2">
                    👑 المديرين / Admins
                  </div>
                  {teamMembers.filter(u => u.role === 'admin').map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between bg-slate-50 rounded-xl p-3"
                    >
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          member.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          member.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100'
                        }`}>
                          {member.status}
                        </span>
                        {member.status === 'suspended' ? (
                          <button 
                            onClick={() => { setSelectedMember(member); setShowSuspendModal(true) }}
                            className="text-xs bg-emerald-600 text-white px-2 py-1 rounded"
                          >
                            تفعيل
                          </button>
                        ) : (
                          <button 
                            onClick={() => { setSelectedMember(member); setShowSuspendModal(true) }}
                            className="text-xs bg-orange-500 text-white px-2 py-1 rounded"
                          >
                            وقف
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedMember(member); setShowDeleteModal(true) }}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                          title="حذف الحساب"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  {teamMembers.filter(u => u.role === 'admin').length === 0 && (
                    <div className="text-xs text-slate-400">لا يوجد مديرين</div>
                  )}
                </div>

                {/* Partners */}
                <div className="nexus-card p-4 space-y-3">
                  <div className="font-semibold text-slate-700 border-b pb-2">
                    🤝 الشركاء / Partners
                  </div>
                  {teamMembers.filter(u => u.role === 'partner').map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between bg-slate-50 rounded-xl p-3"
                    >
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          member.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          member.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100'
                        }`}>
                          {member.status}
                        </span>
                        {member.status === 'suspended' ? (
                          <button 
                            onClick={() => { setSelectedMember(member); setShowSuspendModal(true) }}
                            className="text-xs bg-emerald-600 text-white px-2 py-1 rounded"
                          >
                            تفعيل
                          </button>
                        ) : (
                          <button 
                            onClick={() => { setSelectedMember(member); setShowSuspendModal(true) }}
                            className="text-xs bg-orange-500 text-white px-2 py-1 rounded"
                          >
                            وقف
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedMember(member); setShowDeleteModal(true) }}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                          title="حذف الحساب"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  {teamMembers.filter(u => u.role === 'partner').length === 0 && (
                    <div className="text-xs text-slate-400">لا يوجد شركاء</div>
                  )}
                </div>

                {/* Support */}
                <div className="nexus-card p-4 space-y-3">
                  <div className="font-semibold text-slate-700 border-b pb-2">
                    🎧 الدعم / Support
                  </div>
                  {teamMembers.filter(u => u.role === 'support').map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between bg-slate-50 rounded-xl p-3"
                    >
                      <div>
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          member.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          member.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100'
                        }`}>
                          {member.status}
                        </span>
                        {member.status === 'suspended' ? (
                          <button 
                            onClick={() => { setSelectedMember(member); setShowSuspendModal(true) }}
                            className="text-xs bg-emerald-600 text-white px-2 py-1 rounded"
                          >
                            تفعيل
                          </button>
                        ) : (
                          <button 
                            onClick={() => { setSelectedMember(member); setShowSuspendModal(true) }}
                            className="text-xs bg-orange-500 text-white px-2 py-1 rounded"
                          >
                            وقف
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedMember(member); setShowDeleteModal(true) }}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                          title="حذف الحساب"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  {teamMembers.filter(u => u.role === 'support').length === 0 && (
                    <div className="text-xs text-slate-400">لا يوجد فريق دعم</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="nexus-card p-6">
              <div className="text-center text-slate-500">
                لا يمكنك الوصول إلى هذه الصفحة. يتطلب صلاحيات CEO.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create New Account */}
      {activeTab === 'create' && (
        <div className="nexus-card p-6 space-y-6">
          <div className="font-bold">إنشاء حساب جديد / Créer un compte / Create Account</div>
          <div className="text-sm text-slate-500">
            أنشئ حساب جديد لفريق العمل مع تحديد صلاحياته ومسؤولياته.
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم / Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="الاسم الكامل"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم المستخدم / Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">البريد الإلكتروني / Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور / Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="********"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الدور / Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'partner' | 'support')}
                className="w-full bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="support">دعم فني / Support</option>
                <option value="partner">شريك / Partner</option>
                <option value="admin">مدير / Admin</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCreateAccount}
            disabled={creating || !newEmail || !newPassword || !newName}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'جاري الإنشاء...' : 'إنشاء الحساب / Créer'}
          </button>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c0 2.502-1.667 1.1.54 732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="font-bold text-lg">
                {selectedMember.status === 'suspended' ? 'تفعيل الحساب' : 'إيقاف الحساب'}
              </div>
              <div className="text-sm text-slate-500">
                هل أنت متأكد من {selectedMember.status === 'suspended' ? 'تفعيل' : 'إيقاف'} حساب 
                <span className="font-semibold"> {selectedMember.name}</span>؟
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowSuspendModal(false); setSelectedMember(null) }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSuspend}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600"
                >
                  {selectedMember.status === 'suspended' ? 'تفعيل' : 'إيقاف'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="font-bold text-lg">حذف الحساب</div>
              <div className="text-sm text-slate-500">
                هل أنت متأكد من حذف حساب <span className="font-semibold">{selectedMember.name}</span>؟
                <br />
                <span className="text-red-500">هذا الإجراء لا يمكن التراجع عنه!</span>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedMember(null) }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
