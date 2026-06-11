import { useState } from 'react'
import PageHeader from '../../components/ui/PageHeader.jsx'
import AssetConfigSettings from './settings/AssetConfigSettings.jsx'
import CompanySettings from './settings/CompanySettings.jsx'
import NotificationsSettings from './settings/NotificationsSettings.jsx'
import ProfileSettings from './settings/ProfileSettings.jsx'
import SecuritySettings from './settings/SecuritySettings.jsx'

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'company', label: 'Company Information' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'assets', label: 'Asset Configuration' }
]

export default function SettingsPage() {
  const [active, setActive] = useState('profile')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  function handleMessage(text) {
    setMsg(text)
    setError('')
  }

  function handleError(text) {
    setError(text)
  }

  return (
    <div>
      <PageHeader
        title="System Settings"
        subtitle="Manage your profile, organization details, notifications, security, and asset policies."
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

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 gap-2 overflow-x-auto pb-1 lg:w-56 lg:flex-col lg:overflow-visible lg:pb-0">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setActive(section.id)
                setMsg('')
                setError('')
              }}
              className={
                'whitespace-nowrap rounded-xl px-4 py-2.5 text-left text-sm transition ' +
                (active === section.id
                  ? 'bg-brandAmber-500/15 ring-1 ring-brandAmber-500/35 text-white'
                  : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white')
              }
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {active === 'profile' && <ProfileSettings onMessage={handleMessage} onError={handleError} />}
          {active === 'company' && <CompanySettings onMessage={handleMessage} onError={handleError} />}
          {active === 'notifications' && <NotificationsSettings onMessage={handleMessage} onError={handleError} />}
          {active === 'security' && <SecuritySettings onMessage={handleMessage} onError={handleError} />}
          {active === 'assets' && <AssetConfigSettings onMessage={handleMessage} onError={handleError} />}
        </div>
      </div>
    </div>
  )
}
