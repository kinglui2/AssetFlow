import { useCallback, useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal.jsx'
import Pagination from '../../components/ui/Pagination.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useClientPagination } from '../../hooks/useClientPagination.js'
import { logAudit } from '../../lib/audit.js'
import { dataTable, formFieldInput, tableWrap } from '../../lib/formStyles.js'
import { deleteCategory, fetchCategories, saveCategory } from '../../lib/settings.js'

export default function EquipmentCategoriesPanel({ onMessage, onError }) {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data, error } = await fetchCategories()
    if (error) onError(error.message)
    else setCategories(data ?? [])
    setLoading(false)
  }, [onError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const { page, setPage, paginatedItems, totalCount, pageSize } = useClientPagination(categories)

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
    onError('')
    try {
      const { data, error } = await saveCategory({ id: editing?.id, name, description })
      if (error) throw error

      await logAudit({
        userId: user.id,
        action: editing ? 'category_updated' : 'category_created',
        entityType: 'categories',
        entityId: data.id,
        details: { name: name.trim() }
      })

      setModalOpen(false)
      onMessage(editing ? 'Category updated.' : 'Category created.')
      await loadData()
    } catch (err) {
      onError(err.message || 'Failed to save category.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete category "${cat.name}"? Equipment using it may block deletion.`)) return
    setBusy(true)
    onError('')
    try {
      const { error } = await deleteCategory(cat.id)
      if (error) throw error
      await logAudit({
        userId: user.id,
        action: 'category_deleted',
        entityType: 'categories',
        entityId: cat.id,
        details: { name: cat.name }
      })
      onMessage('Category deleted.')
      await loadData()
    } catch (err) {
      onError(err.message || 'Failed to delete category.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400"
        >
          Add Category
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className={tableWrap}>
          <table className={dataTable}>
            <thead className="bg-black/20 text-left text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-white/50">
                    Loading categories…
                  </td>
                </tr>
              )}
              {!loading && paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-white/50">
                    No categories found.
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedItems.map((cat) => (
                  <tr key={cat.id} className="border-t border-white/10 text-white/85">
                    <td className="px-4 py-3 font-medium">{cat.name}</td>
                    <td className="px-4 py-3 text-white/65">{cat.description || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
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
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && totalCount > 0 && (
          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={setPage} />
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Category' : 'Add Category'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={busy}
              className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-white/70">Name</label>
            <input className={formFieldInput} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-white/70">Description</label>
            <input className={formFieldInput} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </form>
      </Modal>
    </>
  )
}
