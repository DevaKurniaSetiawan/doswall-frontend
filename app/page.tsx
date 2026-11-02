'use client'

import {
  addAnnouncement,
  addToQueue,
  changePassword,
  checkTokenStatus,
  createUser,
  deleteAnnouncement,
  deleteUser,
  getAllUsers,
  getAnnouncements,
  getApiUrl,
  getLocationSuggestions,
  getQueue,
  getRestrictList,
  login as loginRequest,
  removeFromQueue,
  requestPasswordReset,
  toggleRestrict,
  updateAnnouncement,
  updateMyStatus,
  updateUser,
  type Announcement,
  type DoswallUser,
  type LocationSuggestion,
  type QueueItem
} from '@/lib/doswall-api'
import {
  Activity, Bell,
  BookOpen,
  CheckCircle2,
  CircleHelp, Eye, EyeOff, LayoutDashboard, ListOrdered,
  LockKeyhole, LogOut, Mail, MapPin, Menu, Pencil, Plus, RefreshCw, Search,
  Settings, ShieldCheck, ShieldOff, Trash2, TriangleAlert,
  UserRoundCog, Users, Wifi, X
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Brand colors: primary #003d82, gold #c8a951, bg #f0f4fb ─────────────────
const API_URL = getApiUrl()
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard, roles: ['user', 'admin', 'superadmin'] },
  { label: 'Status Wall', icon: Activity, roles: ['user', 'admin', 'superadmin'] },
  { label: 'Announcements', icon: Bell, roles: ['user', 'admin', 'superadmin'] },
  { label: 'Users', icon: Users, roles: ['admin', 'superadmin'] },
  { label: 'Activity Log', icon: Activity, roles: ['admin', 'superadmin'] },
  { label: 'Settings', icon: Settings, roles: ['user', 'admin', 'superadmin'] },
  { label: 'Help Center', icon: CircleHelp, roles: ['user', 'admin', 'superadmin'] },
]

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Spinner() {
  return <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#003d82] border-t-transparent" />
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-12 text-center text-sm text-slate-400">{text}</p>
}

function ErrBanner({ msg, onDismiss }: { msg: string; onDismiss?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <TriangleAlert size={15} className="mt-0.5 shrink-0" />
      <span className="flex-1">{msg}</span>
      {onDismiss && <button onClick={onDismiss} className="text-red-400 hover:text-red-700"><X size={14} /></button>}
    </div>
  )
}

function OkBanner({ msg, onDismiss }: { msg: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
      <span className="flex-1">{msg}</span>
      {onDismiss && <button onClick={onDismiss} className="text-emerald-400 hover:text-emerald-700"><X size={14} /></button>}
    </div>
  )
}

function PageShell({ eyebrow, title, description, action, onAction, children }: {
  eyebrow: string; title: string; description?: string
  action?: string; onAction?: () => void; children: React.ReactNode
}) {
  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#003d82]/50">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {action && onAction && (
          <button
            onClick={onAction}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#003d82] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#002d62]"
          >
            <Plus size={15} />{action}
          </button>
        )}
      </div>
      {children}
    </>
  )
}

// ─── UNNES logo ───────────────────────────────────────────────────────────────

function UnnesLogo({ size = 40, light = false }: { size?: number; light?: boolean }) {
  if (light) {
    return (
      <div className="shrink-0 overflow-hidden rounded-full bg-white p-0.5" style={{ width: size, height: size }}>
        <img src={`${BASE_PATH}/unnes-logo.png`} alt="UNNES logo" className="h-full w-full object-contain" />
      </div>
    )
  }
  return <img src={`${BASE_PATH}/unnes-logo.png`} alt="UNNES logo" className="shrink-0 object-contain" style={{ width: size, height: size }} />
}

function Brand({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  return (
    <div className="flex items-center gap-3">
      <UnnesLogo size={40} light={variant === 'light'} />
      <div>
        <p className={`text-[17px] font-bold leading-none tracking-tight ${variant === 'light' ? 'text-white' : 'text-[#172033]'}`}>Doswall</p>
        <p className={`mt-0.5 text-[10px] uppercase tracking-[.2em] ${variant === 'light' ? 'text-white/60' : 'text-slate-400'}`}>Universitas Negeri Semarang</p>
      </div>
    </div>
  )
}

// ─── Session storage key ─────────────────────────────────────────────────────
const SESSION_KEY = 'doswall_session'

// ─── Root page ────────────────────────────────────────────────────────────────

export default function Page() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [hydrated, setHydrated] = useState(false)   // prevents flash of login
  const [active, setActive] = useState('Dashboard')
  const [role, setRole] = useState('user')
  const [currentUser, setCurrentUser] = useState<DoswallUser | null>(null)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [menu, setMenu] = useState(false)
  const [annCount, setAnnCount] = useState(0)

  // ── Restore session from localStorage on first mount ──────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) {
        const { user, role: savedRole } = JSON.parse(raw) as { user: DoswallUser; role: string }
        if (user && savedRole) {
          setCurrentUser(user)
          setRole(savedRole)
          setLoggedIn(true)
        }
      }
    } catch {
      // corrupt storage — ignore, user will log in fresh
    }
    setHydrated(true)
  }, [])

  async function handleLogin(email: string, password: string) {
    setAuthLoading(true); setAuthError('')
    try {
      const result = await loginRequest(email, password)
      const user = (result.user || result.data || result) as DoswallUser
      const r = String(user.role || 'user').toLowerCase()
      const safeRole = ['user', 'admin', 'superadmin'].includes(r) ? r : 'user'
      setCurrentUser(user)
      setRole(safeRole)
      setLoggedIn(true)
      // persist so refresh doesn't log out
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, role: safeRole }))
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setAuthLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    setLoggedIn(false); setCurrentUser(null); setRole('user'); setActive('Dashboard')
  }

  // Show nothing until we've checked localStorage (avoids login flash on refresh)
  if (!hydrated) return null

  if (!loggedIn) {
    return (
      <Login
        onLogin={handleLogin}
        onReset={async (email) => { await requestPasswordReset(email) }}
        loading={authLoading}
        error={authError}
      />
    )
  }

  function persistUser(user: DoswallUser) {
    setCurrentUser(user)
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ user, role })) } catch { }
  }

  const allowedNav = nav.filter((item) => item.roles.includes(role))
  const displayName = currentUser?.name || currentUser?.email?.split('@')[0] || role
  const uid = currentUser?.user_id ?? ''
  const token = currentUser?.token ?? ''

  return (
    <main className="min-h-screen bg-[#f0f4fb] text-[#172033]">
      <div className="flex min-h-screen">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className={`fixed inset-y-0 left-0 z-30 flex w-[256px] flex-col bg-[#003d82] text-white transition-transform lg:static lg:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-6">
            <Brand variant="light" />
            <button aria-label="Close menu" onClick={() => setMenu(false)} className="lg:hidden"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[.2em] text-white/40">Workspace</p>
            <nav className="mt-3 space-y-1">
              {allowedNav.filter(n => !['Settings', 'Help Center'].includes(n.label)).map(({ label, icon: Icon }) => (
                <NavItem key={label} label={label} Icon={Icon} active={active}
                  badge={label === 'Announcements' ? annCount : 0}
                  onClick={() => { setActive(label); setMenu(false) }} />
              ))}
            </nav>
            <p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-white/40">System</p>
            <nav className="mt-3 space-y-1">
              {allowedNav.filter(n => ['Settings', 'Help Center'].includes(n.label)).map(({ label, icon: Icon }) => (
                <NavItem key={label} label={label} Icon={Icon} active={active}
                  badge={0}
                  onClick={() => { setActive(label); setMenu(false) }} />
              ))}
            </nav>
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#c8a951] text-xs font-bold text-[#003d82]">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-[11px] capitalize text-white/50">{role === 'superadmin' ? 'Super Admin' : role}</p>
              </div>
              <button aria-label="Sign out" onClick={handleLogout} className="text-white/60 hover:text-white">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {menu && <button aria-label="Close overlay" onClick={() => setMenu(false)} className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden" />}

        {/* ── Main ────────────────────────────────────────────────────────── */}
        <section className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
            <button aria-label="Open menu" onClick={() => setMenu(true)} className="mb-5 rounded-lg p-2 text-slate-500 lg:hidden"><Menu size={21} /></button>
            {active === 'Dashboard' && <DashboardPage uid={uid} token={token} role={role} onNavigate={setActive} onAnnCountChange={setAnnCount} />}
            {active === 'Status Wall' && <StatusWallPage uid={uid} token={token} currentUser={currentUser} onUserUpdate={persistUser} />}
            {active === 'Announcements' && <AnnouncementsPage uid={uid} token={token} role={role} onCountChange={setAnnCount} />}
            {active === 'Users' && <UsersPage uid={uid} token={token} role={role} />}
            {active === 'Activity Log' && <ActivityLogPage uid={uid} token={token} />}
            {active === 'Settings' && <SettingsPage uid={uid} token={token} role={role} currentUser={currentUser} apiUrl={API_URL} />}
            {active === 'Help Center' && <HelpPage />}
          </div>
        </section>
      </div>
    </main>
  )
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────

function NavItem({ label, Icon, active, onClick, badge }: { label: string; Icon: any; active: string; onClick: () => void; badge: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === label ? 'bg-[#c8a951] text-[#003d82] shadow' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
    >
      <Icon size={18} strokeWidth={1.8} />
      {label}
      {badge > 0 && (
        <span className="ml-auto rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold">{badge}</span>
      )}
    </button>
  )
}

// ─── Auto-refresh hook ────────────────────────────────────────────────────────
/** Calls `fn` immediately and then every `intervalMs`. Cleans up on unmount. */
function useAutoRefresh(fn: () => void, intervalMs = 30000, deps: unknown[] = []) {
  useEffect(() => {
    fn()
    const id = setInterval(fn, intervalMs)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardPage({ uid, token, role, onNavigate, onAnnCountChange }: {
  uid: string | number; token: string; role: string
  onNavigate: (p: string) => void; onAnnCountChange: (n: number) => void
}) {
  const [users, setUsers] = useState<DoswallUser[]>([])
  const [anns, setAnns] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!uid || !token) return
    const isAdmin = role === 'admin' || role === 'superadmin'
    Promise.all([
      isAdmin ? getAllUsers(uid, token).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      getAnnouncements(uid, token).catch(() => ({ data: [] })),
    ]).then(([u, a]) => {
      setUsers(u.data || [])
      const aList = a.data || []
      setAnns(aList)
      onAnnCountChange(aList.length)
      setLoading(false)
    })
  }, [uid, token, role])

  useAutoRefresh(load, 30000, [load])

  const activeToday = users.filter(u => u.status === 1).length
  const totalUsers = users.length

  return (
    <>
      {/* Hero — portalberita.jpg, no extra text labels */}
      <section className="relative isolate mb-8 min-h-[190px] overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(0,61,130,.18)]">
        <img src={`${BASE_PATH}/portalberita.jpg`} alt="" aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#003d82]/90 via-[#003d82]/60 to-transparent" />
        <div className="relative flex min-h-[190px] max-w-lg flex-col justify-center px-8 py-8 text-white sm:px-10">
          <h2 className="text-2xl font-bold sm:text-3xl">Doswall Control Center</h2>
          <p className="mt-2 text-sm text-white/70">Monitor activity, users, and announcements in one place.</p>
        </div>
      </section>

      {/* Stats */}
      <h2 className="mb-4 text-sm font-bold uppercase tracking-[.15em] text-[#003d82]/50">Operational Summary</h2>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Total Users" value={role !== 'user' ? String(totalUsers) : '—'} onClick={() => role !== 'user' ? onNavigate('Users') : undefined} />
            <StatCard icon={Activity} label="Active Today" value={role !== 'user' ? String(activeToday) : '—'} onClick={() => role !== 'user' ? onNavigate('Users') : undefined} />
            <StatCard icon={Bell} label="Announcements" value={String(anns.length)} onClick={() => onNavigate('Announcements')} />
            <StatCard icon={Wifi} label="System Status" value="Online" />
          </div>

          {/* Recent announcements preview */}
          {anns.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">Recent Announcements</h3>
                <button onClick={() => onNavigate('Announcements')} className="text-xs font-semibold text-[#003d82]">View all</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {anns.slice(0, 3).map((a) => (
                  <div key={String(a.announcement_id)} className="rounded-xl border border-[#d0ddef] bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#003d82]">{a.creator_name || 'System'}</p>
                    <p className="mt-2 font-semibold leading-snug">{a.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active users preview (admin only) */}
          {role !== 'user' && users.filter(u => u.status === 1).length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">Currently Active</h3>
                <button onClick={() => onNavigate('Status Wall')} className="text-xs font-semibold text-[#003d82]">View wall</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {users.filter(u => u.status === 1).slice(0, 8).map(u => (
                  <div key={String(u.user_id)} className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-800">{u.name}</span>
                    {u.geotag && <span className="text-[10px] text-emerald-600">· {u.geotag}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

function StatCard({ icon: Icon, label, value, onClick }: { icon: any; label: string; value: string; onClick?: () => void }) {
  const base = 'rounded-xl border border-[#d0ddef] bg-white p-5 shadow-sm text-left transition'
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} hover:border-[#003d82]/40 hover:shadow-md`}>
      <StatInner Icon={Icon} label={label} value={value} />
    </button>
  ) : (
    <div className={base}>
      <StatInner Icon={Icon} label={label} value={value} />
    </div>
  )
}

function StatInner({ Icon, label, value }: any) {
  return (
    <>
      <div className="flex items-center justify-between">
        <Icon size={18} className="text-[#003d82]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#c8a951]" />
      </div>
      <p className="mt-4 text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#003d82]">{value}</p>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STATUS WALL PAGE ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function StatusWallPage({ uid, token, currentUser, onUserUpdate }: {
  uid: string | number; token: string; currentUser: DoswallUser | null
  onUserUpdate: (u: DoswallUser) => void
}) {
  const [status, setStatus] = useState(currentUser?.status ?? 0)
  const [notes, setNotes] = useState(String(currentUser?.notes || ''))
  const [geotag, setGeotag] = useState(String(currentUser?.geotag || ''))
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState('')
  const [err, setErr] = useState('')
  const [locating, setLocating] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])

  async function save() {
    setSaving(true); setErr(''); setOk('')
    try {
      await updateMyStatus(uid, token, { status, notes, geotag })
      onUserUpdate({ ...currentUser, status, notes, geotag })
      setOk('Status updated successfully.')
    } catch (e: any) {
      setErr(e.message || 'Failed to update status.')
    } finally {
      setSaving(false)
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) { setErr('Geolocation not supported by your browser.'); return }
    setLocating(true); setSuggestions([]); setErr('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await getLocationSuggestions(uid, token, pos.coords.latitude, pos.coords.longitude)
          setSuggestions(res.data || [])
        } catch (e: any) {
          setErr(e.message || 'Could not fetch location suggestions.')
        } finally {
          setLocating(false)
        }
      },
      () => { setErr('Location permission denied.'); setLocating(false) },
    )
  }

  return (
    <PageShell eyebrow="Daily Status" title="Status Wall" description="Update your attendance status, notes, and location.">
      <div className="mt-2 max-w-xl space-y-5">
        {err && <ErrBanner msg={err} onDismiss={() => setErr('')} />}
        {ok && <OkBanner msg={ok} onDismiss={() => setOk('')} />}

        {/* Status toggle */}
        <div className="rounded-xl border border-[#d0ddef] bg-white p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#003d82]/60">Attendance</p>
          <div className="flex gap-3">
            {[{ val: 1, label: 'Present', color: 'emerald' }, { val: 0, label: 'Absent', color: 'slate' }].map(({ val, label, color }) => (
              <button
                key={val}
                onClick={() => setStatus(val)}
                className={`flex-1 rounded-lg border-2 py-3 text-sm font-semibold transition ${status === val
                  ? val === 1 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-400 bg-slate-50 text-slate-700'
                  : 'border-[#d0ddef] text-slate-400 hover:border-slate-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-[#d0ddef] bg-white p-5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#003d82]/60">
            Notes <span className="ml-1 text-slate-400 normal-case">({notes.length}/75)</span>
          </label>
          <textarea
            value={notes}
            maxLength={75}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Short note about your work today…"
            className="mt-3 min-h-[80px] w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10"
          />
        </div>

        {/* Location */}
        <div className="rounded-xl border border-[#d0ddef] bg-white p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#003d82]/60">Location (Geotag)</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={geotag}
                onChange={(e) => setGeotag(e.target.value)}
                placeholder="Enter location name…"
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10"
              />
            </div>
            <button
              onClick={detectLocation}
              disabled={locating}
              title="Detect nearby locations"
              className="flex items-center gap-1.5 rounded-lg border border-[#003d82]/20 px-3 py-2 text-xs font-semibold text-[#003d82] transition hover:bg-[#003d82]/5 disabled:opacity-50"
            >
              {locating ? <Spinner /> : <MapPin size={14} />}
              {locating ? 'Locating…' : 'Detect'}
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setGeotag(s.name); setSuggestions([]) }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f0f4fb]"
                >
                  <MapPin size={12} className="text-[#003d82]" />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-[10px] text-slate-400">{Math.round(s.distance)} m</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#003d82] py-3 text-sm font-semibold text-white transition hover:bg-[#002d62] disabled:opacity-50"
        >
          {saving ? <Spinner /> : null}
          {saving ? 'Saving…' : 'Save Status'}
        </button>
      </div>
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ANNOUNCEMENTS PAGE ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function AnnouncementsPage({ uid, token, role, onCountChange }: {
  uid: string | number; token: string; role: string; onCountChange: (n: number) => void
}) {
  const isAdmin = role === 'admin' || role === 'superadmin'

  const [anns, setAnns] = useState<Announcement[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | 'queue' | null>(null)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [queueTarget, setQueueTarget] = useState<Announcement | null>(null)
  const [tab, setTab] = useState<'list' | 'queue'>('list')

  const load = useCallback(async () => {
    try {
      const [a, q] = await Promise.all([
        getAnnouncements(uid, token),
        isAdmin ? getQueue(uid, token).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ])
      const list = a.data || []
      setAnns(list)
      setQueue(q.data || [])
      onCountChange(list.length)
      setLoading(false)
    } catch (e: any) {
      setErr(e.message || 'Failed to load announcements.')
      setLoading(false)
    }
  }, [uid, token, isAdmin])

  useAutoRefresh(load, 30000, [load])

  async function handleDelete(id: string | number) {
    if (!confirm('Delete this announcement?')) return
    try {
      await deleteAnnouncement(uid, token, id)
      setOk('Announcement deleted.'); load()
    } catch (e: any) { setErr(e.message) }
  }

  async function handleQueueRemove(queueId: string | number) {
    try {
      await removeFromQueue(uid, token, queueId)
      setOk('Removed from queue.'); load()
    } catch (e: any) { setErr(e.message) }
  }

  return (
    <PageShell
      eyebrow="Broadcast" title="Announcements"
      description="Create and manage announcements for the organization."
      action={isAdmin ? 'New Announcement' : undefined}
      onAction={isAdmin ? () => { setEditTarget(null); setModal('add') } : undefined}
    >
      {err && <ErrBanner msg={err} onDismiss={() => setErr('')} />}
      {ok && <OkBanner msg={ok} onDismiss={() => setOk('')} />}

      {/* Tab switcher for admins */}
      {isAdmin && (
        <div className="mb-5 flex gap-1 rounded-xl border border-[#d0ddef] bg-white p-1 w-fit">
          {(['list', 'queue'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${tab === t ? 'bg-[#003d82] text-white' : 'text-slate-500 hover:text-[#003d82]'}`}>
              {t === 'list' ? 'All Announcements' : 'Display Queue'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : tab === 'list' ? (
        <>
          {anns.length === 0 ? <EmptyState text="No announcements yet." /> : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {anns.map((a) => {
                const canEdit = isAdmin || String(a.user_id) === String(uid)
                return (
                  <article key={String(a.announcement_id)} className="relative rounded-xl border border-[#d0ddef] bg-white p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#003d82]">{a.creator_name || 'System'}</p>
                        <h3 className="mt-1.5 font-bold leading-snug">{a.title}</h3>
                      </div>
                      {canEdit && (
                        <div className="flex shrink-0 gap-1">
                          {isAdmin && (
                            <button onClick={() => { setQueueTarget(a); setModal('queue') }}
                              title="Add to queue" className="rounded p-1.5 text-slate-400 hover:bg-[#f0f4fb] hover:text-[#003d82]">
                              <ListOrdered size={14} />
                            </button>
                          )}
                          <button onClick={() => { setEditTarget(a); setModal('edit') }}
                            title="Edit" className="rounded p-1.5 text-slate-400 hover:bg-[#f0f4fb] hover:text-[#003d82]">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(a.announcement_id!)}
                            title="Delete" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-500 line-clamp-3">{a.content}</p>
                    <p className="mt-3 text-[10px] text-slate-400">{a.created_at || ''}</p>
                  </article>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* Queue tab */
        <div className="overflow-hidden rounded-xl border border-[#d0ddef] bg-white">
          {queue.length === 0 ? <EmptyState text="Display queue is empty." /> : (
            <table className="w-full min-w-[500px] text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4 text-left">Order</th>
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">Duration</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={String(q.order)} className="border-t border-slate-100">
                    <td className="p-4 font-bold text-[#003d82]">{q.order}</td>
                    <td className="p-4">{q.title || q.announcement_id}</td>
                    <td className="p-4 text-slate-500">{q.duration}</td>
                    <td className="p-4">
                      <button onClick={() => handleQueueRemove(q.order!)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <AnnFormModal
          uid={uid} token={token}
          initial={modal === 'edit' ? editTarget : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); setOk(modal === 'add' ? 'Announcement published.' : 'Announcement updated.') }}
        />
      )}
      {modal === 'queue' && queueTarget && (
        <QueueModal
          uid={uid} token={token}
          announcement={queueTarget}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); setOk('Added to display queue.') }}
        />
      )}
    </PageShell>
  )
}

function AnnFormModal({ uid, token, initial, onClose, onSaved }: {
  uid: string | number; token: string; initial: Announcement | null
  onClose: () => void; onSaved: () => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [content, setContent] = useState(initial?.content || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = Boolean(initial)

  async function submit() {
    if (!title.trim() || !content.trim()) { setErr('Title and content are required.'); return }
    setSaving(true); setErr('')
    try {
      if (isEdit) {
        await updateAnnouncement(uid, token, initial!.announcement_id!, { title: title.trim(), content: content.trim() })
      } else {
        await addAnnouncement(uid, token, title.trim(), content.trim())
      }
      onSaved()
    } catch (e: any) { setErr(e.message || 'Failed to save.') } finally { setSaving(false) }
  }

  return (
    <Modal title={isEdit ? 'Edit Announcement' : 'New Announcement'} onClose={onClose}>
      {err && <ErrBanner msg={err} />}
      <label className="mt-4 block text-xs font-semibold text-slate-600">
        Title <span className="text-slate-400 normal-case">({title.length}/50)</span>
        <input value={title} maxLength={50} onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
          className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10" />
      </label>
      <label className="mt-4 block text-xs font-semibold text-slate-600">
        Content <span className="text-slate-400 normal-case">({content.length}/2500)</span>
        <textarea value={content} maxLength={2500} onChange={(e) => setContent(e.target.value)}
          placeholder="Write your announcement…"
          className="mt-2 min-h-[120px] w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10" />
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">Cancel</button>
        <button onClick={submit} disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#003d82] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#002d62] disabled:opacity-50">
          {saving && <Spinner />}{isEdit ? 'Save Changes' : 'Publish'}
        </button>
      </div>
    </Modal>
  )
}

function QueueModal({ uid, token, announcement, onClose, onSaved }: {
  uid: string | number; token: string; announcement: Announcement
  onClose: () => void; onSaved: () => void
}) {
  const [order, setOrder] = useState(1)
  const [duration, setDuration] = useState('30')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    setSaving(true); setErr('')
    try {
      await addToQueue(uid, token, announcement.announcement_id!, order, duration)
      onSaved()
    } catch (e: any) { setErr(e.message || 'Failed to add to queue.') } finally { setSaving(false) }
  }

  return (
    <Modal title="Add to Display Queue" onClose={onClose}>
      {err && <ErrBanner msg={err} />}
      <p className="mt-1 text-sm text-slate-500">{announcement.title}</p>
      <label className="mt-4 block text-xs font-semibold text-slate-600">
        Display Order
        <input type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value))}
          className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10" />
      </label>
      <label className="mt-4 block text-xs font-semibold text-slate-600">
        Duration (seconds)
        <input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10" />
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">Cancel</button>
        <button onClick={submit} disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#003d82] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#002d62] disabled:opacity-50">
          {saving && <Spinner />}Add to Queue
        </button>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── USERS PAGE ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function UsersPage({ uid, token, role }: { uid: string | number; token: string; role: string }) {
  const [users, setUsers] = useState<DoswallUser[]>([])
  const [restricted, setRestricted] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<DoswallUser | null>(null)
  const [tab, setTab] = useState<'users' | 'restrict'>('users')

  const load = useCallback(async () => {
    try {
      const [u, r] = await Promise.all([
        getAllUsers(uid, token),
        getRestrictList(uid, token).catch(() => ({ data: [] })),
      ])
      setUsers(u.data || [])
      setRestricted((r.data || []).map((x: any) => String(x.user_id)))
      setLoading(false)
    } catch (e: any) {
      setErr(e.message || 'Failed to load users.')
      setLoading(false)
    }
  }, [uid, token])

  useAutoRefresh(load, 30000, [load])

  async function handleDelete(targetId: string | number) {
    if (!confirm('Delete this user account?')) return
    try {
      await deleteUser(uid, token, targetId)
      setOk('User deleted.'); load()
    } catch (e: any) { setErr(e.message) }
  }

  async function handleToggleRestrict(targetId: string | number) {
    try {
      await toggleRestrict(uid, token, targetId)
      const sid = String(targetId)
      setRestricted(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid])
      setOk('Restrict display updated.')
    } catch (e: any) { setErr(e.message) }
  }

  const filtered = users.filter(u =>
    [u.name, u.email, u.role, u.geotag].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageShell
      eyebrow="Directory" title="Users"
      description="Manage accounts, roles, and display restrictions."
      action="Add User" onAction={() => { setEditTarget(null); setModal('add') }}
    >
      {err && <ErrBanner msg={err} onDismiss={() => setErr('')} />}
      {ok && <OkBanner msg={ok} onDismiss={() => setOk('')} />}

      <div className="mb-4 flex flex-wrap gap-2">
        {(['users', 'restrict'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${tab === t ? 'bg-[#003d82] text-white border-[#003d82]' : 'border-[#d0ddef] text-slate-500 hover:border-[#003d82]/40'}`}>
            {t === 'users' ? 'All Users' : 'Restrict Display'}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="h-9 w-48 rounded-lg border border-slate-200 pl-9 text-xs outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : tab === 'users' ? (
        <div className="overflow-hidden rounded-xl border border-[#d0ddef] bg-white">
          {filtered.length === 0 ? <EmptyState text="No users found." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Last Update</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={String(u.user_id)} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#003d82] text-xs font-bold text-white">
                            {String(u.name || u.email || '?').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === 'superadmin' ? 'bg-purple-50 text-purple-700' : u.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role === 'superadmin' ? 'Super Admin' : u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${u.status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.status === 1 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {u.status === 1 ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{u.geotag || '—'}</td>
                      <td className="p-4 text-xs text-slate-400">{u.last_update || '—'}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditTarget(u); setModal('edit') }}
                            title="Edit user" className="rounded p-1.5 text-slate-400 hover:bg-[#f0f4fb] hover:text-[#003d82]">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleToggleRestrict(u.user_id!)}
                            title={restricted.includes(String(u.user_id)) ? 'Remove from restrict' : 'Add to restrict'}
                            className={`rounded p-1.5 transition ${restricted.includes(String(u.user_id)) ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:bg-[#f0f4fb] hover:text-amber-500'}`}>
                            {restricted.includes(String(u.user_id)) ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                          </button>
                          <button onClick={() => handleDelete(u.user_id!)}
                            title="Delete user" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Restrict display list */
        <div className="rounded-xl border border-[#d0ddef] bg-white p-5">
          <p className="mb-4 text-sm text-slate-500">Users listed here are hidden from the public status wall display.</p>
          {restricted.length === 0 ? <EmptyState text="No users are restricted." /> : (
            <div className="space-y-2">
              {users.filter(u => restricted.includes(String(u.user_id))).map(u => (
                <div key={String(u.user_id)} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <button onClick={() => handleToggleRestrict(u.user_id!)}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition">
                    <ShieldOff size={13} /> Remove restriction
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <UserFormModal
          uid={uid} token={token}
          initial={modal === 'edit' ? editTarget : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); setOk(modal === 'add' ? 'User created.' : 'User updated.') }}
        />
      )}
    </PageShell>
  )
}

function UserFormModal({ uid, token, initial, onClose, onSaved }: {
  uid: string | number; token: string; initial: DoswallUser | null
  onClose: () => void; onSaved: () => void
}) {
  const isEdit = Boolean(initial)
  const [name, setName] = useState(initial?.name || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [password, setPassword] = useState('')
  const [userRole, setUserRole] = useState(initial?.role || 'user')
  const [status, setStatus] = useState(initial?.status ?? 0)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function submit() {
    if (!name.trim() || !email.trim()) { setErr('Name and email are required.'); return }
    if (!isEdit && !password) { setErr('Password is required for new users.'); return }
    setSaving(true); setErr('')
    try {
      if (isEdit) {
        const payload: any = { name: name.trim(), email: email.trim(), role: userRole, status }
        if (password) payload.password = password
        await updateUser(uid, token, initial!.user_id!, payload)
      } else {
        await createUser(uid, token, { name: name.trim(), email: email.trim(), password, role: userRole })
      }
      onSaved()
    } catch (e: any) { setErr(e.message || 'Failed to save.') } finally { setSaving(false) }
  }

  return (
    <Modal title={isEdit ? 'Edit User' : 'New User'} onClose={onClose}>
      {err && <ErrBanner msg={err} />}
      <div className="mt-4 space-y-4">
        <FieldText label="Name" value={name} onChange={setName} placeholder="Full name" />
        <FieldText label="Email" value={email} onChange={setEmail} placeholder="name@unnes.ac.id" type="email" />
        <div>
          <label className="block text-xs font-semibold text-slate-600">Password {isEdit && <span className="font-normal text-slate-400">(leave blank to keep)</span>}</label>
          <div className="relative mt-2">
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? '••••••••' : 'Set password'}
              className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-10 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600">Role</label>
          <select value={userRole} onChange={(e) => setUserRole(e.target.value)}
            className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10">
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        {isEdit && (
          <div>
            <label className="block text-xs font-semibold text-slate-600">Status</label>
            <select value={status} onChange={(e) => setStatus(Number(e.target.value))}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10">
              <option value={0}>Absent</option>
              <option value={1}>Present</option>
            </select>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">Cancel</button>
        <button onClick={submit} disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#003d82] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#002d62] disabled:opacity-50">
          {saving && <Spinner />}{isEdit ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ACTIVITY LOG PAGE ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ActivityLogPage({ uid, token }: { uid: string | number; token: string }) {
  const [users, setUsers] = useState<DoswallUser[]>([])
  const [anns, setAnns] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(() => {
    Promise.all([
      getAllUsers(uid, token).catch(() => ({ data: [] })),
      getAnnouncements(uid, token).catch(() => ({ data: [] })),
    ]).then(([u, a]) => {
      setUsers(u.data || [])
      setAnns(a.data || [])
      setLoading(false)
    }).catch((e) => { setErr(e.message); setLoading(false) })
  }, [uid, token])

  useAutoRefresh(load, 30000, [load])

  const entries = [
    ...users.filter(u => u.last_update).map(u => ({
      type: 'status' as const,
      label: `${u.name} updated status — ${u.status === 1 ? 'Present' : 'Absent'}${u.geotag ? ` · ${u.geotag}` : ''}`,
      time: u.last_update || '',
      sub: u.notes ? `"${u.notes}"` : undefined,
    })),
    ...anns.map(a => ({
      type: 'announcement' as const,
      label: `Announcement published: "${a.title}"`,
      time: a.created_at || '',
      sub: `by ${a.creator_name || 'unknown'}`,
    })),
  ].sort((a, b) => (b.time > a.time ? 1 : -1))

  return (
    <PageShell eyebrow="Audit Trail" title="Activity Log" description="Live activity from users and announcements.">
      {err && <ErrBanner msg={err} />}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : entries.length === 0 ? (
        <EmptyState text="No activity recorded yet." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#d0ddef] bg-white">
          {entries.slice(0, 50).map((e, i) => (
            <div key={i} className="flex gap-4 border-b border-slate-100 p-5 last:border-0">
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.type === 'status' ? 'bg-emerald-500' : 'bg-[#003d82]'}`} />
              <div>
                <p className="text-sm font-semibold">{e.label}</p>
                {e.sub && <p className="mt-0.5 text-xs italic text-slate-400">{e.sub}</p>}
                <p className="mt-0.5 text-xs text-slate-400">{e.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function SettingsPage({ uid, token, role, currentUser, apiUrl }: {
  uid: string | number; token: string; role: string
  currentUser: DoswallUser | null; apiUrl: string
}) {
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [tokenOk, setTokenOk] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function handleChangePw() {
    if (!oldPw || !newPw) { setErr('All password fields are required.'); return }
    if (newPw !== confirmPw) { setErr('New passwords do not match.'); return }
    if (newPw.length < 6) { setErr('New password must be at least 6 characters.'); return }
    setSaving(true); setErr(''); setOk('')
    try {
      await changePassword(uid, token, oldPw, newPw)
      setOk('Password changed successfully.'); setOldPw(''); setNewPw(''); setConfirmPw('')
    } catch (e: any) { setErr(e.message || 'Failed to change password.') } finally { setSaving(false) }
  }

  async function handleCheckToken() {
    setChecking(true)
    try {
      const res = await checkTokenStatus(uid, token)
      setTokenOk(res.tokenStatus)
    } catch { setTokenOk(false) } finally { setChecking(false) }
  }

  return (
    <PageShell eyebrow="Account" title="Settings" description="Manage your account and session.">
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Account info */}
        <section className="rounded-xl border border-[#d0ddef] bg-white p-6">
          <div className="flex items-center gap-3 mb-5">
            <UserRoundCog size={18} className="text-[#003d82]" />
            <h3 className="font-bold">Account Profile</h3>
          </div>
          <div className="space-y-3 text-sm">
            <Row label="Name" value={currentUser?.name || '—'} />
            <Row label="Email" value={currentUser?.email || '—'} />
            <Row label="Role" value={role === 'superadmin' ? 'Super Admin' : role} />
            <Row label="User ID" value={String(uid)} />
            <Row label="API" value={apiUrl} mono />
          </div>
        </section>

        {/* Session / token */}
        <section className="rounded-xl border border-[#d0ddef] bg-white p-6">
          <div className="flex items-center gap-3 mb-5">
            <LockKeyhole size={18} className="text-[#003d82]" />
            <h3 className="font-bold">Session</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">Tokens rotate automatically every midnight WIB. Verify your current session token here.</p>
          <button onClick={handleCheckToken} disabled={checking}
            className="flex items-center gap-2 rounded-lg border border-[#003d82]/20 px-4 py-2 text-sm font-semibold text-[#003d82] transition hover:bg-[#003d82]/5 disabled:opacity-50">
            {checking ? <Spinner /> : <RefreshCw size={14} />}
            {checking ? 'Checking…' : 'Verify Token'}
          </button>
          {tokenOk !== null && (
            <div className="mt-3">
              {tokenOk
                ? <OkBanner msg="Token is valid — session is active." />
                : <ErrBanner msg="Token is invalid — please sign in again." />}
            </div>
          )}
        </section>

        {/* Change password */}
        <section className="rounded-xl border border-[#d0ddef] bg-white p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck size={18} className="text-[#003d82]" />
            <h3 className="font-bold">Change Password</h3>
          </div>
          {err && <ErrBanner msg={err} onDismiss={() => setErr('')} />}
          {ok && <OkBanner msg={ok} onDismiss={() => setOk('')} />}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <PwField label="Current Password" value={oldPw} onChange={setOldPw} show={showOld} onToggle={() => setShowOld(v => !v)} />
            <PwField label="New Password" value={newPw} onChange={setNewPw} show={showNew} onToggle={() => setShowNew(v => !v)} />
            <PwField label="Confirm New" value={confirmPw} onChange={setConfirmPw} show={showNew} onToggle={() => setShowNew(v => !v)} />
          </div>
          <button onClick={handleChangePw} disabled={saving}
            className="mt-5 flex items-center gap-2 rounded-lg bg-[#003d82] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#002d62] disabled:opacity-50">
            {saving && <Spinner />}Update Password
          </button>
        </section>
      </div>
    </PageShell>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className={`text-right font-medium text-[#172033] ${mono ? 'break-all font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

function PwField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600">{label}</label>
      <div className="relative mt-2">
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-10 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10" />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── HELP PAGE ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function HelpPage() {
  const items = [
    { icon: BookOpen, title: 'Getting Started', text: 'Sign in with your UNNES institutional account. Your role determines which workspace features are available.' },
    { icon: Activity, title: 'Status Wall', text: 'Update your daily attendance status (Present/Absent), add a short note (max 75 chars), and set your location using GPS detection.' },
    { icon: Bell, title: 'Announcements', text: 'Admins can create, edit, and delete announcements. Announcements can be added to the display queue with a custom order and duration.' },
    { icon: Users, title: 'User Management', text: 'Admins can create, update, and delete user accounts. Use the Restrict Display tab to hide specific users from the public wall.' },
    { icon: LockKeyhole, title: 'Password & Security', text: 'Change your password from Settings using your current password. Tokens rotate automatically every midnight WIB.' },
    { icon: Mail, title: 'Forgot Password', text: 'On the login screen, click "Forgot your password?" to receive a 6-digit PIN via email. The PIN is valid for 10 minutes.' },
  ]
  return (
    <PageShell eyebrow="Support" title="Help Center" description="Quick guide to using the Doswall management system.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-[#d0ddef] bg-white p-5">
            <Icon size={20} className="text-[#003d82]" />
            <h3 className="mt-4 font-bold">{title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </PageShell>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SHARED MODAL SHELL ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#001830]/50 p-5" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button aria-label="Close" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Shared field components ──────────────────────────────────────────────────

function FieldText({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#003d82] focus:ring-2 focus:ring-[#003d82]/10" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function Login({ onLogin, onReset, loading, error }: {
  onLogin: (email: string, password: string) => Promise<void>
  onReset: (email: string) => Promise<void>
  loading: boolean; error: string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const canSubmit = mode === 'login' ? Boolean(email && password) : Boolean(email)

  return (
    <main className="relative min-h-screen overflow-hidden">
      <img src={`${BASE_PATH}/gerbangunnes.jpeg`} alt="" aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[center_30%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center gap-3 bg-gradient-to-b from-black/40 to-transparent px-6 py-5 sm:px-10 lg:px-14">
          <UnnesLogo size={42} light />
          <div>
            <p className="text-base font-bold leading-none text-white">Doswall</p>
            <p className="text-[10px] uppercase tracking-[.2em] text-white/55">UNNES Management</p>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-8 pt-4">
          <div className="w-full max-w-[400px]">
            <div className="mb-5 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,.6)] sm:text-3xl">
                {mode === 'login' ? 'Sign In to Doswall' : 'Reset Password'}
              </h1>
              <p className="mt-1.5 text-sm text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">
                {mode === 'login' ? 'Use your institutional account to continue.' : 'Enter your email to receive a PIN code.'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/40 bg-white/90 p-7 shadow-[0_8px_40px_rgba(0,0,0,.30)] backdrop-blur-lg">
              {mode === 'login' ? (
                <form onSubmit={(e) => { e.preventDefault(); if (canSubmit && !loading) void onLogin(email, password) }} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#003d82]">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@unnes.ac.id"
                        className="h-11 w-full rounded-lg border border-[#d0ddef] bg-[#f8fafd] pl-9 pr-3 text-sm outline-none transition focus:border-[#003d82] focus:bg-white focus:ring-2 focus:ring-[#003d82]/10" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#003d82]">Password</label>
                    <div className="relative">
                      <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input required type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-11 w-full rounded-lg border border-[#d0ddef] bg-[#f8fafd] pl-9 pr-11 text-sm outline-none transition focus:border-[#003d82] focus:bg-white focus:ring-2 focus:ring-[#003d82]/10" />
                      <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#003d82]">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                      <TriangleAlert size={13} className="mt-0.5 shrink-0" />{error}
                    </div>
                  )}
                  <button disabled={!canSubmit || loading}
                    className="h-11 w-full rounded-lg bg-[#003d82] text-sm font-semibold text-white transition hover:bg-[#002d62] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                    {loading ? 'Verifying…' : 'Sign In'}
                  </button>
                  <button type="button" onClick={() => setMode('reset')}
                    className="w-full text-center text-xs text-slate-400 hover:text-[#003d82] transition">
                    Forgot your password?
                  </button>
                </form>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); if (email) void onReset(email).then(() => setResetSent(true)) }} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#003d82]">Institutional Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@unnes.ac.id"
                        className="h-11 w-full rounded-lg border border-[#d0ddef] bg-[#f8fafd] pl-9 pr-3 text-sm outline-none transition focus:border-[#003d82] focus:bg-white focus:ring-2 focus:ring-[#003d82]/10" />
                    </div>
                  </div>
                  {resetSent ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      PIN sent — check your email inbox.
                    </div>
                  ) : (
                    <button disabled={!canSubmit}
                      className="h-11 w-full rounded-lg bg-[#003d82] text-sm font-semibold text-white transition hover:bg-[#002d62] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                      Send Reset PIN
                    </button>
                  )}
                  <button type="button" onClick={() => { setMode('login'); setResetSent(false) }}
                    className="w-full text-center text-xs text-slate-400 hover:text-[#003d82] transition">
                    ← Back to Sign In
                  </button>
                </form>
              )}
            </div>
            <p className="mt-5 text-center text-[11px] text-white/40">© 2026 Doswall · Universitas Negeri Semarang</p>
          </div>
        </div>
      </div>
    </main>
  )
}
