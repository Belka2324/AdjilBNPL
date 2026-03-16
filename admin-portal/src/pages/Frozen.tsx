import { useEffect, useState } from 'react'
import { fetchUsers, updateUserStatus, removeFromBlacklist, moveFromBlacklistToFrozen, auditLog } from '../lib/data'
import { UserRecord } from '../lib/types'

type Props = {
  isAdmin?: boolean
}

export default function Frozen({ isAdmin = false }: Props) {
  const [items, setItems] = useState<UserRecord[]>([])
  const [selected, setSelected] = useState<UserRecord | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false)
  const [showBlacklistConfirm, setShowBlacklistConfirm] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers().then((data) => {
      // Filter only customers/merchants (not team members) with frozen/suspended/inactive/pending status
      const frozenAccounts = data.filter((u) => 
        !['admin', 'partner', 'support', 'administrator'].includes(String(u.role || '').toLowerCase()) &&
        ['suspended', 'frozen', 'inactive', 'pending', 'pending_verification'].includes(String(u.status || '').toLowerCase())
      )
      setItems(frozenAccounts)
    })
  }, [])

  const handleUnfreeze = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      await updateUserStatus(selected.id, 'active')
      await auditLog('user', selected.id, 'unfreeze', { reason: 'unfreeze account' })
      setItems((prev) => prev.filter((u) => u.id !== selected.id))
      setSelected(null)
      setShowConfirm(false)
      setSuccess('تم رفع تجميد الحساب بنجاح')
    } catch (error) {
      console.error('Failed to unfreeze account:', error)
      setError('فشل في رفع تجميد الحساب. يرجى المحاولة مرة أخرى.')
    }
    setLoading(false)
  }

  const handleRemoveFromBlacklist = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      await removeFromBlacklist(selected.id)
      await auditLog('user', selected.id, 'unblacklist', { reason: 'remove from blacklist' })
      setItems((prev) => prev.filter((u) => u.id !== selected.id))
      setSelected(null)
      setShowBlacklistConfirm(false)
      setSuccess('تم سحب الحساب من القائمة السوداء بنجاح')
    } catch (error) {
      console.error('Failed to remove from blacklist:', error)
      setError('فشل في سحب الحساب من القائمة السوداء. يرجى المحاولة مرة أخرى.')
    }
    setLoading(false)
  }

  const handleFreeze = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      await moveFromBlacklistToFrozen(selected.id, 'frozen by admin')
      await auditLog('user', selected.id, 'freeze', { reason: 'freeze account' })
      setItems((prev) => prev.filter((u) => u.id !== selected.id))
      setSelected(null)
      setShowFreezeConfirm(false)
      setSuccess('تم تجميد الحساب بنجاح')
    } catch (error) {
      console.error('Failed to freeze account:', error)
      setError('فشل في تجميد الحساب. يرجى المحاولة مرة أخرى.')
    }
    setLoading(false)
  }

  const handleVerifyAndActivate = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      await updateUserStatus(selected.id, 'active')
      await auditLog('user', selected.id, 'activate', { reason: 'verify and activate account' })
      setItems((prev) => prev.filter((u) => u.id !== selected.id))
      setSelected(null)
      setShowConfirm(false)
      setSuccess('تم تفعيل الحساب بنجاح')
    } catch (error) {
      console.error('Failed to activate account:', error)
      setError('فشل في تفعيل الحساب. يرجى المحاولة مرة أخرى.')
    }
    setLoading(false)
  }

  const getDocuments = (user: UserRecord) => {
    const docs = []
    if (user.doc_id_front) docs.push({ key: 'doc_id_front', label: 'بطاقة الهوية (أمام)', url: user.doc_id_front })
    if (user.doc_id_back) docs.push({ key: 'doc_id_back', label: 'بطاقة الهوية (خلف)', url: user.doc_id_back })
    if (user.doc_payslip) docs.push({ key: 'doc_payslip', label: 'كشف الراتب', url: user.doc_payslip })
    if (user.doc_rib) docs.push({ key: 'doc_rib', label: 'RIB', url: user.doc_rib })
    if (user.doc_commercial_register) docs.push({ key: 'doc_commercial_register', label: 'السجل التجاري', url: user.doc_commercial_register })
    if (user.doc_contract) docs.push({ key: 'doc_contract', label: 'العقد', url: user.doc_contract })
    return docs
  }

  return (
    <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="fixed top-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}
      <div className="nexus-card p-6 space-y-4">
        <div className="font-bold">حسابات معلقة / Comptes en attente / Pending</div>
        {items.length === 0 && <div className="text-xs text-slate-400">لا توجد حسابات معلقة</div>}
        {items.map((u) => (
          <div 
            key={u.id} 
            className={`flex items-center justify-between border-t border-slate-100 pt-3 text-sm cursor-pointer hover:bg-slate-50 ${selected?.id === u.id ? 'bg-blue-50' : ''}`}
            onClick={() => setSelected(u)}
          >
            <div>{u.name || '—'}</div>
            <div>{u.email || '—'}</div>
            <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">{u.status}</div>
          </div>
        ))}
      </div>

      <div className="nexus-card p-6 space-y-4">
        <div className="font-bold">تفاصيل الحساب المجمّد</div>
        {selected ? (
          <div className="space-y-3 text-sm">
            <div className="font-semibold">{selected.name}</div>
            <div>البريد: {selected.email || '—'}</div>
            <div>الهاتف: {selected.phone || '—'}</div>
            <div>الولاية: {selected.wilaya || '—'}</div>
            <div>سبب التجميد: {selected.status}</div>
            
            {/* Documents Section for Pending Verification Users */}
            {['pending', 'pending_verification'].includes(String(selected.status || '').toLowerCase()) && (
              <div className="pt-3 border-t border-slate-100">
                <div className="font-semibold mb-2">📄 الوثائق المقدمة:</div>
                {getDocuments(selected).length > 0 ? (
                  <div className="space-y-2">
                    {getDocuments(selected).map((doc) => (
                      <button
                        key={doc.key}
                        onClick={() => { setSelectedDoc(doc.url); setShowDocModal(true) }}
                        className="w-full bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                      >
                        <i className="fa-solid fa-file-image"></i>
                        {doc.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">لم يتم رفع وثائق بعد</div>
                )}
              </div>
            )}
            
            <div className="pt-3 border-t border-slate-100">
              {isAdmin ? (
                <>
                  {selected.status === 'blacklisted' ? (
                    <button
                      onClick={() => setShowBlacklistConfirm(true)}
                      className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      ✅ سحب من القائمة السوداء
                    </button>
                  ) : ['pending', 'pending_verification'].includes(String(selected.status || '').toLowerCase()) ? (
                    <>
                      <button
                        onClick={() => setShowConfirm(true)}
                        className="w-full bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        ✅ التحقق وتفعيل الحساب
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                      رفع التجميد / Débloquer
                    </button>
                  )}
                  {/* Freeze Account Button */}
                  <button
                    onClick={() => setShowFreezeConfirm(true)}
                    className="w-full mt-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    ⏸️ تجميد الحساب
                  </button>
                </>
              ) : (
                <div className="text-xs text-slate-500 text-center">
                  لا توجد إجراءات متاحة لك
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">اختر حساباً لعرض التفاصيل</div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (['pending', 'pending_verification'].includes(String(selected?.status || '').toLowerCase()) ? (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="font-bold text-lg">تأكيد التحقق من الوثائق وتفعيل الحساب</div>
              <div className="text-sm text-slate-500">
                هل أنت متأكد من صحة الوثائق المقدمة وتفعيل حساب <span className="font-semibold">{selected?.name}</span>؟
                <br />
                سيتم تحويل الحساب إلى حالة "نشط" ويمكنه استخدام المنصة.
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleVerifyAndActivate}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري...' : 'تأكيد التفعيل'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="font-bold text-lg">تأكيد رفع التجميد</div>
              <div className="text-sm text-slate-500">
                هل أنت متأكد من رفع تجميد حساب <span className="font-semibold">{selected?.name}</span>؟
                <br />
                سيتم تحويل الحساب إلى حالة "نشط" ويمكنه استخدام المنصة مرة أخرى.
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleUnfreeze}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري...' : 'تأكيد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Remove from Blacklist Confirmation Modal */}
      {showBlacklistConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="font-bold text-lg">السحب من القائمة السوداء</div>
              <div className="text-sm text-slate-500">
                هل أنت متأكد من سحب حساب <span className="font-semibold">{selected?.name}</span> من القائمة السوداء؟
                <br />
                سيتمكن الحساب من استخدام المنصة مرة أخرى.
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBlacklistConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleRemoveFromBlacklist}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري...' : 'تأكيد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Freeze Account Confirmation Modal */}
      {showFreezeConfirm && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="font-bold text-lg">تأكيد تجميد الحساب</div>
              <div className="text-sm text-slate-500">
                هل أنت متأكد من تجميد حساب <span className="font-semibold">{selected.name}</span>؟
                <br />
                سيتم تحويل الحساب إلى حالة "مجمّد" ولن يستطيع استخدام المنصة.
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowFreezeConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleFreeze}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'جاري...' : 'تأكيد التجميد'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6" onClick={() => setShowDocModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-lg">عرض الوثيقة</div>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-100">
              <img src={selectedDoc} alt="Document" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
