import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { statsApi, type RaceStat, type PlayerStat } from '../api/stats'
import { useLeague } from '../hooks/useLeague'
import { initials, avatarColor } from '../utils/ui'
import AppShell from '../components/AppShell'
import './StatsPage.css'

const CHART_COLORS = [
  '#e8c96d', '#5b9cf6', '#f08080', '#82c99a',
  '#c49aed', '#f0a05a', '#7ecec4', '#f4a8d0',
]

// ── Line chart (cumulative points) ──────────────────────────────────────────

interface LineSeries {
  pseudo: string
  color: string
  data: number[]
}

function LineChart({ races, series }: { races: RaceStat[]; series: LineSeries[] }) {
  if (races.length < 2) {
    return <div className="stats-empty">Pas encore assez de courses scorées.</div>
  }

  const manyRaces = races.length > 5
  const W = Math.max(500, manyRaces ? races.length * 55 : 500)
  const H = 180
  const PAD = { top: 12, right: 16, bottom: manyRaces ? 56 : 36, left: 42 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...series.flatMap((s) => s.data), 1)
  const steps = 4
  const gridVals = Array.from({ length: steps + 1 }, (_, i) => Math.round((maxVal / steps) * i))

  const px = (i: number) => PAD.left + (races.length > 1 ? (i / (races.length - 1)) * cW : cW / 2)
  const py = (v: number) => PAD.top + cH - (v / maxVal) * cH

  function makePath(data: number[]) {
    return data
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`)
      .join(' ')
  }

  // Short race names for x axis
  const shortName = (name: string) => {
    const words = name.split(' ')
    return words.length > 2 ? words.slice(0, 2).join(' ') : name
  }

  return (
    <div>
      <div className="line-chart-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', minWidth: 300, height: 'auto', display: 'block' }}
        >
          {/* Horizontal grid */}
          {gridVals.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left} y1={py(v)}
                x2={PAD.left + cW} y2={py(v)}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6} y={py(v)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fill="rgba(240,237,232,0.3)"
              >
                {v}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {races.map((race, i) => (
            manyRaces ? (
              <text
                key={race.id}
                x={px(i)}
                y={PAD.top + cH + 8}
                textAnchor="end"
                fontSize={9}
                fill="rgba(240,237,232,0.3)"
                transform={`rotate(-40, ${px(i)}, ${PAD.top + cH + 8})`}
              >
                {shortName(race.name)}
              </text>
            ) : (
              <text
                key={race.id}
                x={px(i)}
                y={H - 6}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(240,237,232,0.3)"
              >
                {shortName(race.name)}
              </text>
            )
          ))}

          {/* Series */}
          {series.map((s) => (
            <g key={s.pseudo}>
              <path
                d={makePath(s.data)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.9}
              />
              {s.data.map((v, i) => (
                <circle
                  key={i}
                  cx={px(i)}
                  cy={py(v)}
                  r={3}
                  fill={s.color}
                />
              ))}
            </g>
          ))}
        </svg>
      </div>

      <div className="line-chart-legend">
        {series.map((s) => (
          <div key={s.pseudo} className="legend-item">
            <div className="legend-dot" style={{ background: s.color }} />
            {s.pseudo}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bar chart (points by race) ───────────────────────────────────────────────

function BarChart({
  races,
  players,
}: {
  races: RaceStat[]
  players: PlayerStat[]
}) {
  const playedRaces = races.filter((r) => r.scores.length > 0)
  if (playedRaces.length === 0) {
    return <div className="stats-empty">Aucun résultat disponible.</div>
  }

  const manyRaces = playedRaces.length > 5
  const W = Math.max(500, manyRaces ? playedRaces.length * 55 : 500)
  const H = 160
  const PAD = { top: 12, right: 16, bottom: manyRaces ? 56 : 40, left: 42 }
  const cW = W - PAD.left - PAD.right
  const cH = H - PAD.top - PAD.bottom

  const maxPts = Math.max(...playedRaces.flatMap((r) => r.scores.map((s) => s.points)), 1)
  const groupW = cW / playedRaces.length
  const barW = Math.min(14, (groupW / players.length) - 2)
  const gap = (groupW - barW * players.length) / 2

  const py = (v: number) => PAD.top + cH - (v / maxPts) * cH
  const barH = (v: number) => (v / maxPts) * cH

  const shortName = (name: string) => {
    const words = name.split(' ')
    return words.length > 2 ? words.slice(0, 2).join(' ') : name
  }

  return (
    <div style={{ overflowX: 'auto' }}>
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', minWidth: 300, height: 'auto', display: 'block' }}
    >
      {/* Grid */}
      {[0, 0.5, 1].map((frac) => {
        const v = Math.round(maxPts * frac)
        return (
          <g key={frac}>
            <line
              x1={PAD.left} y1={py(v)}
              x2={PAD.left + cW} y2={py(v)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6} y={py(v)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={9}
              fill="rgba(240,237,232,0.3)"
            >
              {v}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {playedRaces.map((race, ri) => {
        const groupX = PAD.left + ri * groupW

        return (
          <g key={race.id}>
            {players.map((player, pi) => {
              const score = race.scores.find((s) => s.userId === player.userId)
              const pts = score?.points ?? 0
              const x = groupX + gap + pi * barW
              const color = CHART_COLORS[pi % CHART_COLORS.length]

              return (
                <rect
                  key={player.userId}
                  x={x}
                  y={py(pts)}
                  width={Math.max(barW - 1, 1)}
                  height={barH(pts)}
                  fill={color}
                  opacity={pts > 0 ? 0.85 : 0.15}
                  rx={2}
                />
              )
            })}

            {manyRaces ? (
              <text
                x={groupX + groupW / 2}
                y={PAD.top + cH + 8}
                textAnchor="end"
                fontSize={9}
                fill="rgba(240,237,232,0.3)"
                transform={`rotate(-40, ${groupX + groupW / 2}, ${PAD.top + cH + 8})`}
              >
                {shortName(race.name)}
              </text>
            ) : (
              <text
                x={groupX + groupW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(240,237,232,0.3)"
              >
                {shortName(race.name)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { activeLeague } = useLeague()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', 'league', activeLeague?.id],
    queryFn: () => statsApi.league(activeLeague!.id).then((r) => r.data.data),
    enabled: !!activeLeague,
  })

  // Build cumulative series for line chart
  const { playedRaces, lineSeries } = useMemo(() => {
    if (!stats) return { playedRaces: [], lineSeries: [] }

    const played = stats.races.filter((r) => r.scores.length > 0)

    const series: LineSeries[] = stats.players.map((player, i) => {
      let cumul = 0
      const data = played.map((race) => {
        const score = race.scores.find((s) => s.userId === player.userId)
        cumul += score?.points ?? 0
        return cumul
      })
      return {
        pseudo: player.pseudo,
        color: CHART_COLORS[i % CHART_COLORS.length],
        data,
      }
    })

    return { playedRaces: played, lineSeries: series }
  }, [stats])

  if (!activeLeague) {
    return (
      <AppShell activePage="stats" pageTitle="Statistiques">
        <div className="stats-content">
          <div className="stats-empty">Rejoins ou crée une ligue pour voir les statistiques.</div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell activePage="stats" pageTitle="Statistiques">
      <div className="stats-content">
        {isLoading || !stats ? (
          <div className="stats-empty">Chargement…</div>
        ) : (
          <>
            {/* ── KPI cards ── */}
            <div className="stats-kpi-grid">
              <div className="stats-kpi-card">
                <div className="stats-kpi-label">Courses</div>
                <div className="stats-kpi-value">{stats.overview.totalRaces}</div>
                <div className="stats-kpi-sub">scorées</div>
              </div>
              <div className="stats-kpi-card">
                <div className="stats-kpi-label">Joueurs</div>
                <div className="stats-kpi-value">{stats.overview.activePlayers}</div>
                <div className="stats-kpi-sub">actifs</div>
              </div>
              <div className="stats-kpi-card">
                <div className="stats-kpi-label">Points</div>
                <div className="stats-kpi-value">{stats.overview.totalPoints.toLocaleString('fr-FR')}</div>
                <div className="stats-kpi-sub">distribués</div>
              </div>
              <div className="stats-kpi-card">
                <div className="stats-kpi-label">Participation</div>
                <div className="stats-kpi-value">{stats.overview.avgParticipation}%</div>
                <div className="stats-kpi-sub">en moyenne</div>
              </div>
            </div>

            {/* ── Cumulative points evolution ── */}
            <div className="stats-panel">
              <div className="stats-panel-title">Évolution des points cumulés</div>
              <LineChart races={playedRaces} series={lineSeries} />
            </div>

            {/* ── Points per race ── */}
            <div className="stats-panel">
              <div className="stats-panel-title">Points par course</div>
              <BarChart races={stats.races} players={stats.players} />
              {stats.players.length > 0 && (
                <div className="line-chart-legend" style={{ marginTop: '0.75rem' }}>
                  {stats.players.map((p, i) => (
                    <div key={p.userId} className="legend-item">
                      <div className="legend-dot" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {p.pseudo}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Participation per race ── */}
            {stats.races.length > 0 && (
              <div className="stats-panel">
                <div className="stats-panel-title">Participation par course</div>
                <div className="race-participation-list">
                  {stats.races.map((race) => (
                    <div key={race.id} className="race-participation-row">
                      <div>
                        <div className="race-participation-name">{race.name}</div>
                        <div className="race-participation-bar-bg">
                          <div
                            className="race-participation-bar-fill"
                            style={{ width: `${Math.round(race.participation * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="race-participation-pct">
                        {race.bettorCount}/{stats.overview.totalMembers}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Player stats table ── */}
            {stats.players.length > 0 && (
              <div className="stats-panel">
                <div className="stats-panel-title">Stats joueurs</div>
                <table className="stats-player-table">
                  <thead>
                    <tr>
                      <th>Joueur</th>
                      <th className="right">Moy.</th>
                      <th className="right">Part.</th>
                      <th>Meilleure course</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.players.map((player, i) => {
                      const col = avatarColor(i)
                      return (
                        <tr key={player.userId}>
                          <td>
                            <div className="player-cell">
                              <div
                                className="player-avatar-sm"
                                style={{ background: col.bg, color: col.color }}
                              >
                                {initials(player.pseudo)}
                              </div>
                              <span className="player-name">{player.pseudo}</span>
                            </div>
                          </td>
                          <td className="right">{player.avgPoints} pts</td>
                          <td className="right">
                            <span className={`participation-pill${player.participationRate < 50 ? ' low' : ''}`}>
                              {player.participationRate}%
                            </span>
                          </td>
                          <td>
                            {player.bestRace ? (
                              <div className="best-race-cell" title={player.bestRace.name}>
                                <span className="best-race-pts">{player.bestRace.points} pts</span>
                                {' · '}{player.bestRace.name}
                              </div>
                            ) : (
                              <span style={{ color: 'rgba(240,237,232,0.2)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
