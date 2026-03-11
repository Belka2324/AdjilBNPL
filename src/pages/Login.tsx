import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { getStoredRole, saveSession } from '../lib/storage'
import { Role } from '../lib/types'

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
})

// Default credentials for demo
const DEFAULT_CREDENTIALS: Record<string, { password: string; role: Role; isCEO?: boolean }> = {
  'ceo': { password: 'ceo', role: 'administrator', isCEO: true },
  'admin': { password: 'belka23', role: 'administrator', isCEO: true },
  'partner': { password: 'partner', role: 'partner' },
  'support': { password: 'support', role: 'support' }
}

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(true)
  const role = (getStoredRole() || 'administrator') as Role

  // Check for team member login
  const checkTeamLogin = (username: string, password: string) => {
    try {
      const loginData = JSON.parse(localStorage.getItem('adjil_login_data') || '[]')
      const user = loginData.find((u: any) => u.username === username && u.password === password)
      if (user) {
        return { role: user.role, isCEO: false }
      }
    } catch (e) {
      console.log('No team login data')
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = { username: String(form.get('username') || ''), password: String(form.get('password') || '') }
    const valid = schema.safeParse(data)
    if (!valid.success) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور')
      return
    }
    
    // First check default credentials
    const defaultCred = DEFAULT_CREDENTIALS[data.username.toLowerCase()]
    if (defaultCred && defaultCred.password === data.password) {
      const isCEO = defaultCred.isCEO || data.username.toLowerCase() === 'ceo'
      saveSession({ username: data.username, role: defaultCred.role, remember, isCEO })
      navigate('/dashboard')
      return
    }
    
    // Then check team member credentials
    const teamLogin = checkTeamLogin(data.username, data.password)
    if (teamLogin) {
      saveSession({ username: data.username, role: teamLogin.role, remember, isCEO: false })
      navigate('/dashboard')
      return
    }
    
    setError('بيانات الدخول غير صحيحة')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nexus-bg px-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <img src="/assets/Logo%20AD.png" className="h-16 mx-auto" />
          <h2 className="text-2xl font-black">تسجيل الدخول</h2>
          <p className="text-slate-500">Login / Connexion</p>
        </div>
        <form onSubmit={handleSubmit} className="nexus-card p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">اسم المستخدم / Username</label>
            <input
              name="username"
              className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-nexus-accent"
              placeholder="admin"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">كلمة المرور / Mot de passe / Password</label>
            <input
              name="password"
              type="password"
              className="w-full bg-slate-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-nexus-accent"
              placeholder="admin"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            تذكرني / Remember
          </label>
          {error && <div className="text-xs text-red-500">{error}</div>}
          <button className="w-full bg-nexus-accent text-white py-3 rounded-xl font-bold">دخول</button>
        </form>
      </div>
    </div>
  )
}
