export default function WidgetCard({ label, value, hint, tone = 'amber' }) {
  const map = {
    amber: {
      ring: 'ring-brandAmber-500/35',
      border: 'border-brandAmber-500/25',
      bg: 'bg-brandAmber-500/10',
      text: 'text-brandAmber-200',
      accent: 'bg-brandAmber-400'
    },
    emerald: {
      ring: 'ring-emerald-500/35',
      border: 'border-emerald-500/25',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-200',
      accent: 'bg-emerald-400'
    },
    sky: {
      ring: 'ring-sky-500/35',
      border: 'border-sky-500/25',
      bg: 'bg-sky-500/10',
      text: 'text-sky-200',
      accent: 'bg-sky-400'
    },
    rose: {
      ring: 'ring-rose-500/35',
      border: 'border-rose-500/25',
      bg: 'bg-rose-500/10',
      text: 'text-rose-200',
      accent: 'bg-rose-400'
    },
    violet: {
      ring: 'ring-violet-500/35',
      border: 'border-violet-500/25',
      bg: 'bg-violet-500/10',
      text: 'text-violet-200',
      accent: 'bg-violet-400'
    }
  }

  const t = map[tone] ?? map.amber

  return (
    <div className={`rounded-2xl border ${t.border} ${t.bg} p-4 sm:p-5 ring-1 ${t.ring} shadow-glow`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/55">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
          <div className={`mt-1 text-sm ${t.text}`}>{hint}</div>
        </div>
        <div className={`h-10 w-10 rounded-xl ${t.bg} ring-1 ${t.ring} grid place-items-center`}>
          <div className={`h-2.5 w-2.5 rounded-full ${t.accent}`} />
        </div>
      </div>
    </div>
  )
}

