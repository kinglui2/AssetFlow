import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { logAudit } from '../../lib/audit.js'
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

export default function BorrowingsPage() {
  const { user } = useAuth()
  const [activeBorrowings, setActiveBorrowings] = useState([])
  const [availableEquipment, setAvailableEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [issueOpen, setIssueOpen] = useState(false)
  const [returnTarget, setReturnTarget] = useState(null)
  const [issueForm, setIssueForm] = useState(emptyIssueForm)
  const [returnCondition, setReturnCondition] = useState('good')
  const [busy, setBusy] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    const [activeResult, availableResult] = await Promise.all([
      supabase.from('active_borrowings').select('*').order('borrowed_at', { ascending: false }),
      supabase.from('equipment').select('id, name, asset_tag, serial_number').eq('status', 'available').order('name')
    ])

    if (activeResult.error) setError(activeResult.error.message)
    else setActiveBorrowings(activeResult.data ?? [])

    if (!availableResult.error) setAvailableEquipment(availableResult.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleIssue(e) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      const payload = {
        equipment_id: issueForm.equipment_id,
        borrower_name: issueForm.borrower_name.trim(),
        borrower_department: issueForm.borrower_department.trim(),
        borrower_employee_id: issueForm.borrower_employee_id.trim() || null,
        borrower_contact: issueForm.borrower_contact.trim() || null,
        purpose: issueForm.purpose.trim(),
        expected_return_at: issueForm.expected_return_at
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
        action: 'equipment_issued',
        entityType: 'borrowing_records',
        entityId: data.id,
        details: { equipment_id: payload.equipment_id, borrower: payload.borrower_name }
      })

      setIssueOpen(false)
      setIssueForm(emptyIssueForm)
      setMsg('Equipment issued successfully.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to issue equipment.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReturn(e) {
    e.preventDefault()
    if (!returnTarget) return

    setBusy(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('borrowing_records')
        .update({
          status: 'returned',
          returned_at: new Date().toISOString(),
          return_condition: returnCondition,
          returned_by: user.id
        })
        .eq('id', returnTarget.id)
      if (updateError) throw updateError

      await logAudit({
        userId: user.id,
        action: 'equipment_returned',
        entityType: 'borrowing_records',
        entityId: returnTarget.id,
        details: { equipment: returnTarget.equipment_name, borrower: returnTarget.borrower_name }
      })

      setReturnTarget(null)
      setReturnCondition('good')
      setMsg('Return recorded successfully.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to record return.')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brandAmber-500/40'

  return (
    <div>
      <PageHeader
        title="Borrowings"
        subtitle="Issue equipment to staff and record returns."
        actions={
          <button
            type="button"
            onClick={() => {
              setIssueForm({ ...emptyIssueForm, equipment_id: availableEquipment[0]?.id ?? '' })
              setIssueOpen(true)
            }}
            disabled={availableEquipment.length === 0}
            className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-50"
          >
            Issue Equipment
          </button>
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

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/20 text-left text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Equipment</th>
                <th className="px-4 py-3 font-medium">Borrower</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Borrowed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                    Loading borrowings…
                  </td>
                </tr>
              )}
              {!loading && activeBorrowings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                    No active borrowings.
                  </td>
                </tr>
              )}
              {!loading &&
                activeBorrowings.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-white/85">
                    <td className="px-4 py-3">{row.equipment_name}</td>
                    <td className="px-4 py-3">{row.borrower_name}</td>
                    <td className="px-4 py-3">{row.borrower_department}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(row.borrowed_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setReturnTarget(row)}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                      >
                        Record Return
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
        title="Issue Equipment"
        onClose={() => setIssueOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setIssueOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">
              Cancel
            </button>
            <button type="submit" form="issue-form" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {busy ? 'Issuing…' : 'Issue'}
            </button>
          </>
        }
      >
        <form id="issue-form" onSubmit={handleIssue} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs text-white/70">Equipment</label>
            <select className={inputClass} value={issueForm.equipment_id} onChange={(e) => setIssueForm({ ...issueForm, equipment_id: e.target.value })} required>
              {availableEquipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                  {eq.asset_tag ? ` (${eq.asset_tag})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/70">Borrower name</label>
            <input className={inputClass} value={issueForm.borrower_name} onChange={(e) => setIssueForm({ ...issueForm, borrower_name: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-white/70">Department</label>
            <input className={inputClass} value={issueForm.borrower_department} onChange={(e) => setIssueForm({ ...issueForm, borrower_department: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/70">Employee ID</label>
              <input className={inputClass} value={issueForm.borrower_employee_id} onChange={(e) => setIssueForm({ ...issueForm, borrower_employee_id: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-white/70">Contact</label>
              <input className={inputClass} value={issueForm.borrower_contact} onChange={(e) => setIssueForm({ ...issueForm, borrower_contact: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/70">Purpose</label>
            <input className={inputClass} value={issueForm.purpose} onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-white/70">Expected return</label>
            <input type="datetime-local" className={inputClass} value={issueForm.expected_return_at} onChange={(e) => setIssueForm({ ...issueForm, expected_return_at: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(returnTarget)}
        title="Record Return"
        onClose={() => setReturnTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setReturnTarget(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">
              Cancel
            </button>
            <button type="submit" form="return-form" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {busy ? 'Saving…' : 'Confirm Return'}
            </button>
          </>
        }
      >
        {returnTarget && (
          <form id="return-form" onSubmit={handleReturn} className="space-y-4">
            <p className="text-sm text-white/70">
              Returning <span className="text-white">{returnTarget.equipment_name}</span> from{' '}
              <span className="text-white">{returnTarget.borrower_name}</span>.
            </p>
            <div>
              <label className="text-xs text-white/70">Condition on return</label>
              <select className={inputClass} value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)}>
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
