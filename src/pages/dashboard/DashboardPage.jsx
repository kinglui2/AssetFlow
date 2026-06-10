import { useEffect, useState } from 'react'
import WidgetCard from './components/WidgetCard.jsx'
import { supabase } from '../../lib/supabase.js'

const emptyStats = {
  totalEquipment: 0,
  available: 0,
  borrowed: 0,
  overdue: 0
}

function statusTone(status) {
  if (status === 'overdue') return 'rose'
  if (status === 'returned') return 'emerald'
  return 'sky'
}

function formatStatus(status) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function DashboardPage() {
  const [stats, setStats] = useState(emptyStats)
  const [recentBorrowings, setRecentBorrowings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      const [summaryResult, borrowingsResult] = await Promise.all([
        supabase.from('equipment_summary').select('status, count'),
        supabase
          .from('active_borrowings')
          .select('id, equipment_name, borrower_name, borrower_department, status')
          .order('borrowed_at', { ascending: false })
          .limit(5)
      ])

      if (!mounted) return

      if (summaryResult.error) {
        setError(summaryResult.error.message)
        setLoading(false)
        return
      }

      if (borrowingsResult.error) {
        setError(borrowingsResult.error.message)
        setLoading(false)
        return
      }

      const nextStats = { ...emptyStats }
      for (const row of summaryResult.data ?? []) {
        const count = Number(row.count) || 0
        nextStats.totalEquipment += count
        if (row.status === 'available') nextStats.available += count
        if (row.status === 'borrowed') nextStats.borrowed += count
      }

      const overdueResult = await supabase
        .from('borrowing_records')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'overdue')

      if (!mounted) return

      nextStats.overdue = overdueResult.count ?? 0
      setStats(nextStats)
      setRecentBorrowings(borrowingsResult.data ?? [])
      setLoading(false)
    }

    loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <WidgetCard
          label="Total Equipment"
          value={loading ? '—' : stats.totalEquipment}
          hint="Registered assets"
          tone="amber"
        />
        <WidgetCard
          label="Available"
          value={loading ? '—' : stats.available}
          hint="Ready to borrow"
          tone="emerald"
        />
        <WidgetCard
          label="Currently Borrowed"
          value={loading ? '—' : stats.borrowed}
          hint="Active borrowings"
          tone="sky"
        />
        <WidgetCard
          label="Overdue"
          value={loading ? '—' : stats.overdue}
          hint="Past expected return date"
          tone="rose"
        />
      </div>

      <div className="mt-6 grid xl:grid-cols-5 gap-4">
        <div className="xl:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold text-white">Borrowing Snapshot</div>
          <div className="text-sm text-white/60 mt-1">Recent active and overdue borrowings.</div>
          <div className="mt-4 space-y-3">
            {loading && (
              <div className="text-sm text-white/50">Loading borrowings…</div>
            )}
            {!loading && recentBorrowings.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/55">
                No active borrowings right now.
              </div>
            )}
            {!loading &&
              recentBorrowings.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"
                >
                  <div>
                    <div className="text-sm text-white/85 font-medium">{row.equipment_name}</div>
                    <div className="text-xs text-white/55">
                      {row.borrower_name}
                      {row.borrower_department ? ` · ${row.borrower_department}` : ''}
                    </div>
                  </div>
                  <span
                    className={
                      'text-xs rounded-full px-3 py-1 border ' +
                      (statusTone(row.status) === 'rose'
                        ? 'bg-rose-500/15 border-rose-500/25 text-rose-200'
                        : statusTone(row.status) === 'emerald'
                        ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-200'
                        : 'bg-sky-500/15 border-sky-500/25 text-sky-200')
                    }
                  >
                    {formatStatus(row.status)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold text-white">Action Center</div>
          <div className="text-sm text-white/60 mt-1">Common next steps for ICT officers.</div>

          <div className="mt-4 space-y-3">
            {[
              { k: 'Review Overdue', d: 'Confirm return plans and follow up with borrowers.', tone: 'rose' },
              { k: 'Issue Equipment', d: 'Record new borrowings from the equipment module.', tone: 'amber' },
              { k: 'Record Returns', d: 'Mark returns to keep availability accurate.', tone: 'emerald' }
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-white/85 font-medium">{x.k}</div>
                    <div className="text-xs text-white/55 mt-1">{x.d}</div>
                  </div>
                  <span
                    className={
                      'mt-1 inline-block h-2 w-2 rounded-full ' +
                      (x.tone === 'rose'
                        ? 'bg-rose-400'
                        : x.tone === 'emerald'
                        ? 'bg-emerald-400'
                        : 'bg-brandAmber-400')
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
