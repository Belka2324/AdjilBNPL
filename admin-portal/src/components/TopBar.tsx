import { Search, Bell, LogOut, X, User, Settings, Key, Camera, Loader2, Globe } from 'lucide-react'
import { Role } from '../lib/types'
import { useState, useEffect, useRef } from 'react'
import { Language, getStoredLanguage, setLanguage, getLanguageName } from '../lib/i18n'
import { supabase, hasSupabase } from '../lib/supabase'

type Props = {
  role: Role
  username: string
  onLogout: () => void
  isCEO?: boolean
}

type Notification = {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  created_at: string
  read: boolean
}

type ProfileData = {
  name: string
  email: string
  phone: string
  avatar?: string
}

export default function TopBar({ role, username, onLogout, isCEO }: Props) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [profileData, setProfileData] = useState<ProfileData>({
    name: username,
    email: '',
    phone: '',
    avatar: ''
  })
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentLang, setCurrentLang] = useState<Language>(getStoredLanguage())
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    setCurrentLang(lang)
    setShowLangMenu(false)
    // Reload to apply new direction
    window.location.reload()
  }

  // Load profile data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('adjil_admin_profile')
    if (stored) {
      setProfileData(JSON.parse(stored))
    } else {
      // Initialize with current username
      setProfileData(prev => ({ ...prev, name: username }))
    }
  }, [username])

  // Load notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('adjil_notifications')
    if (stored) {
      setNotifications(JSON.parse(stored))
    } else {
      // Default notifications
      const defaultNotifs: Notification[] = [
        {
          id: '1',
          title: 'مرحباً بك',
          message: 'مرحباً في لوحة تحكم Adjil.BNPL',
          type: 'info',
          created_at: new Date().toISOString(),
          read: false
        }
      ]
      setNotifications(defaultNotifs)
      localStorage.setItem('adjil_notifications', JSON.stringify(defaultNotifs))
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const roleLabel =
    role === 'ceo'
      ? 'CEO ADMIN'
      : role === 'administrator'
      ? 'ADMINISTRATOR'
      : role === 'partner'
      ? 'PARTNER'
      : 'SUPPORT'

  const roleColor = 
    role === 'ceo' || (role === 'administrator' && isCEO)
      ? 'bg-red-100 text-red-700 border-red-200' :
    role === 'administrator' 
      ? 'bg-purple-100 text-purple-700 border-purple-200' :
    role === 'partner' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    'bg-blue-100 text-blue-700 border-blue-200'

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifications(updated)
    localStorage.setItem('adjil_notifications', JSON.stringify(updated))
  }

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    localStorage.setItem('adjil_notifications', JSON.stringify(updated))
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    return `منذ ${diffDays} يوم`
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return 'ℹ️'
    }
  }

  const handleProfileClick = () => {
    setShowUserMenu(false)
    setShowProfileModal(true)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setProfileData(prev => ({ ...prev, avatar: base64 }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = () => {
    setSaving(true)
    // Save to localStorage
    localStorage.setItem('adjil_admin_profile', JSON.stringify(profileData))
    
    // Add notification
    const existing = JSON.parse(localStorage.getItem('adjil_notifications') || '[]')
    const newNotif = {
      id: crypto.randomUUID(),
      title: '✅ تم تحديث الملف الشخصي',
      message: 'تم حفظ التغييرات بنجاح',
      type: 'success' as const,
      created_at: new Date().toISOString(),
      read: false
    }
    localStorage.setItem('adjil_notifications', JSON.stringify([newNotif, ...existing]))
    
    setTimeout(() => {
      setSaving(false)
      setShowProfileModal(false)
      // Refresh page to show changes
      window.location.reload()
    }, 500)
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSuccess(false)
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('الرجاء ملء جميع الحقول')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    
    setChangingPassword(true)
    
    try {
      if (hasSupabase && supabase) {
        // Verify current password by attempting to sign in
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: profileData.email || `${username}@adjil.dz`,
          password: currentPassword
        })
        
        if (verifyError) {
          setPasswordError('كلمة المرور الحالية غير صحيحة')
          setChangingPassword(false)
          return
        }
        
        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        })
        
        if (updateError) {
          setPasswordError('فشل في تغيير كلمة المرور: ' + updateError.message)
        } else {
          setPasswordSuccess(true)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setTimeout(() => {
            setShowPasswordModal(false)
            setPasswordSuccess(false)
          }, 2000)
        }
      } else {
        // Demo mode - just show success
        setPasswordSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          setShowPasswordModal(false)
          setPasswordSuccess(false)
        }, 2000)
      }
    } catch (err) {
      setPasswordError('حدث خطأ غير متوقع')
    }
    
    setChangingPassword(false)
  }

  return (
    <>
      <header className="flex items-center justify-between gap-6 mb-8">
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-12 py-3.5 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              placeholder="Search transactions, users, or tickets..."
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border ${roleColor}`}>
            {roleLabel}
          </span>
          
          {/* Notifications Button */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="font-bold">الإشعارات</div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      تحديد كمقروء
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">
                      لا توجد إشعارات
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{getNotificationIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm">{notif.title}</div>
                            <div className="text-xs text-slate-500 mt-1">{notif.message}</div>
                            <div className="text-xs text-slate-400 mt-2">{formatTime(notif.created_at)}</div>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <button className="w-full text-center text-sm text-blue-600 hover:underline">
                    عرض كل الإشعارات
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-1.5 pr-4 pl-1.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow relative">
            {/* Profile Avatar - Clickable for upload */}
            <div className="relative">
              <div 
                className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30 cursor-pointer overflow-hidden"
                onClick={handleProfileClick}
              >
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  username.slice(0, 1).toUpperCase()
                )}
              </div>
              <div 
                onClick={handleAvatarClick}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-md"
                title="تغيير الصورة"
              >
                <Camera size={10} className="text-white" />
              </div>
            </div>
            
            <div className="text-sm">
              <div className="font-bold text-slate-800">{username}</div>
              <div className="text-xs text-slate-400 font-medium">Adjil.BNPL</div>
            </div>
            <div className="w-px h-8 bg-slate-100 mx-2"></div>
            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                title="Language"
              >
                <Globe size={18} />
              </button>
              {showLangMenu && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
                  <button 
                    onClick={() => handleLanguageChange('ar')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors ${currentLang === 'ar' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'}`}
                  >
                    🇩🇿 العربية
                  </button>
                  <button 
                    onClick={() => handleLanguageChange('fr')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors ${currentLang === 'fr' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'}`}
                  >
                    🇫🇷 Français
                  </button>
                  <button 
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors ${currentLang === 'en' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'}`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              )}
            </div>
            
            <button 
              onClick={onLogout} 
              className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            
            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="font-bold text-slate-800">{username}</div>
                  <div className="text-xs text-slate-500">{roleLabel}</div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <User size={18} />
                    <span>ملف التعريف / Profile</span>
                  </button>
                  <button 
                    onClick={() => { setShowUserMenu(false); setShowPasswordModal(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Key size={18} />
                    <span>تغيير كلمة المرور / Password</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <Settings size={18} />
                    <span>إعدادات الحساب / Settings</span>
                  </button>
                </div>
                <div className="p-2 border-t border-slate-100">
                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>تسجيل الخروج / Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input for avatar upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Click outside to close notifications */}
        {(showNotifications || showUserMenu) && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => { setShowNotifications(false); setShowUserMenu(false) }}
          />
        )}
      </header>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="font-bold text-lg text-slate-800">ملف التعريف / Profile</div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-blue-500/30 overflow-hidden">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      username.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <button
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <Camera size={14} className="text-white" />
                  </button>
                </div>
                <div className="text-sm text-slate-500">انقر لتغيير الصورة الشخصية</div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الاسم / Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني / Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">رقم الهاتف / Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور / Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value="••••••••"
                      disabled
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="px-4 py-3 bg-slate-100 rounded-xl text-sm text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      تغيير
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  'حفظ التغييرات'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="font-bold text-lg text-slate-800">تغيير كلمة المرور / Change Password</div>
              <button 
                onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordSuccess(false); }}
                className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {passwordSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key size={32} className="text-green-600" />
                  </div>
                  <div className="font-bold text-lg text-green-600">تم تغيير كلمة المرور بنجاح</div>
                  <div className="text-sm text-slate-500 mt-2">تم تحديث كلمة المرور الخاصة بك</div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور الحالية / Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور الجديدة / New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">تأكيد كلمة المرور / Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  {passwordError && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                      {passwordError}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!passwordSuccess && (
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => { setShowPasswordModal(false); setPasswordError(''); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      جاري التغيير...
                    </>
                  ) : (
                    'تغيير كلمة المرور'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
