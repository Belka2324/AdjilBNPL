type KpiCardProps = {
  title: string
  value: string
  delta?: string
  icon?: string
  color?: 'gold' | 'dark'
}

export default function KpiCard({ title, value, delta, icon, color = 'gold' }: KpiCardProps) {
  const isNegative = delta?.startsWith('-')
  
  return (
    <div className="nexus-card p-4 hover:border-nexus-gold/30 hover:shadow-xl hover:shadow-slate-100 transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-1 h-full ${color === 'gold' ? 'bg-nexus-gold' : 'bg-slate-800'}`}></div>
      
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{title}</div>
        <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-nexus-gold/10 group-hover:text-nexus-gold transition-colors">
          <i className={`fa-solid ${icon} text-[10px]`}></i>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="text-xl font-black text-slate-800 tracking-tight leading-none">{value}</div>
        {delta && (
          <div className={`text-[10px] font-bold flex items-center gap-1 ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
            <i className={`fa-solid fa-caret-${isNegative ? 'down' : 'up'}`}></i>
            {delta}
          </div>
        )}
      </div>
    </div>
  )
}
