import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { racesApi } from '../api/races'
import { standingsApi, type StageStanding } from '../api/standings'
import { useLeague } from '../hooks/useLeague'
import { useAuthStore } from '../stores/auth'
import AppShell from '../components/AppShell'
import { initials, avatarColor } from '../utils/ui'
import './RacePage.css'

export default function GcResultPage() {
  const { raceId } = useParams<{ raceId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { activeLeague } = useLeague()

  const { data: races } = useQuery({
    queryKey: ['races', 'league', activeLeague?.id],
    queryFn: () => racesApi.leagueRaces(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })
  const race = races?.find((r) => r.id === raceId)

  const { data: gcStandings } = useQuery({
    queryKey: ['standings', 'gc', activeLeague?.id, raceId],
    queryFn: () => standingsApi.gc(activeLeague!.id, raceId!).then((r) => r.data.data.standings),
    enabled: !!activeLeague && !!raceId,
  })

  const pageTitle = 'Classement général'

  return (
    <AppShell activePage="calendar" pageTitle={pageTitle}>

      {/* ── Header ── */}
      <div className="race-hero">
        <div className="race-hero-top">
          <button className="race-back" onClick={() => navigate(`/races/${raceId}`)}>
            ← {race?.name ?? 'Retour'}
          </button>
        </div>

        <div className="race-hero-name">{pageTitle}</div>

        <div className="race-hero-meta">
          {race && <span>{race.name}</span>}
        </div>
      </div>

      <div className="race-body">

        {/* ── Classement général ── */}
        <section className="race-section">
          <div className="race-section-title">Classement général · Ligue</div>
          {!gcStandings ? (
            <div className="race-empty">Chargement…</div>
          ) : gcStandings.length === 0 ? (
            <div className="race-empty">Aucun résultat de classement général.</div>
          ) : (
            <div className="gt-stage-panel">
              <div className="gt-stage-standings">
                {gcStandings.map((row: StageStanding) => {
                  const isMe = row.userId === user?.id
                  const col = avatarColor(row.rank - 1)
                  return (
                    <div key={row.userId} className={`gt-stage-row${isMe ? ' me' : ''}`}>
                      <div className="gt-stage-header">
                        <div className="rs-rank">{row.rank}</div>
                        <div className="rs-avatar" style={{ background: col.bg, color: col.color }}>
                          {initials(row.pseudo)}
                        </div>
                        <div className="rs-pseudo">
                          {row.pseudo}
                          {isMe && <span className="me-badge">Moi</span>}
                        </div>
                        <div className="rs-points">{row.points.toLocaleString('fr-FR')} pts</div>
                      </div>
                      <div className="gt-rider-breakdown">
                        {row.riders.map((r) => (
                          <div key={r.riderId} className={`gt-rider-line${r.points > 0 ? ' scored' : ''}`}>
                            <span className="gt-rider-name">{r.name}</span>
                            {r.stageRank !== null
                              ? <span className="gt-rider-rank">{r.stageRank}e</span>
                              : <span className="gt-rider-rank muted">—</span>
                            }
                            <span className="gt-rider-pts">{r.points > 0 ? `+${r.points.toLocaleString('fr-FR')}` : '0'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>

      </div>
    </AppShell>
  )
}
