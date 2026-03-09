import { Search, Bell, LogOut } from 'lucide-react'
import { Role } from '../lib/types'

type Props = {
  role: Role
  username: string
  onLogout: () => void
}

export default function TopBar({ role, username, onLogout }: Props) {
  const roleLabel =
    role === 'administrator'
      ? 'ADMINISTRATOR'
      : role === 'partner'
      ? 'PARTNER'
      : 'SUPPORT'

  const roleColor = 
    role === 'administrator' ? 'bg-purple-100 text-purple-700 border-purple-200' :
    role === 'partner' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    'bg-blue-100 text-blue-700 border-blue-200'

  return (
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
        
        <button className="relative bg-white p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 pr-4 pl-1.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/30">
            {username.slice(0, 1).toUpperCase()}
          </div>
          <div className="text-sm">
            <div className="font-bold text-slate-800">{username}</div>
            <div className="text-xs text-slate-400 font-medium">Adjil.BNPL</div>
          </div>
          <div className="w-px h-8 bg-slate-100 mx-2"></div>
          <button 
            onClick={onLogout} 
            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
