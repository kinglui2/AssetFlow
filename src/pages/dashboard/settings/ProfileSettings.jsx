import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { logAudit } from '../../../lib/audit.js'
import { formFieldInput } from '../../../lib/formStyles.js'
import SettingsSection from './SettingsSection.jsx'

export default function ProfileSettings({ onMessage, onError }) {
  const { user, profile, updateOwnProfile } = useAuth()
  const [form, setForm] = useState({ fullName: '', department: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setForm({
      fullName: profile?.full_name ?? '',
      department: profile?.department ?? ''
    })
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    onError('')
    try {
      await updateOwnProfile({
        full_name: form.fullName.trim(),
        department: form.department.trim() || null
      })
      await logAudit({
        userId: user.id,
        action: 'profile_updated',
        entityType: 'profiles',
        entityId: user.id
      })
      onMessage('Profile updated successfully.')
    } catch (err) {
      onError(err.message || 'Failed to update profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingsSection
      title="Profile"
      description="Update your administrator display name and department."
    >
      <form onSubmit={handleSave} className="max-w-xl space-y-4">
        <div>
          <label className="text-xs text-white/70">Email</label>
          <input className={formFieldInput} value={profile?.email ?? ''} disabled />
        </div>
        <div>
          <label className="text-xs text-white/70">Full name</label>
          <input
            className={formFieldInput}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-white/70">Department</label>
          <input
            className={formFieldInput}
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
        </div>
        <div className="text-xs text-white/50 capitalize">Role: {profile?.role ?? '—'}</div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </SettingsSection>
  )
}
