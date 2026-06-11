import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { logAudit } from '../../lib/audit.js'
import { formatExpectedReturn, returnReasonLabel } from '../../lib/issuance.js'
import { dataTable, filterInput, filterSelect, tableWrap } from '../../lib/formStyles.js'
import { supabase } from '../../lib/supabase.js'

const reportTypes = [
  { id: 'borrowing_history', label: 'Borrowing History' },
  { id: 'active_borrowings', label: 'Currently Out' },
  { id: 'staff_assignments', label: 'Staff Assignments' },
  { id: 'inventory', label: 'Equipment Inventory' },
  { id: 'overdue', label: 'Overdue Items' }
]

function exportCsv(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [reportType, setReportType] = useState('borrowing_history')
  const [rows, setRows] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    department: '',
    categoryId: '',
    borrower: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  const generateReport = useCallback(async () => {
    setLoading(true)
    setError('')
    setRows([])

    try {
      if (reportType === 'borrowing_history') {
        let query = supabase
          .from('borrowing_records')
          .select('borrowed_at, returned_at, status, issuance_type, return_reason, borrower_name, borrower_department, purpose, expected_return_at, equipment(name, asset_tag, categories(name))')
          .order('borrowed_at', { ascending: false })

        if (filters.department) query = query.eq('borrower_department', filters.department)
        if (filters.borrower) query = query.ilike('borrower_name', `%${filters.borrower}%`)
        if (filters.dateFrom) query = query.gte('borrowed_at', `${filters.dateFrom}T00:00:00`)
        if (filters.dateTo) query = query.lte('borrowed_at', `${filters.dateTo}T23:59:59`)

        const { data, error: qError } = await query
        if (qError) throw qError

        setRows(
          (data ?? []).map((r) => ({
            borrowed_at: r.borrowed_at,
            returned_at: r.returned_at || '',
            issuance_type: r.issuance_type ?? 'temporary',
            status: r.status,
            borrower_name: r.borrower_name,
            borrower_department: r.borrower_department,
            equipment: r.equipment?.name || '',
            category: r.equipment?.categories?.name || '',
            purpose: r.purpose,
            expected_return: formatExpectedReturn(r),
            return_reason: returnReasonLabel(r.return_reason)
          }))
        )
      } else if (reportType === 'active_borrowings') {
        const { data, error: qError } = await supabase.from('active_borrowings').select('*')
        if (qError) throw qError
        setRows(
          (data ?? []).map((r) => ({
            ...r,
            expected_return: formatExpectedReturn(r)
          }))
        )
      } else if (reportType === 'staff_assignments') {
        const { data, error: qError } = await supabase
          .from('active_borrowings')
          .select('*')
          .eq('issuance_type', 'assignment')
          .order('borrowed_at', { ascending: false })
        if (qError) throw qError
        setRows(
          (data ?? []).map((r) => ({
            equipment: r.equipment_name,
            asset_tag: r.asset_tag || '',
            staff_name: r.borrower_name,
            department: r.borrower_department,
            employee_id: r.borrower_employee_id || '',
            assigned_since: r.borrowed_at,
            notes: r.purpose
          }))
        )
      } else if (reportType === 'inventory') {
        let query = supabase.from('equipment').select('name, serial_number, asset_tag, status, condition, categories(name)').order('name')
        if (filters.categoryId) query = query.eq('category_id', filters.categoryId)

        const { data, error: qError } = await query
        if (qError) throw qError

        setRows(
          (data ?? []).map((r) => ({
            name: r.name,
            category: r.categories?.name || '',
            serial_number: r.serial_number || '',
            asset_tag: r.asset_tag || '',
            status: r.status,
            condition: r.condition
          }))
        )
      } else if (reportType === 'overdue') {
        const { data, error: qError } = await supabase
          .from('borrowing_records')
          .select('borrowed_at, expected_return_at, borrower_name, borrower_department, equipment(name, asset_tag)')
          .eq('status', 'overdue')
          .eq('issuance_type', 'temporary')
          .order('expected_return_at')
        if (qError) throw qError

        setRows(
          (data ?? []).map((r) => ({
            borrower_name: r.borrower_name,
            borrower_department: r.borrower_department,
            equipment: r.equipment?.name || '',
            borrowed_at: r.borrowed_at,
            expected_return_at: r.expected_return_at
          }))
        )
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report.')
    } finally {
      setLoading(false)
    }
  }, [reportType, filters])

  async function handleExport() {
    if (!rows.length) return
    exportCsv(`assetflow-${reportType}-${Date.now()}.csv`, rows)

    await logAudit({
      userId: user.id,
      action: 'report_exported',
      entityType: 'reports',
      details: { report_type: reportType, row_count: rows.length }
    })
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export borrowing, assignment, inventory, and overdue reports." />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <div>
          <label className="text-xs text-white/60">Report type</label>
          <select className={`${filterSelect} mt-1 md:max-w-xs`} value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {reportTypes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {(reportType === 'borrowing_history' || reportType === 'inventory') && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {reportType === 'borrowing_history' && (
              <>
                <div>
                  <label className="text-xs text-white/60">Department</label>
                  <input className={`${filterInput} mt-1`} value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Borrower</label>
                  <input className={`${filterInput} mt-1`} value={filters.borrower} onChange={(e) => setFilters({ ...filters, borrower: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">From date</label>
                  <input type="date" className={`${filterInput} mt-1`} value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">To date</label>
                  <input type="date" className={`${filterInput} mt-1`} value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                </div>
              </>
            )}
            {reportType === 'inventory' && (
              <div>
                <label className="text-xs text-white/60">Category</label>
                <select className={`${filterSelect} mt-1`} value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap [&>button]:w-full sm:[&>button]:w-auto">
          <button
            type="button"
            onClick={generateReport}
            disabled={loading}
            className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60"
          >
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!rows.length}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className={tableWrap}>
          {rows.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-white/50">
              {loading ? 'Generating report…' : 'Generate a report to see results.'}
            </div>
          ) : (
            <table className={dataTable}>
              <thead className="bg-black/20 text-left text-white/60">
                <tr>
                  {Object.keys(rows[0]).map((key) => (
                    <th key={key} className="px-4 py-3 font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-t border-white/10 text-white/85">
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} className="px-4 py-3">
                    {['status', 'issuance_type'].includes(key) ? (
                        <StatusBadge status={value} />
                      ) : (
                        String(value ?? '—')
                      )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
