import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  function validate() {
    if (!name.trim()) return 'Full name is required.'
    if (!email.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (password !== confirm) return 'Passwords do not match.'
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
      const { session } = await signUp({ email: email.trim(), password, fullName: name.trim() })

      if (session) {
        navigate('/app/dashboard', { replace: true })
        return
      }

      setMsg('Account created. Check your email to confirm your address, then sign in.')
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register to borrow and manage ICT equipment."
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
          <label className="text-xs text-white/70">Full name</label>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-brandAmber-500/40"
            placeholder="e.g., Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label className="text-xs text-white/70">Email</label>
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-brandAmber-500/40"
            placeholder="your-name@miremaschool.ac.ke"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label className="text-xs text-white/70">Password</label>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-brandAmber-500/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="text-xs text-white/70">Confirm password</label>
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-brandAmber-500/40"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brandAmber-500 px-4 py-3 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Sign up'}
        </button>

        <div className="text-sm text-white/70">
          Already have an account?{' '}
          <Link to="/login" className="hover:text-brandAmber-300">Login</Link>
        </div>
      </form>
    </AuthShell>
  )
}
