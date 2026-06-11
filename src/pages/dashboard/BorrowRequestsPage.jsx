import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { canAccessOfficerModules } from '../../config/navigation.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { logAudit } from '../../lib/audit.js'
import {
  REQUEST_STATUS,
  approveAndIssue,
  cancelBorrowRequest,
  createBorrowRequest,
  fetchBorrowRequests,
  rejectBorrowRequest
} from '../../lib/borrowRequests.js'
import { dataTable, formFieldInput, formFieldSelect, tableWrap } from '../../lib/formStyles.js'
import { fetchAppSettings } from '../../lib/settings.js'
import { supabase } from '../../lib/supabase.js'

const emptyRequestForm = {
  category_id: '',
  equipment_id: '',
  purpose: '',
  needed_from: '',
  needed_until: ''
}

const reviewFilters = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: '', label: 'All' }
]

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export default function BorrowRequestsPage() {
  const { user, profile, role } = useAuth()
  const isOfficer = canAccessOfficerModules(role)
  const [requests, setRequests] = useState([])
  const [categories, setCategories] = useState([])
  const [availableEquipment, setAvailableEquipment] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [statusFilter, setStatusFilter] = useState(isOfficer ? 'pending' : '')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [rejectOpen, setRejectOpen] = useState(null)
  const [form, setForm] = useState(emptyRequestForm)
  const [approveEquipmentId, setApproveEquipmentId] = useState('')
  const [approveReturnAt, setApproveReturnAt] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    const [requestsResult, categoriesResult, equipmentResult, settingsResult] = await Promise.all([
      fetchBorrowRequests({ requesterOnly: !isOfficer, status: statusFilter || undefined }),
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('equipment').select('id, name, asset_tag, category_id, status').eq('status', 'available').order('name'),
      fetchAppSettings()
    ])

    if (requestsResult.error) setError(requestsResult.error.message)
    else setRequests(requestsResult.data ?? [])

    if (!categoriesResult.error) setCategories(categoriesResult.data ?? [])
    if (!equipmentResult.error) setAvailableEquipment(equipmentResult.data ?? [])
    if (!settingsResult.error) setSettings(settingsResult.data)

    setLoading(false)
  }, [isOfficer, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredEquipmentForReview = useMemo(() => {
    if (!reviewTarget) return availableEquipment
    if (reviewTarget.equipment_id) {
      return availableEquipment.filter((eq) => eq.id === reviewTarget.equipment_id)
    }
    if (reviewTarget.category_id) {
      return availableEquipment.filter((eq) => eq.category_id === reviewTarget.category_id)
    }
    return availableEquipment
  }, [availableEquipment, reviewTarget])

  const staffRequestsEnabled = settings?.allow_staff_requests !== false

  async function handleSubmit(e) {
    e.preventDefault()
    if (!staffRequestsEnabled && role === 'staff') {
      setError('Staff borrow requests are currently disabled by the administrator.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const payload = {
        requester_id: user.id,
        requester_name: profile.full_name,
        requester_department: profile.department || null,
        category_id: form.category_id || null,
        equipment_id: form.equipment_id || null,
        purpose: form.purpose.trim(),
        needed_from: form.needed_from ? new Date(form.needed_from).toISOString() : null,
        needed_until: form.needed_until ? new Date(form.needed_until).toISOString() : null
      }

      const { data, error: insertError } = await createBorrowRequest(payload)
      if (insertError) throw insertError

      await logAudit({
        userId: user.id,
        action: 'borrow_request_created',
        entityType: 'borrow_requests',
        entityId: data.id,
        details: { purpose: payload.purpose }
      })

      setSubmitOpen(false)
      setForm(emptyRequestForm)
      setMsg('Borrow request submitted successfully.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to submit request.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel(request) {
    if (!window.confirm('Cancel this borrow request?')) return
    setBusy(true)
    setError('')
    try {
      const { error: cancelError } = await cancelBorrowRequest(request.id)
      if (cancelError) throw cancelError

      await logAudit({
        userId: user.id,
        action: 'borrow_request_cancelled',
        entityType: 'borrow_requests',
        entityId: request.id
      })

      setMsg('Request cancelled.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to cancel request.')
    } finally {
      setBusy(false)
    }
  }

  function openApprove(request) {
    const equipmentOptions = request.equipment_id
      ? availableEquipment.filter((eq) => eq.id === request.equipment_id)
      : request.category_id
      ? availableEquipment.filter((eq) => eq.category_id === request.category_id)
      : availableEquipment

    setReviewTarget(request)
    setApproveEquipmentId(equipmentOptions[0]?.id ?? '')
    setApproveReturnAt(request.needed_until ? request.needed_until.slice(0, 16) : '')
    setError('')
  }

  async function handleApprove(e) {
    e.preventDefault()
    if (!reviewTarget || !approveEquipmentId) {
      setError('Select equipment to issue.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { borrowing } = await approveAndIssue({
        request: reviewTarget,
        equipmentId: approveEquipmentId,
        reviewerId: user.id,
        expectedReturnAt: approveReturnAt ? new Date(approveReturnAt).toISOString() : null
      })

      await logAudit({
        userId: user.id,
        action: 'borrow_request_approved',
        entityType: 'borrow_requests',
        entityId: reviewTarget.id,
        details: { borrowing_record_id: borrowing.id, equipment_id: approveEquipmentId }
      })

      setReviewTarget(null)
      setMsg('Request approved and equipment issued.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to approve request.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReject(e) {
    e.preventDefault()
    if (!rejectOpen) return
    if (!rejectNotes.trim()) {
      setError('Provide a reason for rejection.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const { error: rejectError } = await rejectBorrowRequest({
        id: rejectOpen.id,
        reviewerId: user.id,
        reviewNotes: rejectNotes.trim()
      })
      if (rejectError) throw rejectError

      await logAudit({
        userId: user.id,
        action: 'borrow_request_rejected',
        entityType: 'borrow_requests',
        entityId: rejectOpen.id,
        details: { review_notes: rejectNotes.trim() }
      })

      setRejectOpen(null)
      setRejectNotes('')
      setMsg('Request rejected.')
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to reject request.')
    } finally {
      setBusy(false)
    }
  }

  const equipmentForForm = form.category_id
    ? availableEquipment.filter((eq) => eq.category_id === form.category_id)
    : availableEquipment

  return (
    <div>
      <PageHeader
        title="Borrow Requests"
        subtitle={
          isOfficer
            ? 'Review staff requests and approve or reject equipment borrowings.'
            : 'Submit a request for ICT equipment. An officer will review and issue available items.'
        }
        actions={
          !isOfficer ? (
            <button
              type="button"
              onClick={() => {
                setForm({ ...emptyRequestForm, category_id: categories[0]?.id ?? '' })
                setSubmitOpen(true)
              }}
              disabled={!staffRequestsEnabled}
              className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-50"
            >
              New Request
            </button>
          ) : null
        }
      />

      {!staffRequestsEnabled && !isOfficer && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Staff borrow requests are currently disabled. Contact the ICT office for assistance.
        </div>
      )}

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

      {isOfficer && (
        <div className="mb-4 flex flex-wrap gap-2">
          {reviewFilters.map((f) => (
            <button
              key={f.id || 'all'}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={
                'rounded-xl px-3 py-1.5 text-xs font-medium transition ' +
                (statusFilter === f.id
                  ? 'bg-brandAmber-500/20 ring-1 ring-brandAmber-500/35 text-white'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10')
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className={tableWrap}>
          <table className={dataTable}>
            <thead className="bg-black/20 text-left text-white/60">
              <tr>
                {isOfficer && <th className="px-4 py-3 font-medium">Requester</th>}
                <th className="px-4 py-3 font-medium">Equipment / Category</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Needed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={isOfficer ? 7 : 6} className="px-4 py-8 text-center text-white/50">
                    Loading requests…
                  </td>
                </tr>
              )}
              {!loading && requests.length === 0 && (
                <tr>
                  <td colSpan={isOfficer ? 7 : 6} className="px-4 py-8 text-center text-white/50">
                    No borrow requests found.
                  </td>
                </tr>
              )}
              {!loading &&
                requests.map((row) => (
                  <tr key={row.id} className="border-t border-white/10 text-white/85">
                    {isOfficer && (
                      <td className="px-4 py-3">
                        <div>{row.requester_name}</div>
                        <div className="text-xs text-white/55">{row.requester_department || '—'}</div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      {row.equipment_name ? (
                        <>
                          <div>{row.equipment_name}</div>
                          {row.equipment_asset_tag && <div className="text-xs text-white/55">{row.equipment_asset_tag}</div>}
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
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDateTime(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {isOfficer && row.status === REQUEST_STATUS.pending && (
                          <>
                            <button
                              type="button"
                              onClick={() => openApprove(row)}
                              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectOpen(row)
                                setRejectNotes('')
                              }}
                              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {!isOfficer && row.status === REQUEST_STATUS.pending && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleCancel(row)}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        )}
                        {row.review_notes && row.status === REQUEST_STATUS.rejected && (
                          <span className="text-xs text-white/55" title={row.review_notes}>
                            Reason noted
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={submitOpen}
        title="Submit Borrow Request"
        onClose={() => setSubmitOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setSubmitOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">
              Cancel
            </button>
            <button type="submit" form="request-form" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {busy ? 'Submitting…' : 'Submit Request'}
            </button>
          </>
        }
      >
        <form id="request-form" onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="text-xs text-white/70">Equipment category</label>
            <select
              className={formFieldSelect}
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value, equipment_id: '' })}
            >
              <option value="">Any category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/70">Specific equipment (optional)</label>
            <select
              className={formFieldSelect}
              value={form.equipment_id}
              onChange={(e) => setForm({ ...form, equipment_id: e.target.value })}
            >
              <option value="">No preference</option>
              {equipmentForForm.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                  {eq.asset_tag ? ` (${eq.asset_tag})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/70">Purpose</label>
            <input className={formFieldInput} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/70">Needed from</label>
              <input type="datetime-local" className={formFieldInput} value={form.needed_from} onChange={(e) => setForm({ ...form, needed_from: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-white/70">Needed until</label>
              <input type="datetime-local" className={formFieldInput} value={form.needed_until} onChange={(e) => setForm({ ...form, needed_until: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(reviewTarget)}
        title="Approve Borrow Request"
        onClose={() => setReviewTarget(null)}
        footer={
          <>
            <button type="button" onClick={() => setReviewTarget(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">
              Cancel
            </button>
            <button type="submit" form="approve-form" disabled={busy || filteredEquipmentForReview.length === 0} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {busy ? 'Issuing…' : 'Approve & Issue'}
            </button>
          </>
        }
      >
        {reviewTarget && (
          <form id="approve-form" onSubmit={handleApprove} className="space-y-4">
            <p className="text-sm text-white/70">
              Issuing to <span className="text-white">{reviewTarget.requester_name}</span> for:{' '}
              <span className="text-white">{reviewTarget.purpose}</span>
            </p>
            {filteredEquipmentForReview.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                No available equipment matches this request. Register or return equipment first.
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs text-white/70">Equipment to issue</label>
                  <select className={formFieldSelect} value={approveEquipmentId} onChange={(e) => setApproveEquipmentId(e.target.value)} required>
                    {filteredEquipmentForReview.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                        {eq.asset_tag ? ` (${eq.asset_tag})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/70">Expected return</label>
                  <input
                    type="datetime-local"
                    className={formFieldInput}
                    value={approveReturnAt}
                    onChange={(e) => setApproveReturnAt(e.target.value)}
                  />
                </div>
              </>
            )}
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(rejectOpen)}
        title="Reject Borrow Request"
        onClose={() => setRejectOpen(null)}
        footer={
          <>
            <button type="button" onClick={() => setRejectOpen(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">
              Cancel
            </button>
            <button type="submit" form="reject-form" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {busy ? 'Saving…' : 'Reject Request'}
            </button>
          </>
        }
      >
        {rejectOpen && (
          <form id="reject-form" onSubmit={handleReject} className="space-y-4">
            <p className="text-sm text-white/70">
              Rejecting request from <span className="text-white">{rejectOpen.requester_name}</span>.
            </p>
            <div>
              <label className="text-xs text-white/70">Reason for rejection</label>
              <textarea
                className={formFieldInput}
                rows={3}
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                required
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
