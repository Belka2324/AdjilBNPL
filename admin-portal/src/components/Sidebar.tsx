import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Store, CreditCard, Ban, Snowflake, MessageSquare, Settings, FileText, Activity, MessagesSquare } from 'lucide-react'
import { navItems, roleAccess } from '../lib/rbac'
import { Role } from '../lib/types'
import clsx from 'clsx'

type Props = {
  role: Role
}

const icons: Record<string, any> = {
  dashboard: LayoutDashboard,
  users: Users,
  merchants: Store,
  transactions: CreditCard,
  blacklist: Ban,
  frozen: Snowflake,
  complaints: MessageSquare,
  invoices: FileText,
  audit: Activity,
  settings: Settings,
  messages: MessagesSquare
}

export default function Sidebar({ role }: Props) {
  const allowed = roleAccess[role]
  
  return (
    <aside className="bg-[#1e293b] text-white m-4 rounded-3xl w-72 p-6 flex flex-col gap-8 shadow-2xl border border-slate-700/50">
      <div className="flex items-center gap-4 px-2">
        <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-0.5 rounded-xl shadow-lg shadow-blue-500/20">
            <img src="/assets/Logo%20AD.png" className="h-12 w-12 rounded-[10px] bg-white object-contain p-1" alt="Logo" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Adjil BNPL</div>
          <div className="font-black text-lg tracking-tight">Admin Portal</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {navItems
          .filter((n) => allowed.includes(n.key))
          .map((item) => {
            const Icon = icons[item.key] || LayoutDashboard
            return (
              <NavLink
                key={item.key}
                to={`/${role === 'administrator' || role === 'ceo' ? 'admin' : role}/${item.path}`}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 translate-x-1' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  )
                }
              >
                <Icon size={18} className="opacity-90 group-hover:opacity-100" />
                <span>{item.label}</span>
                <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </NavLink>
            )
          })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="text-xs font-medium text-slate-400">System Operational</div>
        </div>
      </div>
    </aside>
  )
}
