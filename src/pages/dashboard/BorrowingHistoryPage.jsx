import { useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { dataTable, tableWrap } from '../../lib/formStyles.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabase.js'

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function BorrowingHistoryPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('borrow_requests_detail')
        .select('*')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setRecords(data ?? [])
      setLoading(false)
    }
    load()
  }, [user.id])

  return (
    <div>
      <PageHeader
        title="My Borrowing History"
        subtitle="A record of equipment you have requested and been issued."
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className={tableWrap}>
          <table className={dataTable}>
            <thead className="bg-black/20 text-left text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Equipment / Category</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Needed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reviewed</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                    Loading history…
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                    No borrowing history found.
                  </td>
                </tr>
              )}
              {!loading &&
                records.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-white/85">
                    <td className="px-4 py-3">
                      {row.equipment_name ? (
                        <>
                          <div>{row.equipment_name}</div>
                          {row.equipment_asset_tag && (
                            <div className="text-xs text-white/55">{row.equipment_asset_tag}</div>
                          )}
                        </>
                      ) : (
                        <div>{row.category_name || 'Any available'}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{row.purpose}</td>
                    <td className="px-4 py-3 text-xs text-white/70 whitespace-nowrap">
                      {row.needed_from || row.needed_until ? (
                        <>
                          {formatDateTime(row.needed_from)}
                          {row.needed_until ? ` → ${formatDateTime(row.needed_until)}` : ''}
                        </>
                      ) : (
                        'Flexible'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {row.reviewed_at ? formatDateTime(row.reviewed_at) : '—'}
                      {row.reviewer_name && (
                        <div className="text-white/50">{row.reviewer_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDateTime(row.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}