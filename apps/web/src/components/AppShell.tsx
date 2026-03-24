import { useState, useRef, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import { useLeague } from '../hooks/useLeague'
import { useLeagueStore } from '../stores/league'
import { standingsApi, type LeagueStanding } from '../api/standings'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { initials, avatarColor } from '../utils/ui'
import '../pages/HomePage.css'

export type ActivePage = 'dashboard' | 'standings' | 'calendar' | 'bets' | 'stats' | 'members' | 'admin' | 'profile'

interface AppShellProps {
  activePage: ActivePage
  pageTitle: string
  topbarRight?: ReactNode
  children: ReactNode
}

export default function AppShell({ activePage, pageTitle, topbarRight, children }: AppShellProps) {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const user = useAuthStore((s) => s.user)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [leagueName, setLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const dropdownRef = useRef<HTMLDivElement>(null)

  const queryClient = useQueryClient()
  const resetLeague = useLeagueStore((s) => s.reset)
  const { activeLeague, setActiveLeague, myLeagues, createMutation, joinMutation } = useLeague()

  const { data: leagueStandings } = useQuery({
    queryKey: ['standings', 'league', activeLeague?.id],
    queryFn: () => standingsApi.league(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  const myStanding: LeagueStanding | undefined = leagueStandings?.find(
    (s) => s.userId === user?.id,
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await authApi.logout().catch(() => {})
    clearAuth()
    resetLeague()
    queryClient.clear()
    navigate('/login')
  }

  function handleNav(page: string) {
    setSidebarOpen(false)
    navigate(page)
  }

  const navItems: { key: ActivePage; label: string; path: string; icon: ReactNode }[] = [
    {
      key: 'dashboard', label: 'Dashboard', path: '/dashboard',
      icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    },
    {
      key: 'standings', label: 'Classement', path: '/standings',
      icon: <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    },
    {
      key: 'calendar', label: 'Calendrier', path: '/calendar',
      icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
    {
      key: 'bets', label: 'Mes pronostics', path: '/bets',
      icon: <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    },
    {
      key: 'stats', label: 'Statistiques', path: '/stats',
      icon: <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
  ]

  const leagueItems: { key: ActivePage; label: string; path: string; icon: ReactNode; adminOnly?: boolean }[] = [
    {
      key: 'members', label: 'Membres', path: '/members',
      icon: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    },
    {
      key: 'admin', label: 'Administration', path: '/admin', adminOnly: true,
      icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>,
    },
  ]

  const mobileHeader = (
    <div className="mobile-header">
      <button className="hamburger" onClick={() => setSidebarOpen((v) => !v)}>
        <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      {activeLeague ? (
        <div className="mobile-league" onClick={() => setSidebarOpen(true)}>
          <div className="mobile-league-title">{activeLeague.name}</div>
        </div>
      ) : (
        <div className="mobile-logo">BCF</div>
      )}
      <div className="mobile-avatar" onClick={() => handleNav('/profile')} style={{ cursor: 'pointer' }}>{initials(user?.pseudo ?? '?')}</div>
    </div>
  )

  const sidebar = (
    <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
      <div className="sidebar-logo" style={{ position: 'relative' }} ref={dropdownRef}>
        <div className="logo-txt">BCF</div>
        {activeLeague && (
          <button className="league-switcher" onClick={() => setShowDropdown((v) => !v)}>
            <span className="league-switcher-name">{activeLeague.name}</span>
            <svg className={`league-switcher-chevron${showDropdown ? ' open' : ''}`} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        )}
        {!activeLeague && myLeagues && myLeagues.length > 0 && (
          <button className="league-switcher" onClick={() => setShowDropdown((v) => !v)}>
            <span className="league-switcher-name" style={{ color: 'rgba(240,237,232,0.4)', fontStyle: 'italic' }}>Choisir une ligue</span>
            <svg className={`league-switcher-chevron${showDropdown ? ' open' : ''}`} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
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
                <span className="league-dropdown-check">{l.id === activeLeague?.id ? '✓' : ''}</span>
                {l.name}
              </div>
            ))}
            <div className="league-dropdown-action" onClick={() => { setShowDropdown(false); setShowCreateForm(true); setShowJoinForm(false) }}>
              + Créer une ligue
            </div>
            <div className="league-dropdown-action" onClick={() => { setShowDropdown(false); setShowJoinForm(true); setShowCreateForm(false) }}>
              Rejoindre avec un code
            </div>
          </div>
        )}
        {showCreateForm && (
          <div className="sidebar-inline-form">
            <div className="sidebar-inline-form-title">Nouvelle ligue</div>
            <input
              className="sidebar-inline-input"
              placeholder="Nom de la ligue"
              value={leagueName}
              onChange={(e) => setLeagueName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && leagueName && createMutation.mutate(leagueName, { onSuccess: () => { setShowCreateForm(false); setLeagueName('') } })}
              autoFocus
            />
            <div className="sidebar-inline-actions">
              <button
                className="sidebar-inline-btn primary"
                onClick={() => createMutation.mutate(leagueName, { onSuccess: () => { setShowCreateForm(false); setLeagueName('') } })}
                disabled={!leagueName || createMutation.isPending}
              >
                {createMutation.isPending ? 'Création…' : 'Créer'}
              </button>
              <button className="sidebar-inline-btn ghost" onClick={() => { setShowCreateForm(false); setLeagueName('') }}>
                Annuler
              </button>
            </div>
          </div>
        )}
        {showJoinForm && (
          <div className="sidebar-inline-form">
            <div className="sidebar-inline-form-title">Rejoindre une ligue</div>
            <input
              className="sidebar-inline-input mono"
              placeholder="Code d'invitation"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinCode && joinMutation.mutate(joinCode, { onSuccess: () => { setShowJoinForm(false); setJoinCode('') } })}
              autoFocus
            />
            {joinMutation.isError && <div className="sidebar-inline-error">Code invalide ou ligue introuvable.</div>}
            <div className="sidebar-inline-actions">
              <button
                className="sidebar-inline-btn primary"
                onClick={() => joinMutation.mutate(joinCode, { onSuccess: () => { setShowJoinForm(false); setJoinCode('') } })}
                disabled={!joinCode || joinMutation.isPending}
              >
                {joinMutation.isPending ? 'Rejoindre…' : 'Rejoindre'}
              </button>
              <button className="sidebar-inline-btn ghost" onClick={() => { setShowJoinForm(false); setJoinCode('') }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ paddingTop: '0.75rem' }}>
        <div className="nav-section">Principal</div>
        {navItems.map((item) => (
          <div
            key={item.key + item.label}
            className={`nav-item${activePage === item.key ? ' active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            {item.icon}
            {item.label}
          </div>
        ))}
        <div className="nav-section">Ligue</div>
        {leagueItems
          .filter((item) => !item.adminOnly || activeLeague?.isAdmin)
          .map((item) => (
            <div
              key={item.label}
              className={`nav-item${activePage === item.key ? ' active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
      </div>

      <div className="sidebar-footer">
        <div
          className="me-avatar"
          style={{ cursor: 'pointer' }}
          onClick={() => handleNav('/profile')}
          title="Mon profil"
        >
          {initials(user?.pseudo ?? '?')}
        </div>
        <div className="me-info" style={{ cursor: 'pointer' }} onClick={() => handleNav('/profile')}>
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
  )

  return (
    <div className="d layout">
      <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {sidebar}

      <div className="main" style={{ display: 'flex', flexDirection: 'column' }}>
        {mobileHeader}

        <div className="topbar">
          <div className="page-title">{pageTitle}</div>
          {topbarRight && <div className="topbar-right">{topbarRight}</div>}
        </div>

<div className="content" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
