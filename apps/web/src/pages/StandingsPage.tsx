import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { standingsApi, type LeagueStanding, type GlobalStanding } from '../api/standings'
import { useAuthStore } from '../stores/auth'
import { useLeague } from '../hooks/useLeague'
import { initials, avatarColor } from '../utils/ui'
import AppShell from '../components/AppShell'
import './StandingsPage.css'

type Tab = 'global' | 'league'
type LeagueFilter = 'all' | 'monuments' | 'grand-tours' | 'classics' | 'championnats'

const RANK_CLASSES = ['g', 's', 'b']

function rankClass(rank: number) {
  return RANK_CLASSES[rank - 1] ?? ''
}

function barColor(rank: number) {
  if (rank === 1) return '#e8c96d'
  if (rank === 2) return '#b0b8c8'
  if (rank === 3) return '#cd7f32'
  return '#e8c96d'
}

export default function StandingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { activeLeague } = useLeague()

  const [tab, setTab] = useState<Tab>('league')
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('all')
  const [search, setSearch] = useState('')

  const { data: globalStandings } = useQuery({
    queryKey: ['standings', 'global'],
    queryFn: () => standingsApi.global().then((r) => r.data.data.standings),
  })

  const { data: leagueStandings } = useQuery({
    queryKey: ['standings', 'league', activeLeague?.id],
    queryFn: () => standingsApi.league(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  const { data: monumentStandings } = useQuery({
    queryKey: ['standings', 'monuments', activeLeague?.id],
    queryFn: () => standingsApi.monuments(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  const { data: grandTourStandings } = useQuery({
    queryKey: ['standings', 'grand-tours', activeLeague?.id],
    queryFn: () => standingsApi.grandTours(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  const { data: classicStandings } = useQuery({
    queryKey: ['standings', 'classics', activeLeague?.id],
    queryFn: () => standingsApi.classics(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  const { data: championnatStandings } = useQuery({
    queryKey: ['standings', 'championnats', activeLeague?.id],
    queryFn: () => standingsApi.championnats(activeLeague!.id).then((r) => r.data.data.standings),
    enabled: !!activeLeague,
  })

  const rawRows =
    tab === 'global'                    ? globalStandings :
    leagueFilter === 'monuments'        ? monumentStandings :
    leagueFilter === 'grand-tours'      ? grandTourStandings :
    leagueFilter === 'classics'         ? classicStandings :
    leagueFilter === 'championnats'     ? championnatStandings :
    leagueStandings

  const filtered = useMemo(() => {
    if (!rawRows) return []
    if (!search.trim()) return rawRows
    const q = search.toLowerCase()
    return rawRows.filter((r) => r.pseudo.toLowerCase().includes(q))
  }, [rawRows, search])

  const maxVal = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return 1
    if (tab === 'global') return Math.max(...(rawRows as GlobalStanding[]).map((r) => r.percentage), 1)
    return Math.max(...(rawRows as LeagueStanding[]).map((r) => r.totalPoints), 1)
  }, [rawRows, tab])

  // Top 3 + ma position pour le hero (uniquement joueurs ayant au moins 1 course scorée)
  const top3 = (rawRows ?? []).slice(0, 3)
  const myRow = rawRows?.find((r) => r.userId === user?.id)
  const myVal = myRow && (tab === 'global' ? (myRow as GlobalStanding).percentage : (myRow as LeagueStanding).totalPoints)

  function displayVal(row: LeagueStanding | GlobalStanding) {
    if (tab === 'global') return `${(row as GlobalStanding).percentage.toFixed(1)}%`
    return (row as LeagueStanding).totalPoints.toLocaleString('fr-FR')
  }

  function rowVal(row: LeagueStanding | GlobalStanding): number {
    return tab === 'global' ? (row as GlobalStanding).percentage : (row as LeagueStanding).totalPoints
  }

  const totalPlayers = rawRows?.length ?? 0

  return (
    <AppShell
      activePage="standings"
      pageTitle="Classement"
      topbarRight={
        <span style={{ fontSize: 12, color: 'rgba(240,237,232,0.3)', letterSpacing: '0.5px' }}>
          {totalPlayers > 0 ? `${totalPlayers} joueur${totalPlayers > 1 ? 's' : ''}` : ''}
        </span>
      }
    >
      {/* ── Controls ── */}
      <div className="standings-controls">
        <div className="standings-controls-top">
          <div className="tab-bar">
            <button
              className={`tab${tab === 'league' ? ' active' : ''}`}
              onClick={() => setTab('league')}
            >
              {activeLeague ? activeLeague.name : 'Ma ligue'}
            </button>
            <button
              className={`tab${tab === 'global' ? ' active' : ''}`}
              onClick={() => setTab('global')}
            >
              Global
            </button>
          </div>

          {tab === 'league' && (
            <div className="league-filter-bar">
              <button
                className={`league-filter-btn${leagueFilter === 'all' ? ' active' : ''}`}
                onClick={() => setLeagueFilter('all')}
              >Tout</button>
              <button
                className={`league-filter-btn${leagueFilter === 'monuments' ? ' active' : ''}`}
                onClick={() => setLeagueFilter('monuments')}
              >Monuments</button>
              <button
                className={`league-filter-btn${leagueFilter === 'grand-tours' ? ' active' : ''}`}
                onClick={() => setLeagueFilter('grand-tours')}
              >Grands Tours</button>
              <button
                className={`league-filter-btn${leagueFilter === 'classics' ? ' active' : ''}`}
                onClick={() => setLeagueFilter('classics')}
              >Classiques</button>
              <button
                className={`league-filter-btn${leagueFilter === 'championnats' ? ' active' : ''}`}
                onClick={() => setLeagueFilter('championnats')}
              >Championnats</button>
            </div>
          )}
        </div>

        <div className="search-wrap">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="search-input"
            placeholder="Rechercher un joueur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Hero top 3 + moi ── */}
      {!search && top3.length > 0 && (
        <div className="standings-hero">
          {top3.map((row, i) => {
            const col = avatarColor(i)
            return (
              <div key={row.userId} className={`hero-card${row.userId === user?.id ? ' highlight' : ''}`} style={{ cursor: tab !== 'global' ? 'pointer' : 'default' }} onClick={() => tab !== 'global' && navigate(`/members/${row.userId}`)}>
                <div className="hero-avatar" style={{ background: col.bg, color: col.color }}>
                  {initials(row.pseudo)}
                </div>
                <div className="hero-info">
                  <div className="hero-label">{i === 0 ? '1er' : i === 1 ? '2e' : '3e'}</div>
                  <div className="hero-name">{row.pseudo}</div>
                  <div className="hero-val">{displayVal(row)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Full table ── */}
      <div className="standings-panel">
        <div className="standings-head">
          <div className="standings-head-cell">#</div>
          <div className="standings-head-cell">Joueur</div>
          <div className="standings-head-cell right">Courses</div>
          <div className="standings-head-cell">Score</div>
          <div className="standings-head-cell right">{tab === 'global' ? '%' : 'Pts'}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-results">
            {search ? `Aucun joueur trouvé pour « ${search} »` : 'Aucun joueur enregistré.'}
          </div>
        ) : (
          filtered.map((row, i) => {
            const isMe = row.userId === user?.id
            const col = avatarColor(i)
            const val = rowVal(row)
            const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
            const bColor = barColor(row.rank)

            return (
              <div key={row.userId} className={`standings-full-row${isMe ? ' me' : ''}`} style={{ cursor: tab !== 'global' ? 'pointer' : 'default' }} onClick={() => tab !== 'global' && navigate(`/members/${row.userId}`)}>
                <div className={`full-rank ${rankClass(row.rank)}`}>{row.rank}</div>

                <div className="full-player">
                  <div className="full-avatar" style={{ background: col.bg, color: col.color }}>
                    {initials(row.pseudo)}
                  </div>
                  <div className="full-name">
                    {row.pseudo}
                    {isMe && <span className="me-badge" style={{ marginLeft: 6 }}>Moi</span>}
                  </div>
                </div>

                <div className="full-races">{row.racesPlayed}</div>

                <div className="full-bar-cell">
                  <div className="full-bar">
                    <div className="full-bar-fill" style={{ width: `${pct}%`, background: bColor }} />
                  </div>
                </div>

                <div className="full-score">{displayVal(row)}</div>
              </div>
            )
          })
        )}
      </div>

      {/* Ligne "moi" fixée en bas si hors du top visible */}
      {myRow && search === '' && myRow.rank > 10 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.25)', textAlign: 'center', marginBottom: 6 }}>
            · · ·
          </div>
          <div className="standings-panel">
            {(() => {
              const col = avatarColor(myRow.rank - 1)
              const val = rowVal(myRow)
              const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
              return (
                <div className="standings-full-row me" style={{ cursor: tab !== 'global' ? 'pointer' : 'default' }} onClick={() => tab !== 'global' && navigate(`/members/${myRow.userId}`)}>
                  <div className={`full-rank ${rankClass(myRow.rank)}`}>{myRow.rank}</div>
                  <div className="full-player">
                    <div className="full-avatar" style={{ background: col.bg, color: col.color }}>
                      {initials(myRow.pseudo)}
                    </div>
                    <div className="full-name">
                      {myRow.pseudo}
                      <span className="me-badge" style={{ marginLeft: 6 }}>Moi</span>
                    </div>
                  </div>
                  <div className="full-races">{myRow.racesPlayed}</div>
                  <div className="full-bar-cell">
                    <div className="full-bar">
                      <div className="full-bar-fill" style={{ width: `${pct}%`, background: '#e8c96d' }} />
                    </div>
                  </div>
                  <div className="full-score">{displayVal(myRow)}</div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </AppShell>
  )
}
