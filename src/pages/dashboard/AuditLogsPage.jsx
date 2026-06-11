import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Pagination, { DEFAULT_PAGE_SIZE } from '../../components/ui/Pagination.jsx'
import { dataTable, filterInput, filterSelect, tableWrap } from '../../lib/formStyles.js'
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
  'equipment_assigned',
  'equipment_returned',
  'assignment_ended',
  'report_exported',
  'category_created',
  'category_updated',
  'category_deleted',
  'profile_updated',
  'password_changed',
  'settings_company_updated',
  'settings_notifications_updated',
  'settings_asset_config_updated',
  'borrow_request_created',
  'borrow_request_cancelled',
  'borrow_request_approved',
  'borrow_request_rejected'
]

function formatDetails(details) {
  if (!details || typeof details !== 'object') return '—'
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ')
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    dateFrom: '',
    dateTo: ''
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)

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

    const from = (page - 1) * DEFAULT_PAGE_SIZE
    const to = from + DEFAULT_PAGE_SIZE - 1

    let query = supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, details, created_at, profiles(full_name, email)', {
        count: 'exact'
      })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (appliedFilters.userId) query = query.eq('user_id', appliedFilters.userId)
    if (appliedFilters.action) query = query.eq('action', appliedFilters.action)
    if (appliedFilters.dateFrom) query = query.gte('created_at', `${appliedFilters.dateFrom}T00:00:00`)
    if (appliedFilters.dateTo) query = query.lte('created_at', `${appliedFilters.dateTo}T23:59:59`)

    const { data, error: fetchError, count } = await query
    if (fetchError) setError(fetchError.message)
    else {
      setLogs(data ?? [])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }, [page, appliedFilters])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  function applyFilters() {
    setPage(1)
    setAppliedFilters({ ...filters })
  }

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-xs text-white/60">User</label>
            <select
              className={`${filterSelect} mt-1`}
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
              className={`${filterSelect} mt-1`}
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
              className={`${filterInput} mt-1`}
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-white/60">To date</label>
            <input
              type="date"
              className={`${filterInput} mt-1`}
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={applyFilters}
          className="mt-4 w-full rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 sm:w-auto"
        >
          Apply Filters
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className={tableWrap}>
          <table className={dataTable}>
            <thead className="bg-black/20 text-left text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium min-w-[12rem]">Details</th>
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
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{log.profiles?.full_name || '—'}</div>
                      {log.profiles?.email && (
                        <div className="text-xs text-white/50">{log.profiles.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-brandAmber-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{log.entity_type || '—'}</div>
                      {log.entity_id && (
                        <div className="text-xs text-white/50 font-mono">{log.entity_id.slice(0, 8)}…</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/60">{formatDetails(log.details)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && totalCount > 0 && (
          <Pagination page={page} totalCount={totalCount} onPageChange={setPage} />
        )}
      </div>
    </div>
  )
}
