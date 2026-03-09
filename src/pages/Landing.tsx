import { useNavigate } from 'react-router-dom'
import { setStoredRole } from '../lib/storage'
import { Role } from '../lib/types'

export default function Landing() {
  const navigate = useNavigate()
  const pick = (role: Role) => {
    setStoredRole(role)
    navigate('/login')
  }

  const cards: { role: Role; title: string; desc: string }[] = [
    { role: 'administrator', title: '[ADMINISTRATOR]', desc: 'إدارة شاملة / Administration / Full control' },
    { role: 'partner', title: '[PARTNER]', desc: 'شركاء التسوية / Partenaires / Partners' },
    { role: 'support', title: '[SUPPORT]', desc: 'الدعم الفني / Support / Assistance' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-nexus-bg px-6">
      <div className="max-w-5xl w-full space-y-10">
        <div className="text-center space-y-3">
          <img src="/assets/Logo%20AD.png" className="h-16 mx-auto" />
          <h1 className="text-3xl font-black">ADJIL ADMIN PORTAL</h1>
          <p className="text-slate-500">منصة إدارة Adjil.BNPL للموظفين والشركاء</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <button
              key={c.role}
              onClick={() => pick(c.role)}
              className="nexus-card p-6 text-right hover:shadow-soft transition-all"
            >
              <div className="text-sm text-slate-400">{c.title}</div>
              <div className="font-bold mt-2">{c.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
