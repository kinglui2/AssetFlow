import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { logAudit } from '../../../lib/audit.js'
import { formFieldInput } from '../../../lib/formStyles.js'
import SettingsSection from './SettingsSection.jsx'

export default function SecuritySettings({ onMessage, onError }) {
  const { user, changePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    onError('')

    if (password.length < 6) {
      onError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      onError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      await changePassword(password)
      await logAudit({
        userId: user.id,
        action: 'password_changed',
        entityType: 'profiles',
        entityId: user.id
      })
      setPassword('')
      setConfirm('')
      onMessage('Password updated successfully.')
    } catch (err) {
      onError(err.message || 'Failed to update password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingsSection
      title="Security"
      description="Change your administrator account password."
    >
      <form onSubmit={handleSave} className="max-w-xl space-y-4">
        <div>
          <label className="text-xs text-white/70">New password</label>
          <input
            type="password"
            className={formFieldInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="text-xs text-white/70">Confirm new password</label>
          <input
            type="password"
            className={formFieldInput}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            required
          />
        </div>
        <button type="submit" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60">
          {busy ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </SettingsSection>
  )
}
