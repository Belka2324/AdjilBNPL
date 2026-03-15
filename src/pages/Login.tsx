import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { getStoredRole, saveSession, getSession } from '../lib/storage'
import { Role } from '../lib/types'
import { supabase, hasSupabase } from '../lib/supabase'

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(1, 'Password is required')
})

export default function Login({ isAdminPortal }: { isAdminPortal?: boolean }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const session = getSession()
    if (session) {
      handleRoleRedirection(session.role)
    }
  }, [navigate])

  const handleRoleRedirection = (role: Role) => {
    if (role === 'ceo' || role === 'administrator' || role === 'admin') {
      navigate('/dashboard')
    } else if (role === 'partner') {
      navigate('/dashboard')
    } else if (role === 'support') {
      navigate('/dashboard/complaints')
    } else {
      navigate('/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const form = new FormData(e.currentTarget)
    const data = { 
      username: String(form.get('username') || ''), 
      password: String(form.get('password') || '') 
    }
    
    const valid = schema.safeParse(data)
    if (!valid.success) {
      setError(valid.error.errors[0]?.message || 'الرجاء إدخال اسم المستخدم وكلمة المرور')
      setIsLoading(false)
      return
    }
    
    if (hasSupabase && supabase) {
      // 1. Authenticate with username and password
      const { data: syncData, error: syncError } = await supabase
        .from('admin_user_sync')
        .select('*')
        .eq('username', data.username)
        .eq('password', data.password)
        .eq('is_active', true)
        .single()
      
      if (syncError || !syncData) {
        // Fallback: Check for local admin/admin authentication
        if (data.username === 'admin' && data.password === 'admin') {
          saveSession({ 
            username: 'admin',
            role: 'ceo' as Role, 
            remember, 
            isCEO: true 
          })
          handleRoleRedirection('ceo' as Role)
          setIsLoading(false)
          return
        }
        
        setError('خطأ في اسم المستخدم أو كلمة المرور')
        setIsLoading(false)
        return
      }

      // 2. Map role and CEO status
      const role = syncData.role as Role
      const isCEO = role === 'ceo' || role === 'administrator'
      
      saveSession({ 
        username: syncData.username,
        role, 
        remember, 
        isCEO 
      })
      
      handleRoleRedirection(role)
    } else {
      setError('إعدادات Supabase مفقودة')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nexus-bg px-6 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nexus-accent to-transparent opacity-20"></div>

      <div className="max-w-md w-full space-y-8 z-10 transition-all duration-500">
        <div className="text-center space-y-4">
          <img src="/assets/Logo%20AD.png" className="h-20 mx-auto transition-all duration-700 transform hover:scale-105" alt="Logo" />
          <div className="text-center space-y-2 mb-10">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {isAdminPortal ? 'بوابة المسؤولين / Admin' : 'تسجيل الدخول'}
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              {isAdminPortal ? 'الوصول المباشر للوحة التحكم الرقابية' : 'Login / Connexion'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="nexus-card p-8 space-y-6 animate-in zoom-in-95 duration-500">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 px-1">اسم المستخدم / Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <i className="fa-solid fa-user-circle"></i>
                </span>
                <input
                  name="username"
                  type="text"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-nexus-accent/20 focus:border-nexus-accent transition-all"
                  placeholder="admin"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 px-1">كلمة المرور / Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-nexus-accent/20 focus:border-nexus-accent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded text-nexus-accent" />
              تذكرني / Remember
            </label>
          </div>

          {error && <div className="text-xs text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

          <button 
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-bold shadow-lg shadow-nexus-accent/20 transform active:scale-95 transition-all flex items-center justify-center gap-2 ${
              isLoading ? 'bg-slate-200 text-slate-500' : 'bg-nexus-accent text-white hover:bg-slate-800'
            }`}
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                جاري الدخول...
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket ml-2"></i>
                دخول
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
