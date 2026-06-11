import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { isAdmin } from '../../config/navigation.jsx'
import { useClientPagination } from '../../hooks/useClientPagination.js'
import { logAudit } from '../../lib/audit.js'
import { dataTable, filterInput, filterSelect, formFieldInput, formFieldSelect, tableWrap } from '../../lib/formStyles.js'
import { supabase } from '../../lib/supabase.js'
import EquipmentCategoriesPanel from './EquipmentCategoriesPanel.jsx'

const emptyForm = {
  name: '',
  category_id: '',
  serial_number: '',
  asset_tag: '',
  condition: 'good',
  status: 'available',
  notes: ''
}

const tabs = [
  { id: 'equipment', label: 'Equipment' },
  { id: 'categories', label: 'Categories', adminOnly: true }
]

export default function EquipmentPage() {
  const { user, role } = useAuth()
  const admin = isAdmin(role)
  const [activeTab, setActiveTab] = useState('equipment')
  const [equipment, setEquipment] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || admin)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    const [eqResult, catResult] = await Promise.all([
      supabase
        .from('equipment')
        .select('*, categories(name)')
        .order('name'),
      supabase.from('categories').select('id, name').order('name')
    ])

    if (eqResult.error) setError(eqResult.error.message)
    else setEquipment(eqResult.data ?? [])

    if (!catResult.error) setCategories(catResult.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return equipment.filter((item) => {
      const matchesSearch =
        !q ||
        item.name?.toLowerCase().includes(q) ||
        item.serial_number?.toLowerCase().includes(q) ||
        item.asset_tag?.toLowerCase().includes(q)
      const matchesStatus = !statusFilter || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [equipment, search, statusFilter])

  const { page, setPage, paginatedItems, totalCount, pageSize } = useClientPagination(filtered)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, setPage])

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm, category_id: categories[0]?.id ?? '' })
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      name: item.name,
      category_id: item.category_id,
      serial_number: item.serial_number ?? '',
      asset_tag: item.asset_tag ?? '',
      condition: item.condition,
      status: item.status,
      notes: item.notes ?? ''
    })
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!admin) return

    setBusy(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      category_id: form.category_id,
      serial_number: form.serial_number.trim() || null,
      asset_tag: form.asset_tag.trim() || null,
      condition: form.condition,
      status: form.status,
      notes: form.notes.trim() || null
    }

    try {
      if (editing) {
        const { error: updateError } = await supabase.from('equipment').update(payload).eq('id', editing.id)
        if (updateError) throw updateError

        await logAudit({
          userId: user.id,
          action: 'equipment_updated',
          entityType: 'equipment',
          entityId: editing.id,
          details: { name: payload.name, status: payload.status }
        })
        setMsg('Equipment updated.')
      } else {
        const { data, error: insertError } = await supabase
          .from('equipment')
          .insert({ ...payload, created_by: user.id })
          .select()
          .single()
        if (insertError) throw insertError

        await logAudit({
          userId: user.id,
          action: 'equipment_created',
          entityType: 'equipment',
          entityId: data.id,
          details: { name: payload.name }
        })
        setMsg('Equipment registered.')
      }

      setModalOpen(false)
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to save equipment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle={
          admin
            ? 'Manage ICT assets and equipment categories.'
            : 'View the ICT equipment inventory.'
        }
        actions={
          admin && activeTab === 'equipment' ? (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400"
            >
              Add Equipment
            </button>
          ) : null
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

      {visibleTabs.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setMsg('')
                setError('')
              }}
              className={
                'whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition ' +
                (activeTab === tab.id
                  ? 'bg-brandAmber-500/15 ring-1 ring-brandAmber-500/35 text-white'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'categories' && admin ? (
        <EquipmentCategoriesPanel
          onMessage={(text) => {
            setMsg(text)
            setError('')
            loadData()
          }}
          onError={(text) => {
            setError(text)
            setMsg('')
          }}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input
              className={`${filterInput} flex-1`}
              placeholder="Search by name, serial, or asset tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className={`${filterSelect} sm:min-w-[11rem]`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="borrowed">Borrowed</option>
              <option value="assigned">Assigned</option>
              <option value="under_maintenance">Under maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className={tableWrap}>
              <table className={dataTable}>
                <thead className="bg-black/20 text-left text-white/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Serial / Tag</th>
                    <th className="px-4 py-3 font-medium">Condition</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {admin && <th className="px-4 py-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={admin ? 6 : 5} className="px-4 py-8 text-center text-white/50">
                        Loading equipment…
                      </td>
                    </tr>
                  )}
                  {!loading && paginatedItems.length === 0 && (
                    <tr>
                      <td colSpan={admin ? 6 : 5} className="px-4 py-8 text-center text-white/50">
                        No equipment found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    paginatedItems.map((item) => (
                      <tr key={item.id} className="border-t border-white/10 text-white/85">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">{item.categories?.name || '—'}</td>
                        <td className="px-4 py-3 text-xs text-white/65">
                          {item.serial_number || '—'}
                          {item.asset_tag ? ` · ${item.asset_tag}` : ''}
                        </td>
                        <td className="px-4 py-3 capitalize">{item.condition}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        {admin && (
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!loading && totalCount > 0 && (
              <Pagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
            )}
          </div>
        </>
      )}

      {admin && (
        <Modal
          open={modalOpen}
          title={editing ? 'Edit Equipment' : 'Register Equipment'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">
                Cancel
              </button>
              <button type="submit" form="equipment-form" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
                {busy ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form id="equipment-form" onSubmit={handleSave} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <label className="text-xs text-white/70">Name</label>
              <input className={formFieldInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-white/70">Category</label>
              <select className={formFieldSelect} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/70">Serial number</label>
                <input className={formFieldInput} value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-white/70">Asset tag</label>
                <input className={formFieldInput} value={form.asset_tag} onChange={(e) => setForm({ ...form, asset_tag: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/70">Condition</label>
                <select className={formFieldSelect} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/70">Status</label>
                <select className={formFieldSelect} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="available">Available</option>
                  <option value="borrowed">Borrowed</option>
                  <option value="assigned">Assigned</option>
                  <option value="under_maintenance">Under maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/70">Notes</label>
              <textarea className={formFieldInput} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
