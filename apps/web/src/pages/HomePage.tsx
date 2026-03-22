import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leaguesApi, type League } from '../api/leagues'
import { standingsApi, type LeagueStanding } from '../api/standings'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import './HomePage.css'

const AVATAR_COLORS = [
  { bg: 'rgba(232,201,109,0.15)', color: '#e8c96d' },
  { bg: 'rgba(176,184,200,0.12)', color: '#b0b8c8' },
  { bg: 'rgba(205,127,50,0.15)', color: '#cd7f32' },
  { bg: 'rgba(94,160,220,0.10)', color: '#5ea0dc' },
  { bg: 'rgba(120,180,120,0.10)', color: '#78b478' },
  { bg: 'rgba(200,100,150,0.10)', color: '#c86496' },
  { bg: 'rgba(180,120,220,0.10)', color: '#b478dc' },
  { bg: 'rgba(220,160,80,0.10)', color: '#dca050' },
]

const RANK_CLASSES = ['g', 's', 'b']
const PODIUM_CLASSES = ['g', 's', 'b', '']

function initials(pseudo: string) {
  return pseudo
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function formatGap(gap: number) {
  if (gap === 0) return '0'
  return gap > 0 ? `+${gap.toLocaleString('fr-FR')}` : `−${Math.abs(gap).toLocaleString('fr-FR')}`
}

// ── Mock race calendar (à connecter à l'API quand disponible) ──
const MOCK_RACES = [
  { id: 1, name: "Flèche Wallonne", date: "En cours · Ardennes", mult: '×1,5', multClass: 'x15', status: 'todo' as const, dot: 'live' as const },
  { id: 2, name: "Liège–Bastogne–Liège", date: "27 avril · Monument", mult: '×2', multClass: 'x2', status: 'done' as const, dot: 'upcoming' as const },
  { id: 3, name: "Giro d'Italia", date: "9 mai · Grand Tour", mult: 'GT', multClass: 'x1', status: 'todo' as const, dot: 'upcoming' as const },
  { id: 4, name: "Paris-Roubaix", date: "13 avril · Terminé", mult: '×2', multClass: 'x2', status: 'locked' as const, dot: 'done' as const },
]

export default function HomePage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [activeLeague, setActiveLeague] = useState<League | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [leagueName, setLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: myLeagues } = useQuery({
    queryKey: ['my-leagues'],
    queryFn: () => leaguesApi.myLeagues().then((r) => r.data.data.leagues),
  })

  const { data: leagueStandings } = useQuery({
    queryKey: ['standings', 'league', activeLeague?.id],
    queryFn: () => standingsApi.league(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  // Auto-select first league
  useEffect(() => {
    if (myLeagues && myLeagues.length > 0 && !activeLeague) {
      setActiveLeague(myLeagues[0])
    }
  }, [myLeagues, activeLeague])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const createMutation = useMutation({
    mutationFn: () => leaguesApi.create(leagueName),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-leagues'] })
      setActiveLeague(res.data.data.league)
      setLeagueName('')
      setShowCreateForm(false)
      setShowDropdown(false)
    },
  })

  const joinMutation = useMutation({
    mutationFn: () => leaguesApi.join(joinCode),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-leagues'] })
      setActiveLeague(res.data.data.league)
      setJoinCode('')
      setShowJoinForm(false)
      setShowDropdown(false)
    },
  })

  async function handleLogout() {
    await authApi.logout().catch(() => {})
    clearAuth()
    navigate('/login')
  }

  function copyCode() {
    if (!activeLeague) return
    navigator.clipboard.writeText(activeLeague.code).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 1500)
    })
  }

  // ── Computed standings data ──────────────────────
  // Use mock races for the shortcut banner (real API races shown when connected)
  const mockLiveRace = MOCK_RACES.find((r) => r.dot === 'live')
  const mockNextRace = mockLiveRace ?? MOCK_RACES.find((r) => r.dot === 'upcoming')

  const myStanding: LeagueStanding | undefined = leagueStandings?.find(
    (s) => s.userId === user?.id,
  )
  const leaderStanding = leagueStandings?.[0]
  const maxPts = leaderStanding?.totalPoints ?? 1
  const hiddenCount = leagueStandings && leagueStandings.length > 8 ? leagueStandings.length - 8 : 0

  const hasLeagues = myLeagues && myLeagues.length > 0

  // ── No leagues — empty state ─────────────────────
  if (myLeagues !== undefined && !hasLeagues) {
    return (
      <div className="d layout">
        <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-logo">
            <div className="logo-txt">BCF</div>
          </div>
          <div className="sidebar-footer">
            <div className="me-avatar">{initials(user?.pseudo ?? '?')}</div>
            <div className="me-info">
              <div className="me-name">{user?.pseudo}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
              <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
        <div className="main" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="mobile-header">
            <button className="hamburger" onClick={() => setSidebarOpen((v) => !v)}>
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="mobile-logo">BCF</div>
            <div className="mobile-avatar">{initials(user?.pseudo ?? '?')}</div>
          </div>
          <div className="empty-layout" style={{ flex: 1 }}>
          <div className="empty-card">
            <div className="empty-title">Bienvenue dans BCF</div>
            <div className="empty-sub">Crée ta première ligue ou rejoins celle d'un ami avec son code d'invitation.</div>
            <div className="empty-actions">
              {showCreateForm ? (
                <>
                  <input
                    className="empty-input"
                    placeholder="Nom de ta ligue"
                    value={leagueName}
                    onChange={(e) => setLeagueName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && leagueName && createMutation.mutate()}
                    autoFocus
                  />
                  {createMutation.isError && (
                    <div className="empty-error">Impossible de créer la ligue.</div>
                  )}
                  <button
                    className="btn-primary"
                    onClick={() => createMutation.mutate()}
                    disabled={!leagueName || createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Création…' : 'Créer la ligue'}
                  </button>
                  <button className="btn-ghost-sm" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </button>
                </>
              ) : showJoinForm ? (
                <>
                  <input
                    className="empty-input"
                    placeholder="Code d'invitation (ex: FDG-2026)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && joinCode && joinMutation.mutate()}
                    autoFocus
                  />
                  {joinMutation.isError && (
                    <div className="empty-error">Code invalide ou ligue introuvable.</div>
                  )}
                  <button
                    className="btn-primary"
                    onClick={() => joinMutation.mutate()}
                    disabled={!joinCode || joinMutation.isPending}
                  >
                    {joinMutation.isPending ? 'Rejoindre…' : 'Rejoindre la ligue'}
                  </button>
                  <button className="btn-ghost-sm" onClick={() => setShowJoinForm(false)}>
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-primary" onClick={() => setShowCreateForm(true)}>
                    + Créer une ligue
                  </button>
                  <div className="empty-divider">
                    <div className="empty-divider-line" />
                    <div className="empty-divider-txt">ou</div>
                    <div className="empty-divider-line" />
                  </div>
                  <button className="btn-ghost-sm" onClick={() => setShowJoinForm(true)}>
                    Rejoindre avec un code
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    )
  }

  // ── Full dashboard ───────────────────────────────
  return (
    <div className="d layout">

      {/* ── Sidebar overlay (mobile) ── */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo" style={{ position: 'relative' }} ref={dropdownRef}>
          <div className="logo-txt">BCF</div>
          {activeLeague && (
            <button className="league-switcher" onClick={() => setShowDropdown((v) => !v)}>
              <span className="league-switcher-name">{activeLeague.name}</span>
            </button>
          )}
          {showDropdown && (
            <div className="league-dropdown">
              {myLeagues?.map((l) => (
                <div
                  key={l.id}
                  className={`league-dropdown-item${l.id === activeLeague?.id ? ' selected' : ''}`}
                  onClick={() => { setActiveLeague(l); setShowDropdown(false) }}
                >
                  {l.name}
                </div>
              ))}
              <div
                className="league-dropdown-action"
                onClick={() => { setShowDropdown(false); setShowCreateForm(true); setShowJoinForm(false) }}
              >
                + Créer une ligue
              </div>
              <div
                className="league-dropdown-action"
                onClick={() => { setShowDropdown(false); setShowJoinForm(true); setShowCreateForm(false) }}
              >
                Rejoindre avec un code
              </div>
            </div>
          )}
        </div>

        <div style={{ paddingTop: '0.75rem' }}>
          <div className="nav-section">Principal</div>
          <div className="nav-item active" onClick={() => setSidebarOpen(false)}>
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </div>
          <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/standings') }}>
            <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Classement
          </div>
          <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/calendar') }}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Calendrier
          </div>
          <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/bets') }}>
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Mes pronostics
          </div>
          <div className="nav-section">Ligue</div>
          <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/members') }}>
            <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Membres
          </div>
          {activeLeague?.isAdmin && (
            <div className="nav-item" onClick={() => { setSidebarOpen(false); navigate('/admin') }}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
              Administration
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="me-avatar">{initials(user?.pseudo ?? '?')}</div>
          <div className="me-info">
            <div className="me-name">{user?.pseudo}</div>
            {myStanding && (
              <div className="me-rank">
                {myStanding.rank}e · {myStanding.totalPoints.toLocaleString('fr-FR')} pts
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="main" style={{ display: 'flex', flexDirection: 'column' }}>

        {/* ── Mobile header (inside main, au-dessus du topbar) ── */}
        <div className="mobile-header">
          <button className="hamburger" onClick={() => setSidebarOpen((v) => !v)}>
            <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          {activeLeague ? (
            <div className="mobile-league">
              <div className="mobile-league-title">{activeLeague.name}</div>
              <div className="mobile-league-sub">{activeLeague.code}</div>
            </div>
          ) : (
            <div className="mobile-logo">BCF</div>
          )}
          <div className="mobile-avatar">{initials(user?.pseudo ?? '?')}</div>
        </div>

        <div className="topbar">
          <div className="page-title">Dashboard</div>
          <div className="topbar-right">
            {activeLeague && (
              <div
                className={`league-code${codeCopied ? ' copied' : ''}`}
                onClick={copyCode}
                title="Cliquer pour copier"
              >
                {codeCopied ? 'Copié ✓' : `CODE : ${activeLeague.code}`}
              </div>
            )}
          </div>
        </div>

        <div className="content">

          {/* ── Create / join inline forms ── */}
          {showCreateForm && (
            <div style={{ background: '#131318', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                className="empty-input"
                placeholder="Nom de la nouvelle ligue"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && leagueName && createMutation.mutate()}
                autoFocus
                style={{ flex: 1, margin: 0 }}
              />
              <button className="btn-primary" onClick={() => createMutation.mutate()} disabled={!leagueName || createMutation.isPending}>
                {createMutation.isPending ? 'Création…' : 'Créer'}
              </button>
              <button className="btn-ghost-sm" onClick={() => { setShowCreateForm(false); setLeagueName('') }}>Annuler</button>
            </div>
          )}

          {showJoinForm && (
            <div style={{ background: '#131318', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="empty-input"
                placeholder="Code d'invitation"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinCode && joinMutation.mutate()}
                autoFocus
                style={{ flex: 1, margin: 0, fontFamily: 'monospace' }}
              />
              <button className="btn-primary" onClick={() => joinMutation.mutate()} disabled={!joinCode || joinMutation.isPending}>
                {joinMutation.isPending ? 'Rejoindre…' : 'Rejoindre'}
              </button>
              <button className="btn-ghost-sm" onClick={() => { setShowJoinForm(false); setJoinCode('') }}>Annuler</button>
              {joinMutation.isError && (
                <div className="empty-error" style={{ width: '100%' }}>Code invalide ou ligue introuvable.</div>
              )}
            </div>
          )}

          {/* ── Next race shortcut ── */}
          {mockNextRace && (
            <div
              onClick={() => navigate('/bets')}
              style={{
                background: mockNextRace.dot === 'live' ? 'rgba(74,222,128,0.05)' : '#131318',
                border: `0.5px solid ${mockNextRace.dot === 'live' ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 8,
                padding: '14px 1.25rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: mockNextRace.dot === 'live' ? '#4ade80' : 'rgba(232,201,109,0.7)',
                boxShadow: mockNextRace.dot === 'live' ? '0 0 6px rgba(74,222,128,0.5)' : 'none',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#f0ede8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {mockNextRace.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', marginTop: 2 }}>
                  {mockNextRace.date}
                </div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 4,
                background: mockNextRace.multClass === 'x2'
                  ? 'rgba(232,201,109,0.14)'
                  : mockNextRace.multClass === 'x15'
                  ? 'rgba(94,160,220,0.12)'
                  : mockNextRace.multClass === 'x1'
                  ? 'rgba(180,120,220,0.12)'
                  : 'rgba(255,255,255,0.05)',
                color: mockNextRace.multClass === 'x2'
                  ? '#e8c96d'
                  : mockNextRace.multClass === 'x15'
                  ? '#5ea0dc'
                  : mockNextRace.multClass === 'x1'
                  ? '#b478dc'
                  : 'rgba(240,237,232,0.35)',
                flexShrink: 0,
              }}>
                {mockNextRace.mult}
              </div>
              <button
                className={mockNextRace.dot === 'live' ? 'btn-ghost-sm' : 'btn-primary'}
                style={{ fontSize: 12, padding: '6px 14px' }}
                onClick={(e) => { e.stopPropagation(); navigate('/bets') }}
              >
                {mockNextRace.dot === 'live' ? 'En cours →' : 'Parier →'}
              </button>
            </div>
          )}

          {/* ── Stat grid ── */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Ma position</div>
              <div className={`stat-val${myStanding?.rank === 1 ? ' gold' : ''}`}>
                {myStanding ? `${myStanding.rank}e` : '—'}
              </div>
              <div className="stat-sub">
                sur {activeLeague?.memberCount ?? '—'} joueur{(activeLeague?.memberCount ?? 0) > 1 ? 's' : ''}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Mes points</div>
              <div className="stat-val">
                {myStanding ? myStanding.totalPoints.toLocaleString('fr-FR') : '—'}
              </div>
              <div className="stat-sub">cette saison</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Courses jouées</div>
              <div className="stat-val">{myStanding?.racesPlayed ?? '—'}</div>
              <div className="stat-sub">pronostics placés</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Écart leader</div>
              <div className="stat-val">
                {myStanding && leaderStanding
                  ? formatGap(myStanding.totalPoints - leaderStanding.totalPoints)
                  : '—'}
              </div>
              <div className="stat-sub">
                {leaderStanding && leaderStanding.userId !== user?.id
                  ? `${leaderStanding.pseudo} · ${leaderStanding.totalPoints.toLocaleString('fr-FR')} pts`
                  : 'Tu mènes la ligue'}
              </div>
            </div>
          </div>

          {/* ── Two columns ── */}
          <div className="two-col">

            {/* Standings panel */}
            <div className="panel">
              <div className="panel-head">
                <div className="panel-title">Classement de la ligue</div>
                <div className="panel-meta">Saison {activeLeague?.season}</div>
              </div>

              {leagueStandings && leagueStandings.length > 0 ? (
                <>
                  <div className="standings-col-head" style={{ gap: 12 }}>
                    <div style={{ width: 20, flexShrink: 0 }} />
                    <div style={{ width: 28, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(240,237,232,0.2)' }}>Joueur</div>
                    <div style={{ width: 28, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(240,237,232,0.2)', textAlign: 'center' }}>Crses</div>
                    <div style={{ width: 60, flexShrink: 0 }} />
                    <div style={{ width: 60, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(240,237,232,0.2)', textAlign: 'right' }}>Pts</div>
                  </div>
                  {leagueStandings.slice(0, 8).map((row, i) => {
                    const isMe = row.userId === user?.id
                    const col = avatarColor(i)
                    const barPct = maxPts > 0 ? Math.round((row.totalPoints / maxPts) * 100) : 0
                    const barColor = i === 0 ? '#e8c96d' : i === 1 ? '#b0b8c8' : i === 2 ? '#cd7f32' : '#e8c96d'
                    return (
                      <div key={row.userId} className={`standings-row${isMe ? ' me' : ''}`}>
                        <div className={`s-rank ${RANK_CLASSES[i] ?? ''}`}>{row.rank}</div>
                        <div className="s-avatar" style={{ background: col.bg, color: col.color }}>
                          {initials(row.pseudo)}
                        </div>
                        <div className="s-name">
                          {row.pseudo}
                          {isMe && <span className="me-badge">Moi</span>}
                        </div>
                        <div className="s-races">{row.racesPlayed}</div>
                        <div className="s-bar">
                          <div className="s-fill" style={{ width: `${barPct}%`, background: barColor }} />
                        </div>
                        <div className="s-pts">{row.totalPoints.toLocaleString('fr-FR')}</div>
                      </div>
                    )
                  })}
                  {hiddenCount > 0 && (
                    <div className="standings-footer">+ {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} joueur{hiddenCount > 1 ? 's' : ''}</div>
                  )}
                </>
              ) : (
                <div style={{ padding: '2rem 1.25rem', textAlign: 'center', fontSize: 13, color: 'rgba(240,237,232,0.25)' }}>
                  Aucun résultat pour l'instant.
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Upcoming races */}
              <div className="panel">
                <div className="panel-head">
                  <div className="panel-title">Prochaines courses</div>
                  <div className="panel-meta">Calendrier ligue</div>
                </div>
                {MOCK_RACES.map((race) => (
                  <div key={race.id} className="race-item">
                    <div className={`race-dot ${race.dot}`} />
                    <div className="race-info">
                      <div className={`race-name${race.status === 'locked' ? ' dim' : ''}`}>{race.name}</div>
                      <div className={`race-date${race.status === 'locked' ? ' dim' : ''}`}>{race.date}</div>
                    </div>
                    <div className={`race-mult ${race.multClass}${race.status === 'locked' ? ' dim' : ''}`}>
                      {race.mult}
                    </div>
                    <div className={`bet-status ${race.status}`}>
                      {race.status === 'done' ? 'Placé' : race.status === 'todo' ? 'À parier' : 'Scoré'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Last race */}
              {leagueStandings && leagueStandings.length > 0 && (
                <div className="panel">
                  <div className="panel-head">
                    <div className="panel-title">Classement actuel</div>
                    <div className="panel-meta">Top 4</div>
                  </div>
                  <div className="last-race">
                    <div className="last-race-label">Points cumulés</div>
                    {leagueStandings.slice(0, 4).map((row, i) => {
                      const isMe = row.userId === user?.id
                      const col = avatarColor(i)
                      return (
                        <div key={row.userId} className="podium-row">
                          <div className={`podium-pos ${PODIUM_CLASSES[i] ?? ''}`}>{row.rank}</div>
                          <div className="podium-av" style={{ background: col.bg, color: col.color }}>
                            {initials(row.pseudo)}
                          </div>
                          <div className="podium-info">
                            <div className="podium-name">
                              {row.pseudo}
                              {isMe && <span className="me-badge">Moi</span>}
                            </div>
                          </div>
                          <div className={`podium-pts${row.totalPoints === 0 ? ' dim' : ''}`}>
                            {row.totalPoints > 0 ? `${row.totalPoints.toLocaleString('fr-FR')} pts` : '0 pt'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
