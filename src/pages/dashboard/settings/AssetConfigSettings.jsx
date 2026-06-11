import { useCallback, useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { useAuth } from '../../../context/AuthContext.jsx'
import { logAudit } from '../../../lib/audit.js'
import { formFieldInput } from '../../../lib/formStyles.js'
import { deleteCategory, fetchAppSettings, fetchCategories, saveCategory, updateAppSettings } from '../../../lib/settings.js'
import SettingsSection from './SettingsSection.jsx'

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
      <div>
        <div className="text-sm text-white/85">{label}</div>
        {description && <div className="text-xs text-white/55 mt-1">{description}</div>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border border-white/20 bg-white/5 accent-brandAmber-500"
      />
    </label>
  )
}

export default function AssetConfigSettings({ onMessage, onError }) {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [config, setConfig] = useState({
    default_borrow_days: 7,
    require_return_date: false,
    asset_tag_prefix: 'ICT',
    allow_staff_requests: true
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [catResult, settingsResult] = await Promise.all([fetchCategories(), fetchAppSettings()])
    if (catResult.error) onError(catResult.error.message)
    else setCategories(catResult.data ?? [])
    if (settingsResult.error) onError(settingsResult.error.message)
    else if (settingsResult.data) {
      setConfig({
        default_borrow_days: settingsResult.data.default_borrow_days ?? 7,
        require_return_date: Boolean(settingsResult.data.require_return_date),
        asset_tag_prefix: settingsResult.data.asset_tag_prefix ?? 'ICT',
        allow_staff_requests: Boolean(settingsResult.data.allow_staff_requests ?? true)
      })
    }
    setLoading(false)
  }, [onError])

  useEffect(() => {
    loadData()
  }, [loadData])

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

  async function handleSaveCategory(e) {
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

  async function handleSaveConfig(e) {
    e.preventDefault()
    setBusy(true)
    onError('')
    try {
      const { error } = await updateAppSettings(
        {
          default_borrow_days: Number(config.default_borrow_days),
          require_return_date: config.require_return_date,
          asset_tag_prefix: config.asset_tag_prefix.trim() || 'ICT',
          allow_staff_requests: config.allow_staff_requests
        },
        user.id
      )
      if (error) throw error

      await logAudit({
        userId: user.id,
        action: 'settings_asset_config_updated',
        entityType: 'app_settings'
      })
      onMessage('Asset configuration saved.')
    } catch (err) {
      onError(err.message || 'Failed to save asset configuration.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <SettingsSection title="Asset Configuration">
        <div className="text-sm text-white/50">Loading…</div>
      </SettingsSection>
    )
  }

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Asset Configuration"
        description="Defaults and policies for equipment registration and borrowing."
      >
        <form onSubmit={handleSaveConfig} className="max-w-xl space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/70">Default borrow period (days)</label>
              <input
                type="number"
                min={1}
                className={formFieldInput}
                value={config.default_borrow_days}
                onChange={(e) => setConfig({ ...config, default_borrow_days: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-white/70">Asset tag prefix</label>
              <input
                className={formFieldInput}
                value={config.asset_tag_prefix}
                onChange={(e) => setConfig({ ...config, asset_tag_prefix: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <ToggleRow
              label="Require expected return date"
              description="Officers must set a return date when issuing temporary equipment."
              checked={config.require_return_date}
              onChange={(v) => setConfig({ ...config, require_return_date: v })}
            />
            <ToggleRow
              label="Allow staff borrow requests"
              description="Staff users can submit borrow requests from their dashboard."
              checked={config.allow_staff_requests}
              onChange={(v) => setConfig({ ...config, allow_staff_requests: v })}
            />
          </div>

          <button type="submit" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60">
            {busy ? 'Saving…' : 'Save Asset Configuration'}
          </button>
        </form>
      </SettingsSection>

      <SettingsSection
        title="Equipment Categories"
        description="Categories used when registering ICT equipment."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400"
          >
            Add Category
          </button>
        }
      >
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm font-medium text-white">{cat.name}</div>
                {cat.description && <div className="text-xs text-white/55 mt-1">{cat.description}</div>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(cat)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10">
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
      </SettingsSection>

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
        <form id="category-form" onSubmit={handleSaveCategory} className="space-y-4">
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
    </div>
  )
}
