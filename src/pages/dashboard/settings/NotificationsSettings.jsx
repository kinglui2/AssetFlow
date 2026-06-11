import { useEffect, useState } from 'react'
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

export default function NotificationsSettings({ onMessage, onError }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    notification_email: '',
    notify_new_borrow_requests: true,
    notify_overdue_returns: true,
    notify_assignment_changes: false
  })
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppSettings().then(({ data, error }) => {
      if (error) onError(error.message)
      else if (data) {
        setForm({
          notification_email: data.notification_email ?? '',
          notify_new_borrow_requests: Boolean(data.notify_new_borrow_requests),
          notify_overdue_returns: Boolean(data.notify_overdue_returns),
          notify_assignment_changes: Boolean(data.notify_assignment_changes)
        })
      }
      setLoading(false)
    })
  }, [onError])

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    onError('')
    try {
      const { error } = await updateAppSettings(form, user.id)
      if (error) throw error

      await logAudit({
        userId: user.id,
        action: 'settings_notifications_updated',
        entityType: 'app_settings'
      })
      onMessage('Notification preferences saved.')
    } catch (err) {
      onError(err.message || 'Failed to save notification settings.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <SettingsSection title="Notifications"><div className="text-sm text-white/50">Loading…</div></SettingsSection>

  return (
    <SettingsSection
      title="Notifications"
      description="Configure email alerts for ICT administrators. Email delivery requires SMTP setup in a future release."
    >
      <form onSubmit={handleSave} className="max-w-xl space-y-4">
        <div>
          <label className="text-xs text-white/70">Notification recipient email</label>
          <input
            type="email"
            className={formFieldInput}
            placeholder="ict@miremaschool.ac.ke"
            value={form.notification_email}
            onChange={(e) => setForm({ ...form, notification_email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <ToggleRow
            label="New borrow requests"
            description="Alert when staff submit equipment borrow requests."
            checked={form.notify_new_borrow_requests}
            onChange={(v) => setForm({ ...form, notify_new_borrow_requests: v })}
          />
          <ToggleRow
            label="Overdue returns"
            description="Alert when temporary borrowings pass their expected return date."
            checked={form.notify_overdue_returns}
            onChange={(v) => setForm({ ...form, notify_overdue_returns: v })}
          />
          <ToggleRow
            label="Assignment changes"
            description="Alert when long-term staff assignments are created or ended."
            checked={form.notify_assignment_changes}
            onChange={(v) => setForm({ ...form, notify_assignment_changes: v })}
          />
        </div>

        <button type="submit" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60">
          {busy ? 'Saving…' : 'Save Notifications'}
        </button>
      </form>
    </SettingsSection>
  )
}
