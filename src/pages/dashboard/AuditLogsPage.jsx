import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { supabase } from '../../lib/supabase.js'

const actionOptions = [
  '',
  'user_created',
  'user_role_updated',
  'user_deactivated',
  'user_reactivated',
  'equipment_created',
  'equipment_updated',
  'equipment_issued',
  'equipment_returned',
  'report_exported',
  'category_created',
  'category_updated',
  'category_deleted'
]

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name')
      .then(({ data }) => setUsers(data ?? []))
  }, [])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError('')

    let query = supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, details, created_at, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (filters.userId) query = query.eq('user_id', filters.userId)
    if (filters.action) query = query.eq('action', filters.action)
    if (filters.dateFrom) query = query.gte('created_at', `${filters.dateFrom}T00:00:00`)
    if (filters.dateTo) query = query.lte('created_at', `${filters.dateTo}T23:59:59`)

    const { data, error: fetchError } = await query
    if (fetchError) setError(fetchError.message)
    else setLogs(data ?? [])
    setLoading(false)
  }, [filters])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const inputClass =
    'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-brandAmber-500/40'

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Read-only record of significant system actions for compliance and accountability."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-xs text-white/60">User</label>
            <select
              className={`${inputClass} mt-1 w-full`}
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60">Action</label>
            <select
              className={`${inputClass} mt-1 w-full`}
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">All actions</option>
              {actionOptions.filter(Boolean).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/60">From date</label>
            <input
              type="date"
              className={`${inputClass} mt-1 w-full`}
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-white/60">To date</label>
            <input
              type="date"
              className={`${inputClass} mt-1 w-full`}
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={loadLogs}
          className="mt-4 rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400"
        >
          Apply Filters
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                    Loading audit logs…
                  </td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                    No audit entries match your filters.
                  </td>
                </tr>
              )}
              {!loading &&
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-white/10 text-white/85">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{log.profiles?.full_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3">
                      {log.entity_type || '—'}
                      {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}…` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/60 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
