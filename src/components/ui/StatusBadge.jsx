const styles = {
  available: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-200',
  borrowed: 'bg-sky-500/15 border-sky-500/25 text-sky-200',
  under_maintenance: 'bg-amber-500/15 border-amber-500/25 text-amber-200',
  retired: 'bg-white/10 border-white/20 text-white/60',
  active: 'bg-sky-500/15 border-sky-500/25 text-sky-200',
  returned: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-200',
  overdue: 'bg-rose-500/15 border-rose-500/25 text-rose-200',
  admin: 'bg-brandAmber-500/15 border-brandAmber-500/25 text-brandAmber-200',
  officer: 'bg-sky-500/15 border-sky-500/25 text-sky-200',
  staff: 'bg-white/10 border-white/20 text-white/70'
}

export default function StatusBadge({ status }) {
  const key = status ?? 'unknown'
  const label = String(key).replace(/_/g, ' ')
  const cls = styles[key] ?? 'bg-white/10 border-white/20 text-white/70'

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs capitalize ${cls}`}>
      {label}
    </span>
  )
}
