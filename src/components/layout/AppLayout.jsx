import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import AssetflowRightRail from './AssetflowRightRail.jsx'
import { isAdmin, navItemsByRole } from '../../config/navigation.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const SCHOOL_LOGO =
  'https://static.wixstatic.com/media/57fa13_baa64a5d85284931bdb412f4022c84db~mv2.jpg/v1/fill/w_284,h_284,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Mirema%20School%20Logo.jpg'

export default function AppLayout() {
  const navigate = useNavigate()
  const { signOut, profile, role } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const showSupportRail = !isAdmin(role)

  const brand = useMemo(
    () => ({
      name: 'ICT ASSET INVENTORY',
      subtitle: isAdmin(role) ? 'Administrator Console' : 'ICT Assets Management'
    }),
    [role]
  )

  const navItems = navItemsByRole[role] ?? navItemsByRole.staff

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside
          className={
            'sticky top-0 h-screen shrink-0 border-r border-white/10 bg-black/25 backdrop-blur supports-[backdrop-filter]:bg-black/20 flex flex-col ' +
            (collapsed ? 'w-[88px]' : 'w-[280px]')
          }
        >
          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brandAmber-500/20 ring-1 ring-brandAmber-500/35 grid place-items-center overflow-hidden">
                <img src={SCHOOL_LOGO} alt="Mirema School Logo" className="h-full w-full object-cover" />
              </div>
              {!collapsed && (
                <div>
                  <div className="text-sm font-semibold tracking-wide text-white">{brand.name}</div>
                  <div className="text-xs text-white/60">{brand.subtitle}</div>
                </div>
              )}
            </div>
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="mt-4 w-full rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs text-white/80"
            >
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>

          <nav className="px-3 pb-3 flex-1 overflow-y-auto">
            <div className="text-xs uppercase tracking-wider text-white/50 px-3 pb-2">Modules</div>
            <div className="space-y-1">
              {navItems.map((it, idx) => {
                const showSection =
                  !collapsed && it.section && navItems[idx - 1]?.section !== it.section

                return (
                  <div key={it.to}>
                    {showSection && (
                      <div className="px-3 pt-4 pb-2 text-xs uppercase tracking-wider text-brandAmber-300/80">
                        {it.section}
                      </div>
                    )}
                    <NavLink
                      to={it.to}
                      className={({ isActive }) =>
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ' +
                        (isActive
                          ? 'bg-brandAmber-500/15 ring-1 ring-brandAmber-500/35 text-white'
                          : 'text-white/75 hover:text-white hover:bg-white/5')
                      }
                    >
                      <span className="h-8 w-8 rounded-xl bg-brandAmber-500/10 ring-1 ring-brandAmber-500/25 grid place-items-center">
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
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-white/80"
            >
              <span className="h-2 w-2 rounded-full bg-rose-400/90" />
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-8 overflow-x-hidden min-w-0">
          <Outlet />
        </main>

        {showSupportRail && <AssetflowRightRail />}
      </div>
    </div>
  )
}
