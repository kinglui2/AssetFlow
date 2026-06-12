import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (user) navigate('/app/dashboard', { replace: true })
  }, [user, navigate])

  const fieldErrors = useMemo(() => {
    const e = {}
    if (!email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.'

    if (!password) e.password = 'Password is required.'
    return e
  }, [email, password])

  const canSubmit = useMemo(() => {
    return !fieldErrors.email && !fieldErrors.password
  }, [fieldErrors])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    const v = !canSubmit ? (fieldErrors.email || fieldErrors.password || 'Check your details.') : ''
    if (v) {
      setError(v)
      return
    }

    setBusy(true)
    try {
      await signIn(email.trim(), password)
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in. Check your credentials and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Access ICT ASSET INVENTORY to manage ICT assets.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs text-white/70">Email</label>
          <input
            className={
              'mt-2 w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-brandAmber-500/40 ' +
              (fieldErrors.email ? 'border-rose-500/40' : 'border-white/10')
            }
            placeholder="yourname@miremaschool.ac.ke"
            value={email}
            disabled={busy}
            aria-invalid={Boolean(fieldErrors.email)}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {fieldErrors.email && <div className="mt-1 text-xs text-rose-200/90">{fieldErrors.email}</div>}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <label className="text-xs text-white/70">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs text-white/60 hover:text-white"
              aria-pressed={showPassword}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className="relative mt-2">
            <input
              type={showPassword ? 'text' : 'password'}
              className={
                'w-full rounded-xl border bg-white/5 px-4 py-3 pr-20 text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-brandAmber-500/40 ' +
                (fieldErrors.password ? 'border-rose-500/40' : 'border-white/10')
              }
              value={password}
              disabled={busy}
              aria-invalid={Boolean(fieldErrors.password)}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
              enter your credentials
            </div>
          </div>

          {fieldErrors.password && <div className="mt-1 text-xs text-rose-200/90">{fieldErrors.password}</div>}
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-white/70 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              disabled={busy}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border border-white/20 bg-white/5 accent-brandAmber-500"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm text-white/70 hover:text-brandAmber-300">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={busy || !canSubmit}
          className="w-full rounded-xl bg-brandAmber-500 px-4 py-3 text-sm font-semibold text-black hover:bg-brandAmber-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? 'Signing in…' : 'Login'}
        </button>

        <div className="text-sm text-white/70">
          Need an account? Contact your ICT administrator to request access.
        </div>
      </form>
    </AuthShell>
  )
}
