type Props = {
  title: string
  value: string
  delta?: string
}

export default function KpiCard({ title, value, delta }: Props) {
  return (
    <div className="nexus-card p-5">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="text-2xl font-black mt-2">{value}</div>
      {delta && <div className="text-xs text-emerald-500 mt-1">{delta}</div>}
    </div>
  )
}
