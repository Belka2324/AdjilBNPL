import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { TransactionRecord } from '../lib/types'

type Props = {
  data: TransactionRecord[]
}

export default function FinanceChart({ data }: Props) {
  const byMonth = data.reduce<Record<string, number>>((acc, tx) => {
    const date = tx.created_at ? new Date(tx.created_at) : null
    if (!date) return acc
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[key] = (acc[key] || 0) + Number(tx.amount || 0)
    return acc
  }, {})

  const chartData = Object.keys(byMonth)
    .slice(-6)
    .map((key) => ({
      name: key,
      amount: byMonth[key] || 0
    }))

  return (
    <div className="nexus-card p-6 h-96">
      <div className="flex items-center justify-between mb-6">
        <div className="font-bold text-lg text-slate-800">التدفقات المالية / Revenue</div>
        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">Monthly</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Bar 
            dataKey="amount" 
            fill="#3b82f6" 
            radius={[6, 6, 0, 0]} 
            barSize={40}
            name="Revenue (DZD)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
