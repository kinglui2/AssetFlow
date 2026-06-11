import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext.jsx'
import { logAudit } from '../../../lib/audit.js'
import { formFieldInput } from '../../../lib/formStyles.js'
import { fetchAppSettings, updateAppSettings } from '../../../lib/settings.js'
import SettingsSection from './SettingsSection.jsx'

export default function CompanySettings({ onMessage, onError }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    company_name: '',
    company_tagline: '',
    company_email: '',
    company_phone: '',
    company_address: ''
  })
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppSettings().then(({ data, error }) => {
      if (error) onError(error.message)
      else if (data) {
        setForm({
          company_name: data.company_name ?? '',
          company_tagline: data.company_tagline ?? '',
          company_email: data.company_email ?? '',
          company_phone: data.company_phone ?? '',
          company_address: data.company_address ?? ''
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
      const { error } = await updateAppSettings(
        {
          company_name: form.company_name.trim(),
          company_tagline: form.company_tagline.trim() || null,
          company_email: form.company_email.trim() || null,
          company_phone: form.company_phone.trim() || null,
          company_address: form.company_address.trim() || null
        },
        user.id
      )
      if (error) throw error

      await logAudit({
        userId: user.id,
        action: 'settings_company_updated',
        entityType: 'app_settings',
        details: { company_name: form.company_name.trim() }
      })
      onMessage('Company information saved.')
    } catch (err) {
      onError(err.message || 'Failed to save company information.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <SettingsSection title="Company Information"><div className="text-sm text-white/50">Loading…</div></SettingsSection>

  return (
    <SettingsSection
      title="Company Information"
      description="Organization details shown across the system and used on reports."
    >
      <form onSubmit={handleSave} className="max-w-xl space-y-4">
        <div>
          <label className="text-xs text-white/70">Organization name</label>
          <input className={formFieldInput} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
        </div>
        <div>
          <label className="text-xs text-white/70">Tagline</label>
          <input className={formFieldInput} value={form.company_tagline} onChange={(e) => setForm({ ...form, company_tagline: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-white/70">Contact email</label>
            <input type="email" className={formFieldInput} value={form.company_email} onChange={(e) => setForm({ ...form, company_email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-white/70">Contact phone</label>
            <input className={formFieldInput} value={form.company_phone} onChange={(e) => setForm({ ...form, company_phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-xs text-white/70">Address</label>
          <textarea className={formFieldInput} rows={3} value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })} />
        </div>
        <button type="submit" disabled={busy} className="rounded-xl bg-brandAmber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60">
          {busy ? 'Saving…' : 'Save Company Info'}
        </button>
      </form>
    </SettingsSection>
  )
}
