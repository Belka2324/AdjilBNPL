import { useMemo, useState } from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { TransactionRecord } from '../lib/types'

type Props = {
  data: TransactionRecord[]
}

type ViewMode = 'daily' | 'weekly' | 'monthly'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs text-slate-400">القيمة / Amount</span>
            <span className="text-sm font-black text-nexus-gold">{Number(payload[0].value).toLocaleString('fr-DZ')} دج</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs text-slate-400">العدد / Count</span>
            <span className="text-sm font-black text-white">{payload[1]?.value || 0}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function FinanceChart({ data }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')

  const chartData = useMemo(() => {
    const grouped: Record<string, { value: number; count: number }> = {}
    
    data.forEach((tx) => {
      const date = tx.created_at ? new Date(tx.created_at) : null
      if (!date) return
      
      let key: string
      if (viewMode === 'daily') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      } else if (viewMode === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }
      
      if (!grouped[key]) grouped[key] = { value: 0, count: 0 }
      grouped[key].value += Number(tx.amount || 0)
      grouped[key].count += 1
    })

    const sortedKeys = Object.keys(grouped).sort()
    const maxItems = viewMode === 'daily' ? 30 : viewMode === 'weekly' ? 12 : 12

    return sortedKeys.slice(-maxItems).map(key => ({
      date: key,
      ...grouped[key]
    }))
  }, [data, viewMode])

  const total = chartData.reduce((sum, d) => sum + d.value, 0)
  const avg = chartData.length > 0 ? total / chartData.length : 0

  return (
    <div className="nexus-card p-8 h-full min-h-[500px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Financial Flows</div>
          <h2 className="text-xl font-black text-slate-800">التدفقات المالية / Revenue</h2>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-xl">
          {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === mode 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
          <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Revenue</div>
          <div className="text-lg font-black text-slate-800">{total.toLocaleString('fr-DZ')} دج</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
          <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Avg per Period</div>
          <div className="text-lg font-black text-slate-800">{avg.toLocaleString('fr-DZ')} دج</div>
        </div>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={10}
              tickFormatter={(val: string) => {
                if (viewMode === 'monthly') return val.split('-')[1]
                return val.split('-').slice(-1)[0]
              }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(val: number) => `${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#d4af37" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
