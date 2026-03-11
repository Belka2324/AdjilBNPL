import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { TransactionRecord } from '../lib/types'

type Props = {
  data: TransactionRecord[]
}

type ViewMode = 'daily' | 'weekly' | 'monthly'

type ChartDataItem = {
  key: string
  name: string
  amount: number
  trend: number
  trendPercent: number
  isUp: boolean
  fill: string
}

export default function FinanceChart({ data }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const processData = useMemo((): ChartDataItem[] => {
    const grouped: Record<string, number> = {}
    
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
      
      grouped[key] = (grouped[key] || 0) + Number(tx.amount || 0)
    })

    // Sort keys and calculate trend
    const sortedKeys = Object.keys(grouped).sort()
    const maxItems = viewMode === 'daily' ? 30 : viewMode === 'weekly' ? 12 : 12
    
    let prevAmount = 0
    return sortedKeys.slice(-maxItems).map((key, index): ChartDataItem => {
      const amount = grouped[key]
      const trend = index > 0 ? amount - prevAmount : 0
      const trendPercent = prevAmount > 0 ? (trend / prevAmount) * 100 : 0
      const isUp = trend >= 0
      prevAmount = amount
      
      // Format label based on view mode
      let label = key
      if (viewMode === 'monthly') {
        const [year, month] = key.split('-')
        label = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(month) - 1]} ${year.slice(2)}`
      } else if (viewMode === 'weekly') {
        const [year, month, day] = key.split('-')
        label = `${day}/${month}`
      } else {
        const [, , day] = key.split('-')
        label = day
      }
      
      return {
        key,
        name: label,
        amount,
        trend,
        trendPercent,
        isUp,
        fill: isUp ? '#22c55e' : '#ef4444'
      }
    })
  }, [data, viewMode])

  const selectedData = selectedIndex !== null ? processData[selectedIndex] : null

  // Calculate total and average
  const total = processData.reduce((sum, d) => sum + d.amount, 0)
  const avg = processData.length > 0 ? total / processData.length : 0
  const lastItem = processData.length > 1 ? processData[processData.length - 1] : null
  const prevItem = processData.length > 2 ? processData[processData.length - 2] : null
  const overallTrend = prevItem && lastItem 
    ? ((lastItem.amount - prevItem.amount) / prevItem.amount) * 100 
    : 0

  return (
    <div className="nexus-card p-6 h-[420px]">
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-lg text-slate-800">التدفقات المالية / Revenue</div>
        <div className="flex gap-2">
          {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                viewMode === mode 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mode === 'daily' ? 'يومي' : mode === 'weekly' ? 'أسبوعي' : 'شهري'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-slate-500">المجموع</div>
          <div className="font-bold text-lg">{total.toLocaleString('fr-DZ')} دج</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-xs text-slate-500">المتوسط</div>
          <div className="font-bold text-lg">{avg.toLocaleString('fr-DZ')} دج</div>
        </div>
        <div className={`rounded-xl p-3 ${overallTrend >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="text-xs text-slate-500">الاتجاه</div>
          <div className={`font-bold text-lg ${overallTrend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {overallTrend >= 0 ? '↑' : '↓'} {Math.abs(overallTrend).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height="55%">
        <BarChart 
          data={processData}
          onMouseLeave={() => setSelectedIndex(null)}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11 }} 
            dy={10}
            interval={viewMode === 'daily' ? 6 : 0}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11 }} 
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar 
            dataKey="amount" 
            radius={[6, 6, 0, 0]} 
            barSize={viewMode === 'daily' ? 8 : 24}
            name="الإيرادات"
          >
            {processData.map((entry, index) => (
              <Bar 
                key={index} 
                fill={entry.fill} 
                fillOpacity={selectedIndex === index ? 1 : 0.8}
                onMouseEnter={() => setSelectedIndex(index)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500"></div>
          <span className="text-slate-600">صاعد ↑</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-slate-600">نازل ↓</span>
        </div>
      </div>

      {/* Selected Bar Details Modal */}
      {selectedData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedIndex(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${selectedData.isUp ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <span className={`text-2xl ${selectedData.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedData.isUp ? '↑' : '↓'}
                </span>
              </div>
              <div className="font-bold text-lg">{selectedData.name}</div>
              <div className="text-3xl font-black text-slate-800">
                {selectedData.amount.toLocaleString('fr-DZ')} دج
              </div>
              <div className={`text-sm font-medium ${selectedData.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                {selectedData.trend >= 0 ? '+' : ''}{selectedData.trend.toLocaleString('fr-DZ')} دج 
                ({selectedData.trendPercent.toFixed(1)}%)
              </div>
              <div className="text-xs text-slate-500">
                {selectedData.isUp ? 'ارتفاع مقارنة بالفترة السابقة' : 'انخفاض مقارنة بالفترة السابقة'}
              </div>
              <button
                onClick={() => setSelectedIndex(null)}
                className="w-full bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-700 mt-4"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
