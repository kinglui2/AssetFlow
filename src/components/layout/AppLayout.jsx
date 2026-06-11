import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import AssetflowRightRail from './AssetflowRightRail.jsx'
import { isAdmin, navItemsByRole } from '../../config/navigation.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
const SHOW_SUPPORT_RAIL = false

const SCHOOL_LOGO =
  'https://static.wixstatic.com/media/57fa13_baa64a5d85284931bdb412f4022c84db~mv2.jpg/v1/fill/w_284,h_284,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Mirema%20School%20Logo.jpg'

function SidebarContent({ collapsed, brand, navItems, profile, role, onCloseMobile, onToggleCollapse, onSignOut }) {
  return (
    <>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-brandAmber-500/20 ring-1 ring-brandAmber-500/35 grid place-items-center overflow-hidden">
            <img src={SCHOOL_LOGO} alt="Mirema School Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-wide text-white truncate">{brand.name}</div>
              <div className="text-xs text-white/60 truncate">{brand.subtitle}</div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="mt-4 w-full rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs text-white/80 md:hidden"
        >
          Close menu
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mt-4 w-full rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs text-white/80 hidden md:block"
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>

      <nav className="px-3 pb-3 flex-1 overflow-y-auto">
        <div className="text-xs uppercase tracking-wider text-white/50 px-3 pb-2">Modules</div>
        <div className="space-y-1">
          {navItems.map((it, idx) => {
            const showSection = !collapsed && it.section && navItems[idx - 1]?.section !== it.section

            return (
              <div key={it.to}>
                {showSection && (
                  <div className="px-3 pt-4 pb-2 text-xs uppercase tracking-wider text-brandAmber-300/80">
                    {it.section}
                  </div>
                )}
                <NavLink
                  to={it.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ' +
                    (isActive
                      ? 'bg-brandAmber-500/15 ring-1 ring-brandAmber-500/35 text-white'
                      : 'text-white/75 hover:text-white hover:bg-white/5')
                  }
                >
                  <span className="h-8 w-8 shrink-0 rounded-xl bg-brandAmber-500/10 ring-1 ring-brandAmber-500/25 grid place-items-center">
                    {it.icon}
                  </span>
                  {!collapsed && <span>{it.label}</span>}
                </NavLink>
              </div>
            )
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-white/10">
        {!collapsed && profile && (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
            <div className="text-white/90 font-medium truncate">{profile.full_name}</div>
            <div className="capitalize">{role}</div>
          </div>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-sm text-white/80"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400/90" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  )
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, profile, role } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const showSupportRail = !isAdmin(role)

  const brand = useMemo(
    () => ({
      name: 'ICT ASSET INVENTORY',
      subtitle: isAdmin(role) ? 'Administrator Console' : 'ICT Assets Management'
    }),
    [role]
  )

  const navItems = navItemsByRole[role] ?? navItemsByRole.staff

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileNavOpen])

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
          aria-label="Open navigation menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate">{brand.name}</div>
          <div className="text-xs text-white/60 truncate capitalize">{role} · {profile?.full_name}</div>
        </div>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className="flex">
        <aside
          className={
            'fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-white/10 bg-[#0a0a0a] backdrop-blur transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:shrink-0 md:translate-x-0 md:bg-black/25 md:supports-[backdrop-filter]:bg-black/20 ' +
            (mobileNavOpen ? 'translate-x-0' : '-translate-x-full') +
            (collapsed ? ' md:w-[88px]' : ' md:w-[280px]')
          }
        >
          <SidebarContent
            collapsed={collapsed}
            brand={brand}
            navItems={navItems}
            profile={profile}
            role={role}
            onCloseMobile={() => setMobileNavOpen(false)}
            onToggleCollapse={() => setCollapsed((v) => !v)}
            onSignOut={handleSignOut}
          />
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>

        {SHOW_SUPPORT_RAIL && showSupportRail && <AssetflowRightRail />}
      </div>
    </div>
  )
}
