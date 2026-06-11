import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { logAudit } from '../../lib/audit.js'
import { dataTable, filterSelect, formFieldInput, formFieldSelect, tableWrap } from '../../lib/formStyles.js'
import {
  ISSUANCE_TYPES,
  RETURN_REASONS,
  formatExpectedReturn,
  isAssignment
} from '../../lib/issuance.js'
import { supabase } from '../../lib/supabase.js'

const emptyIssueForm = {
  equipment_id: '',
  borrower_name: '',
  borrower_department: '',
  borrower_employee_id: '',
  borrower_contact: '',
  purpose: '',
  expected_return_at: ''
}

const listFilters = [
  { id: 'all', label: 'All active' },
  { id: ISSUANCE_TYPES.temporary, label: 'Temporary borrows' },
  { id: ISSUANCE_TYPES.assignment, label: 'Staff assignments' }
]

export default function BorrowingsPage() {
  const { user } = useAuth()
  const [activeRecords, setActiveRecords] = useState([])
  const [availableEquipment, setAvailableEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [listFilter, setListFilter] = useState('all')
  const [issueOpen, setIssueOpen] = useState(false)
  const [issueType, setIssueType] = useState(ISSUANCE_TYPES.temporary)
  const [returnTarget, setReturnTarget] = useState(null)
  const [issueForm, setIssueForm] = useState(emptyIssueForm)
  const [returnCondition, setReturnCondition] = useState('good')
  const [returnReason, setReturnReason] = useState('')
  const [busy, setBusy] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    const [activeResult, availableResult] = await Promise.all([
      supabase.from('active_borrowings').select('*').order('borrowed_at', { ascending: false }),
      supabase.from('equipment').select('id, name, asset_tag, serial_number').eq('status', 'available').order('name')
    ])

    if (activeResult.error) setError(activeResult.error.message)
    else setActiveRecords(activeResult.data ?? [])

    if (!availableResult.error) setAvailableEquipment(availableResult.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredRecords = useMemo(() => {
    if (listFilter === 'all') return activeRecords
    return activeRecords.filter((row) => row.issuance_type === listFilter)
  }, [activeRecords, listFilter])

  function openIssue(type) {
    setIssueType(type)
    setIssueForm({ ...emptyIssueForm, equipment_id: availableEquipment[0]?.id ?? '' })
    setIssueOpen(true)
    setError('')
  }

  async function handleIssue(e) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const isAssign = issueType === ISSUANCE_TYPES.assignment

    try {
      const payload = {
        equipment_id: issueForm.equipment_id,
        issuance_type: issueType,
        borrower_name: issueForm.borrower_name.trim(),
        borrower_department: issueForm.borrower_department.trim(),
        borrower_employee_id: issueForm.borrower_employee_id.trim() || null,
        borrower_contact: issueForm.borrower_contact.trim() || null,
        purpose: issueForm.purpose.trim(),
        expected_return_at:
          !isAssign && issueForm.expected_return_at
            ? new Date(issueForm.expected_return_at).toISOString()
            : null,
        issued_by: user.id
      }

      const { data, error: insertError } = await supabase
        .from('borrowing_records')
        .insert(payload)
        .select()
        .single()
      if (insertError) throw insertError

      await logAudit({
        userId: user.id,
        action: isAssign ? 'equipment_assigned' : 'equipment_issued',
        entityType: 'borrowing_records',
        entityId: data.id,
        details: {
          equipment_id: payload.equipment_id,
          borrower: payload.borrower_name,
          issuance_type: issueType
        }
      })

      setIssueOpen(false)
      setIssueForm(emptyIssueForm)
      setMsg(isAssign ? 'Equipment assigned to staff successfully.' : 'Equipment issued successfully.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to save record.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReturn(e) {
    e.preventDefault()
    if (!returnTarget) return

    if (isAssignment(returnTarget) && !returnReason) {
      setError('Select a reason for ending this assignment.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('borrowing_records')
        .update({
          status: 'returned',
          returned_at: new Date().toISOString(),
          return_condition: returnCondition,
          return_reason: returnReason || null,
          returned_by: user.id
        })
        .eq('id', returnTarget.id)
      if (updateError) throw updateError

      await logAudit({
        userId: user.id,
        action: isAssignment(returnTarget) ? 'assignment_ended' : 'equipment_returned',
        entityType: 'borrowing_records',
        entityId: returnTarget.id,
        details: {
          equipment: returnTarget.equipment_name,
          borrower: returnTarget.borrower_name,
          return_reason: returnReason || null
        }
      })

      setReturnTarget(null)
      setReturnCondition('good')
      setReturnReason('')
      setMsg(isAssignment(returnTarget) ? 'Assignment ended successfully.' : 'Return recorded successfully.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to record return.')
    } finally {
      setBusy(false)
    }
  }

  function openReturn(row) {
    setReturnTarget(row)
    setReturnCondition('good')
    setReturnReason('')
    setError('')
  }

  const issueTitle =
    issueType === ISSUANCE_TYPES.assignment ? 'Assign Equipment to Staff' : 'Issue Equipment (Temporary)'

  return (
    <div>
      <PageHeader
        title="Borrowings & Assignments"
        subtitle="Issue short-term equipment and assign long-term assets to staff until employment ends or the asset is recovered."
        actions={
          <>
            <button
              type="button"
              onClick={() => openIssue(ISSUANCE_TYPES.temporary)}
              disabled={availableEquipment.length === 0}
              className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-50"
            >
              Temporary Borrow
            </button>
            <button
              type="button"
              onClick={() => openIssue(ISSUANCE_TYPES.assignment)}
              disabled={availableEquipment.length === 0}
              className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 hover:bg-violet-500/20 disabled:opacity-50"
            >
              Assign to Staff
            </button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {msg}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {listFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setListFilter(f.id)}
              className={
                'rounded-xl px-3 py-1.5 text-xs font-medium transition ' +
                (listFilter === f.id
                  ? 'bg-brandAmber-500/20 ring-1 ring-brandAmber-500/35 text-white'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className={`${filterSelect} sm:min-w-[11rem]`}
          value={listFilter}
          onChange={(e) => setListFilter(e.target.value)}
        >
          {listFilters.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className={tableWrap}>
          <table className={dataTable}>
            <thead className="bg-black/20 text-left text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Equipment</th>
                <th className="px-4 py-3 font-medium">Borrower</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Since</th>
                <th className="px-4 py-3 font-medium">Expected return</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/50">
                    Loading records…
                  </td>
                </tr>
              )}
              {!loading && filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/50">
                    No active records in this view.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredRecords.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-white/85">
                    <td className="px-4 py-3">
                      <StatusBadge status={row.issuance_type ?? ISSUANCE_TYPES.temporary} />
                    </td>
                    <td className="px-4 py-3">{row.equipment_name}</td>
                    <td className="px-4 py-3">{row.borrower_name}</td>
                    <td className="px-4 py-3">{row.borrower_department}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(row.borrowed_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-white/70">
                      {formatExpectedReturn(row)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openReturn(row)}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                      >
                        {isAssignment(row) ? 'End Assignment' : 'Record Return'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={issueOpen}
        title={issueTitle}
        onClose={() => setIssueOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setIssueOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">
              Cancel
            </button>
            <button type="submit" form="issue-form" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {busy ? 'Saving…' : issueType === ISSUANCE_TYPES.assignment ? 'Assign' : 'Issue'}
            </button>
          </>
        }
      >
        <form id="issue-form" onSubmit={handleIssue} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {issueType === ISSUANCE_TYPES.assignment && (
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
              Long-term assignment — no return date. The asset stays with the staff member until you end the assignment.
            </div>
          )}

          <div>
            <label className="text-xs text-white/70">Equipment</label>
            <select className={formFieldSelect} value={issueForm.equipment_id} onChange={(e) => setIssueForm({ ...issueForm, equipment_id: e.target.value })} required>
              {availableEquipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                  {eq.asset_tag ? ` (${eq.asset_tag})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/70">Staff name</label>
            <input className={formFieldInput} value={issueForm.borrower_name} onChange={(e) => setIssueForm({ ...issueForm, borrower_name: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-white/70">Department</label>
            <input className={formFieldInput} value={issueForm.borrower_department} onChange={(e) => setIssueForm({ ...issueForm, borrower_department: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/70">
                Employee ID{issueType === ISSUANCE_TYPES.assignment ? ' *' : ''}
              </label>
              <input
                className={formFieldInput}
                value={issueForm.borrower_employee_id}
                onChange={(e) => setIssueForm({ ...issueForm, borrower_employee_id: e.target.value })}
                required={issueType === ISSUANCE_TYPES.assignment}
              />
            </div>
            <div>
              <label className="text-xs text-white/70">Contact</label>
              <input className={formFieldInput} value={issueForm.borrower_contact} onChange={(e) => setIssueForm({ ...issueForm, borrower_contact: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/70">
              {issueType === ISSUANCE_TYPES.assignment ? 'Assignment notes' : 'Purpose'}
            </label>
            <input className={formFieldInput} value={issueForm.purpose} onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })} required />
          </div>
          {issueType === ISSUANCE_TYPES.temporary && (
            <div>
              <label className="text-xs text-white/70">Expected return (optional)</label>
              <input type="datetime-local" className={formFieldInput} value={issueForm.expected_return_at} onChange={(e) => setIssueForm({ ...issueForm, expected_return_at: e.target.value })} />
              <p className="mt-1 text-xs text-white/50">Leave blank if no fixed return date; overdue tracking only applies when a date is set.</p>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(returnTarget)}
        title={returnTarget && isAssignment(returnTarget) ? 'End Staff Assignment' : 'Record Return'}
        onClose={() => setReturnTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setReturnTarget(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">
              Cancel
            </button>
            <button type="submit" form="return-form" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {busy ? 'Saving…' : returnTarget && isAssignment(returnTarget) ? 'End Assignment' : 'Confirm Return'}
            </button>
          </>
        }
      >
        {returnTarget && (
          <form id="return-form" onSubmit={handleReturn} className="space-y-4">
            <p className="text-sm text-white/70">
              {isAssignment(returnTarget) ? 'Ending assignment of' : 'Returning'}{' '}
              <span className="text-white">{returnTarget.equipment_name}</span>{' '}
              {isAssignment(returnTarget) ? 'from' : 'from'}{' '}
              <span className="text-white">{returnTarget.borrower_name}</span>.
            </p>
            {isAssignment(returnTarget) && (
              <div>
                <label className="text-xs text-white/70">Reason for ending assignment</label>
                <select className={formFieldSelect} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} required>
                  <option value="">Select reason…</option>
                  {RETURN_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-white/70">Condition on return</label>
              <select className={formFieldSelect} value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)}>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
