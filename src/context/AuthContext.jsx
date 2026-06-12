import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { logAudit } from '../lib/audit.js'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, department, is_active')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return

      setSession(data.session ?? null)

      if (data.session?.user) {
        try {
          const userProfile = await fetchProfile(data.session.user.id)
          if (mounted) setProfile(userProfile)
        } catch (err) {
          console.error('Failed to load profile:', err.message)
        }
      }

      if (mounted) setLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      setLoading(true)

      if (nextSession?.user) {
        try {
          const userProfile = await fetchProfile(nextSession.user.id)
          setProfile(userProfile)
        } catch (err) {
          console.error('Failed to load profile:', err.message)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      loading,
      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        const userProfile = await fetchProfile(data.user.id)
        if (!userProfile.is_active) {
          await supabase.auth.signOut()
          throw new Error('Your account has been deactivated. Contact the ICT administrator.')
        }

        setProfile(userProfile)
        await logAudit({
          userId: data.user.id,
          action: 'user_login',
          entityType: 'profiles',
          entityId: data.user.id
        })
        return data
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`
        })
        if (error) throw error
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setProfile(null)
        setSession(null)
      },
      async refreshProfile() {
        const userId = session?.user?.id
        if (!userId) return null
        const userProfile = await fetchProfile(userId)
        setProfile(userProfile)
        return userProfile
      },
      async updateOwnProfile(updates) {
        const userId = session?.user?.id
        if (!userId) throw new Error('Not signed in')

        const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
        if (error) throw error
        setProfile(data)
        return data
      },
      async changePassword(newPassword) {
        const { data, error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
        return data
      }
    }),
    [session, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
