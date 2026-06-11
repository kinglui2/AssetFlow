import { useEffect, useState } from 'react'
import WidgetCard from './components/WidgetCard.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { supabase } from '../../lib/supabase.js'

const emptyStats = {
  totalEquipment: 0,
  available: 0,
  borrowed: 0,
  assigned: 0,
  overdue: 0
}

export default function DashboardPage() {
  const [stats, setStats] = useState(emptyStats)
  const [recentRecords, setRecentRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      const [summaryResult, recordsResult] = await Promise.all([
        supabase.from('equipment_summary').select('status, count'),
        supabase
          .from('active_borrowings')
          .select('id, equipment_name, borrower_name, borrower_department, status, issuance_type')
          .order('borrowed_at', { ascending: false })
          .limit(5)
      ])

      if (!mounted) return

      if (summaryResult.error) {
        setError(summaryResult.error.message)
        setLoading(false)
        return
      }

      if (recordsResult.error) {
        setError(recordsResult.error.message)
        setLoading(false)
        return
      }

      const nextStats = { ...emptyStats }
      for (const row of summaryResult.data ?? []) {
        const count = Number(row.count) || 0
        nextStats.totalEquipment += count
        if (row.status === 'available') nextStats.available += count
        if (row.status === 'borrowed') nextStats.borrowed += count
        if (row.status === 'assigned') nextStats.assigned += count
      }

      const overdueResult = await supabase
        .from('borrowing_records')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'overdue')

      if (!mounted) return

      nextStats.overdue = overdueResult.count ?? 0
      setStats(nextStats)
      setRecentRecords(recordsResult.data ?? [])
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
        <WidgetCard
          label="Total Equipment"
          value={loading ? '—' : stats.totalEquipment}
          hint="Registered assets"
          tone="amber"
        />
        <WidgetCard
          label="Available"
          value={loading ? '—' : stats.available}
          hint="Ready to issue"
          tone="emerald"
        />
        <WidgetCard
          label="On Loan"
          value={loading ? '—' : stats.borrowed}
          hint="Temporary borrows"
          tone="sky"
        />
        <WidgetCard
          label="Assigned"
          value={loading ? '—' : stats.assigned}
          hint="Long-term staff assignments"
          tone="violet"
        />
        <WidgetCard
          label="Overdue"
          value={loading ? '—' : stats.overdue}
          hint="Past expected return date"
          tone="rose"
        />
      </div>

      <div className="mt-5 grid gap-4 sm:mt-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="text-sm font-semibold text-white">Active Issuance Snapshot</div>
          <div className="text-sm text-white/60 mt-1">Recent temporary borrows and staff assignments.</div>
          <div className="mt-4 space-y-3">
            {loading && (
              <div className="text-sm text-white/50">Loading records…</div>
            )}
            {!loading && recentRecords.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/55">
                No active borrowings or assignments right now.
              </div>
            )}
            {!loading &&
              recentRecords.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-white/85 font-medium">{row.equipment_name}</div>
                    <div className="text-xs text-white/55">
                      {row.borrower_name}
                      {row.borrower_department ? ` · ${row.borrower_department}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={row.issuance_type ?? 'temporary'} />
                    <StatusBadge status={row.status} />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="text-sm font-semibold text-white">Action Center</div>
          <div className="text-sm text-white/60 mt-1">Common next steps for ICT officers.</div>

          <div className="mt-4 space-y-3">
            {[
              { k: 'Review Overdue', d: 'Follow up on temporary borrows past their return date.', tone: 'rose' },
              { k: 'Assign Equipment', d: 'Record long-term laptops and devices issued to staff.', tone: 'violet' },
              { k: 'Record Returns', d: 'End assignments or mark temporary returns.', tone: 'emerald' }
            ].map((x) => (
              <div key={x.k} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-white/85 font-medium">{x.k}</div>
                    <div className="text-xs text-white/55 mt-1">{x.d}</div>
                  </div>
                  <span
                    className={
                      'mt-1 inline-block h-2 w-2 shrink-0 rounded-full ' +
                      (x.tone === 'rose'
                        ? 'bg-rose-400'
                        : x.tone === 'emerald'
                        ? 'bg-emerald-400'
                        : x.tone === 'violet'
                        ? 'bg-violet-400'
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
