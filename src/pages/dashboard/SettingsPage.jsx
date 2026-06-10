import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { logAudit } from '../../lib/audit.js'
import { supabase } from '../../lib/supabase.js'

export default function SettingsPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase.from('categories').select('*').order('name')
    if (fetchError) setError(fetchError.message)
    else setCategories(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setModalOpen(true)
  }

  function openEdit(cat) {
    setEditing(cat)
    setName(cat.name)
    setDescription(cat.description ?? '')
    setModalOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setError('')

    try {
      if (editing) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({ name: name.trim(), description: description.trim() || null })
          .eq('id', editing.id)
        if (updateError) throw updateError

        await logAudit({
          userId: user.id,
          action: 'category_updated',
          entityType: 'categories',
          entityId: editing.id,
          details: { name: name.trim() }
        })
        setMsg('Category updated.')
      } else {
        const { data, error: insertError } = await supabase
          .from('categories')
          .insert({ name: name.trim(), description: description.trim() || null })
          .select()
          .single()
        if (insertError) throw insertError

        await logAudit({
          userId: user.id,
          action: 'category_created',
          entityType: 'categories',
          entityId: data.id,
          details: { name: name.trim() }
        })
        setMsg('Category created.')
      }

      setModalOpen(false)
      await loadCategories()
    } catch (err) {
      setError(err.message || 'Failed to save category.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete category "${cat.name}"? Equipment using it may block deletion.`)) return

    setBusy(true)
    setError('')
    try {
      const { error: deleteError } = await supabase.from('categories').delete().eq('id', cat.id)
      if (deleteError) throw deleteError

      await logAudit({
        userId: user.id,
        action: 'category_deleted',
        entityType: 'categories',
        entityId: cat.id,
        details: { name: cat.name }
      })

      setMsg('Category deleted.')
      await loadCategories()
    } catch (err) {
      setError(err.message || 'Failed to delete category. It may be linked to equipment.')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-brandAmber-500/40'

  return (
    <div>
      <PageHeader
        title="System Settings"
        subtitle="Manage equipment categories and other administrator configuration."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400"
          >
            Add Category
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

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold text-white">Equipment Categories</h2>
        <p className="text-sm text-white/60 mt-1">Categories used when registering ICT equipment.</p>

        <div className="mt-4 space-y-2">
          {loading && <div className="text-sm text-white/50">Loading categories…</div>}
          {!loading &&
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-white">{cat.name}</div>
                  {cat.description && <div className="text-xs text-white/55 mt-1">{cat.description}</div>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(cat)}
                    className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Category' : 'Add Category'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">
              Cancel
            </button>
            <button type="submit" form="category-form" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-white/70">Name</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-white/70">Description</label>
            <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
