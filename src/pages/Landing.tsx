import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setStoredRole } from '../lib/storage'
import { Role, Institution } from '../lib/types'
import { INSTITUTIONS } from '../lib/data'

export default function Landing() {
  const navigate = useNavigate()
  const [showPartnerGateway, setShowPartnerGateway] = useState(false)
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null)

  const pick = (role: Role) => {
    setStoredRole(role)
    navigate('/login')
  }

  const handleInstitutionSelect = (institution: Institution) => {
    setSelectedInstitution(institution)
    // Store institution in localStorage
    localStorage.setItem('partner_institution', institution.id)
    setStoredRole('partner')
    navigate(`/login?partner=${institution.id}`)
  }

  const cards: { role: Role; title: string; desc: string }[] = [
    { role: 'administrator', title: '[ADMINISTRATOR]', desc: 'إدارة شاملة / Administration / Full control' },
    { role: 'partner', title: '[PARTNER]', desc: 'شركاء التسوية / Partenaires / Partners' },
    { role: 'support', title: '[SUPPORT]', desc: 'الدعم الفني / Support / Assistance' }
  ]

  // Partner Gateway View
  if (showPartnerGateway) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nexus-bg px-6">
        <div className="max-w-6xl w-full space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <button 
              onClick={() => setShowPartnerGateway(false)}
              className="text-slate-400 hover:text-nexus-accent transition-colors"
            >
              <i className="fa-solid fa-arrow-right ml-2"></i>
              العودة
            </button>
            <img src="/assets/Logo%20AD.png" className="h-16 mx-auto" />
            <h1 className="text-3xl font-black">اختر مؤسستك</h1>
            <p className="text-slate-500">اختر المؤسسة المالية التي تنتمي إليها / Choose your institution</p>
          </div>

          {/* Institution Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {INSTITUTIONS.map((inst) => (
              <button
                key={inst.id}
                onClick={() => handleInstitutionSelect(inst)}
                className="nexus-card p-6 text-center hover:shadow-soft hover:border-nexus-accent transition-all group"
              >
                <div className="relative">
                   {/* Placeholder for bank logo - using first letter as fallback */}
                   <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-black text-nexus-accent group-hover:scale-110 transition-transform">
                     {inst.code.charAt(0)}
                   </div>
                   <div className="absolute -top-2 -right-2 w-6 h-6 bg-nexus-accent rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <i className="fa-solid fa-arrow-left text-white text-xs"></i>
                   </div>
                </div>
                <div className="font-bold text-lg mt-2">{inst.name}</div>
                <div className="text-xs text-slate-500 mt-1">{inst.name_en}</div>
              </button>
            ))}
          </div>

          {/* Other Option */}
          <div className="text-center">
            <button
              onClick={() => pick('partner')}
              className="text-slate-400 hover:text-nexus-accent text-sm transition-colors"
            >
              <i className="fa-solid fa-ellipsis ml-2"></i>
              مؤسسة أخرى / Other Institution
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default Landing View
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
              onClick={() => c.role === 'partner' ? setShowPartnerGateway(true) : pick(c.role)}
              className="nexus-card p-6 text-right hover:shadow-soft transition-all group"
            >
              <div className="text-sm text-slate-400">{c.title}</div>
              <div className="font-bold mt-2">{c.desc}</div>
              {c.role === 'partner' && (
                <div className="mt-3 text-xs text-nexus-accent">
                  <i className="fa-solid fa-building-columns ml-1"></i>
                  اختر مؤسستك أولاً
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
