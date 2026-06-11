import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { logAudit } from '../../../lib/audit.js'
import { formFieldInput } from '../../../lib/formStyles.js'
import { fetchAppSettings, updateAppSettings } from '../../../lib/settings.js'
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
  const [config, setConfig] = useState({
    default_borrow_days: 7,
    require_return_date: false,
    asset_tag_prefix: 'ICT',
    allow_staff_requests: true
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data, error } = await fetchAppSettings()
    if (error) onError(error.message)
    else if (data) {
      setConfig({
        default_borrow_days: data.default_borrow_days ?? 7,
        require_return_date: Boolean(data.require_return_date),
        asset_tag_prefix: data.asset_tag_prefix ?? 'ICT',
        allow_staff_requests: Boolean(data.allow_staff_requests ?? true)
      })
    }
    setLoading(false)
  }, [onError])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    <SettingsSection
      title="Asset Configuration"
      description="Defaults and policies for equipment registration and borrowing. Manage categories under Equipment → Categories."
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

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save Asset Configuration'}
        </button>
      </form>
    </SettingsSection>
  )
}
