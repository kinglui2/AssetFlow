import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from './AuthShell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function validate() {
    if (!email.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
    return ''
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setMsg('')

    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setBusy(true)
    try {
      await resetPassword(email.trim())
      setMsg('If the account exists, you will receive a reset link shortly.')
    } catch (err) {
      setError(err.message || 'Unable to send reset email. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email and we'll send reset instructions."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}
        {msg && (
          <div className="rounded-xl border border-brandAmber-500/25 bg-brandAmber-500/10 px-4 py-3 text-sm text-brandAmber-200">
            {msg}
          </div>
        )}

        <div>
          <label className="text-xs text-white/70">Email</label>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-brandAmber-500/40"
            placeholder="ict.staff@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brandAmber-500 px-4 py-3 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60"
        >
          {busy ? 'Sending…' : 'Send reset link'}
        </button>

        <div className="text-sm text-white/70">
          Remembered your password?{' '}
          <Link to="/login" className="hover:text-brandAmber-300">Back to login</Link>
        </div>
      </form>
    </AuthShell>
  )
}
