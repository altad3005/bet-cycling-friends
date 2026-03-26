import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { RaceStatus, MultiplierType } from '@bcf/shared'
import { racesApi } from '../api/races'
import { betsApi, type BetClassicResponse, type BetGrandTourResponse } from '../api/bets'
import { standingsApi, type StageStanding } from '../api/standings'
import { useLeague } from '../hooks/useLeague'
import { useAuthStore } from '../stores/auth'
import { useCountdown } from '../hooks/useCountdown'
import AppShell from '../components/AppShell'
import BetModal from '../components/betting/BetModal'
import { initials, avatarColor } from '../utils/ui'
import './RacePage.css'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const TIME_FMT = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return DATE_FMT.format(new Date(iso))
}

function typeLabel(race: { raceType: string; multiplierType: string; isGrandTour: boolean }) {
  if (race.isGrandTour) return { label: 'Grand Tour', cls: 'grand-tour' }
  if (race.raceType === 'classic') {
    if (race.multiplierType === 'monument')   return { label: 'Monument',  cls: 'monument' }
    if (race.multiplierType === 'wt_classic') return { label: 'Classique', cls: 'wt-classic' }
    return { label: 'Classique', cls: 'classic' }
  }
  if (race.raceType === 'stage_race') return { label: 'Tour par étapes', cls: 'stage-race' }
  if (race.raceType === 'worlds')     return { label: 'Championnats',    cls: 'worlds' }
  if (race.raceType === 'national')   return { label: 'National',        cls: 'national' }
  return { label: race.raceType, cls: 'classic' }
}

function multLabel(multiplierType: string, isGrandTour: boolean) {
  if (isGrandTour) return 'Grand Tour'
  switch (multiplierType) {
    case MultiplierType.MONUMENT:   return '×2,0'
    case MultiplierType.WT_CLASSIC: return '×1,5'
    default:                        return '×1,0'
  }
}

function statusInfo(status: RaceStatus) {
  if (status === RaceStatus.LIVE)     return { dot: 'live',     label: 'En cours' }
  if (status === RaceStatus.FINISHED) return { dot: 'done',     label: 'Terminée' }
  return                                     { dot: 'upcoming', label: 'À venir' }
}

export default function RacePage() {
  const { raceId } = useParams<{ raceId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { activeLeague } = useLeague()
  const [betOpen, setBetOpen] = useState(false)
  const [startlistSearch, setStartlistSearch] = useState('')
  const [selectedStage, setSelectedStage] = useState<number | null>(null)

  const { data: races } = useQuery({
    queryKey: ['races', 'league', activeLeague?.id],
    queryFn: () => racesApi.leagueRaces(activeLeague!.id).then((r) => r.data.data.races),
    enabled: !!activeLeague,
  })
  const race = races?.find((r) => r.id === raceId)

  const { data: myBet } = useQuery({
    queryKey: ['bet', raceId],
    queryFn: () => betsApi.myBet(raceId!).then((r) => r.data.data.bet),
    enabled: !!raceId,
  })

  const { data: startlist } = useQuery({
    queryKey: ['startlist', raceId],
    queryFn: () => racesApi.startlist(raceId!).then((r) => r.data.data.riders),
    enabled: !!raceId,
  })

  const { data: raceStandings } = useQuery({
    queryKey: ['standings', 'race', activeLeague?.id, raceId],
    queryFn: () => standingsApi.race(activeLeague!.id, raceId!).then((r) => r.data.data.standings),
    enabled: !!activeLeague && !!raceId && race?.status === RaceStatus.FINISHED,
  })

  const { data: leagueBetsData } = useQuery({
    queryKey: ['bets', 'league', activeLeague?.id, raceId],
    queryFn: () => betsApi.leagueBets(activeLeague!.id, raceId!).then((r) => r.data.data),
    enabled: !!activeLeague && !!raceId,
  })

  const { data: stagesData } = useQuery({
    queryKey: ['stages', raceId],
    queryFn: () => racesApi.stages(raceId!).then((r) => r.data.data),
    enabled: !!raceId && !!race?.isGrandTour,
  })

  const { data: stageStandings } = useQuery({
    queryKey: ['standings', 'stage', activeLeague?.id, raceId, selectedStage],
    queryFn: () => standingsApi.stage(activeLeague!.id, raceId!, selectedStage!).then((r) => r.data.data.standings),
    enabled: !!activeLeague && !!raceId && selectedStage !== null,
  })

  const { data: raceResults } = useQuery({
    queryKey: ['results', raceId],
    queryFn: () => racesApi.results(raceId!).then((r) => r.data.data.results),
    enabled: !!raceId && race?.status === RaceStatus.FINISHED,
  })

  const canBet = race?.status === RaceStatus.UPCOMING
  const countdown = useCountdown(canBet ? race?.startAt ?? null : null)

  if (!race) return null

  const type   = typeLabel(race)
  const status = statusInfo(race.status)
  const mult   = multLabel(race.multiplierType, race.isGrandTour)
  const classicBet = myBet && 'favoriteRider' in myBet ? (myBet as BetClassicResponse) : null
  const gtBet      = myBet && 'riders' in myBet        ? (myBet as BetGrandTourResponse) : null

  return (
    <>
      <AppShell activePage="calendar" pageTitle={race.name}>

        {/* ── Header ── */}
        <div className="race-hero">
          <div className="race-hero-top">
            <button className="race-back" onClick={() => navigate(-1)}>← Retour</button>
            <div className="race-badges">
              <span className={`race-badge type ${type.cls}`}>{type.label}</span>
              <span className="race-badge mult">{mult}</span>
            </div>
          </div>

          <div className="race-hero-name">{race.name}</div>

          <div className="race-hero-meta">
            <span className={`race-dot ${status.dot}`} />
            <span className="race-status-label">{status.label}</span>
            <span className="race-sep">·</span>
            <span>{formatDate(race.startAt)}{race.endAt && race.startAt !== race.endAt ? ` – ${formatDate(race.endAt)}` : ''}</span>
          </div>

          {canBet && countdown && (
            <div className="race-countdown">⏱ Dans {countdown}</div>
          )}

          {canBet && (
            <button className="btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => setBetOpen(true)}>
              {myBet ? 'Modifier mon pari' : 'Parier sur cette course'}
            </button>
          )}

          {leagueBetsData && leagueBetsData.bets.length > 0 && (
            <div className="race-participation">
              {leagueBetsData.bets.length === 1
                ? '1 membre a déjà parié'
                : `${leagueBetsData.bets.length} membres ont déjà parié`}
            </div>
          )}
        </div>

        <div className="race-body">

          {/* ── Mon pari ── */}
          <section className="race-section">
            <div className="race-section-title">Mon pari</div>
            {!myBet ? (
              <div className="race-empty">
                {canBet
                  ? 'Tu n\'as pas encore placé de pari sur cette course.'
                  : 'Aucun pari placé sur cette course.'}
              </div>
            ) : classicBet ? (
              <div className="bet-card-detail">
                <div className="bet-rider-row">
                  <div className="bet-rider-label">Favori</div>
                  <div className="bet-rider-name">{classicBet.favoriteRider?.name ?? '—'}</div>
                </div>
                <div className="bet-rider-row">
                  <div className="bet-rider-label">Bonus</div>
                  <div className="bet-rider-name">{classicBet.bonusRider?.name ?? '—'}</div>
                </div>
                <div className="bet-placed-at">
                  Placé le {DATE_FMT.format(new Date(classicBet.placedAt))} à {TIME_FMT.format(new Date(classicBet.placedAt))}
                </div>
              </div>
            ) : gtBet ? (
              <div className="bet-card-detail">
                <div className="bet-rider-label" style={{ marginBottom: '0.5rem' }}>Équipe sélectionnée</div>
                <div className="bet-gt-riders">
                  {gtBet.riders?.map((r) => (
                    <div key={r.id} className="bet-gt-rider">{r.name}</div>
                  ))}
                </div>
                <div className="bet-placed-at">
                  Placé le {DATE_FMT.format(new Date(gtBet.placedAt))} à {TIME_FMT.format(new Date(gtBet.placedAt))}
                </div>
              </div>
            ) : null}
          </section>

          {/* ── Résultats ligue (course terminée) ── */}
          {race.status === RaceStatus.FINISHED && (
            <section className="race-section">
              <div className="race-section-title">
                Résultats · Ligue
                {raceResults && raceResults.length > 0 && (
                  <span className="race-section-badge">
                    🏆 {raceResults[0].name}
                  </span>
                )}
              </div>
              {!raceStandings || raceStandings.length === 0 ? (
                <div className="race-empty">Aucun résultat disponible.</div>
              ) : (
                <div className="results-list">
                  {raceStandings.map((row) => {
                    const isMe = row.userId === user?.id
                    const col  = avatarColor(row.rank - 1)
                    const bet  = leagueBetsData?.raceStarted
                      ? leagueBetsData.bets.find((b) => b.userId === row.userId)
                      : undefined
                    const cb = bet && 'favoriteRider' in bet ? (bet as BetClassicResponse) : null
                    const gb = bet && 'riders' in bet        ? (bet as BetGrandTourResponse) : null
                    return (
                      <div key={row.userId} className={`result-row${isMe ? ' me' : ''}${row.rank === 1 ? ' first' : ''}`}>
                        <div className="result-rank-col">
                          <span className={`result-rank${row.rank <= 3 ? ` r${row.rank}` : ''}`}>{row.rank}</span>
                        </div>
                        <div className="result-avatar" style={{ background: col.bg, color: col.color }}>
                          {initials(row.pseudo)}
                        </div>
                        <div className="result-main">
                          <div className="result-name">
                            {row.pseudo}
                            {isMe && <span className="me-badge">Moi</span>}
                          </div>
                          {cb && (
                            <div className="result-picks">
                              {cb.favoriteRider && <span className="result-pick favori">{cb.favoriteRider.name}</span>}
                              {cb.bonusRider   && <span className="result-pick bonus">{cb.bonusRider.name}</span>}
                            </div>
                          )}
                          {gb && gb.riders && gb.riders.length > 0 && (
                            <div className="result-gt-riders">
                              {gb.riders.map((r) => (
                                <span key={r.id} className="result-gt-chip">{r.name}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="result-pts">{row.points.toLocaleString('fr-FR')}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Résultats officiels (course terminée) ── */}
          {race.status === RaceStatus.FINISHED && raceResults && raceResults.length > 0 && (
            <section className="race-section">
              <div className="race-section-title">
                {race.isGrandTour ? 'Classement général final' : 'Top 10 officiel'}
              </div>
              <div className="race-results">
                {raceResults.map((r) => (
                  <div key={r.riderId} className="race-result-row">
                    <div className="rr-rank">{r.rank}</div>
                    <div className="rr-name">{r.name}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Paris des membres (live / à venir) ── */}
          {race.status !== RaceStatus.FINISHED && (
            <section className="race-section">
              <div className="race-section-title">
                Paris des membres
                {leagueBetsData && (
                  <span className="race-section-badge masked">
                    {leagueBetsData.bets.length} pari{leagueBetsData.bets.length !== 1 ? 's' : ''}
                    {!leagueBetsData.raceStarted && ' · masqués'}
                  </span>
                )}
              </div>
              {!leagueBetsData || leagueBetsData.bets.length === 0 ? (
                <div className="race-empty">Aucun pari placé dans cette ligue.</div>
              ) : !leagueBetsData.raceStarted ? (
                <div className="race-empty">Les paris seront révélés au départ de la course.</div>
              ) : (
                <div className="member-bets">
                  {leagueBetsData.bets.map((bet) => {
                    const cb = 'favoriteRider' in bet ? (bet as BetClassicResponse) : null
                    const gb = 'riders' in bet        ? (bet as BetGrandTourResponse) : null
                    const isMe = bet.userId === user?.id
                    return (
                      <div key={bet.userId} className={`member-bet-card${isMe ? ' me' : ''}`}>
                        <div className="member-bet-pseudo">
                          {bet.user?.pseudo ?? (isMe ? 'Moi' : '—')}
                          {isMe && <span className="me-badge">Moi</span>}
                        </div>
                        {cb && (
                          <>
                            <div className="bet-rider-row"><span className="bet-rider-label">Favori</span> {cb.favoriteRider?.name ?? '—'}</div>
                            <div className="bet-rider-row"><span className="bet-rider-label">Bonus</span> {cb.bonusRider?.name ?? '—'}</div>
                          </>
                        )}
                        {gb && (
                          <div className="bet-gt-riders">
                            {gb.riders?.map((r) => <div key={r.id} className="bet-gt-rider">{r.name}</div>)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Étapes (Grand Tour) ── */}
          {race.isGrandTour && stagesData && stagesData.stages.length > 0 && (
            <section className="race-section">
              <div className="race-section-title">Étapes</div>
              <div className="gt-stage-list">
                {stagesData.stages.map((stage) => {
                  const isSelected = selectedStage === stage.number
                  const profileLevel = stage.profileIcon ? parseInt(stage.profileIcon.replace('p', '')) : 0
                  return (
                    <button
                      key={stage.number}
                      className={`gt-stage-row-btn${stage.synced ? ' synced' : ''}${isSelected ? ' active' : ''}`}
                      onClick={() => stage.synced && setSelectedStage(isSelected ? null : stage.number)}
                    >
                      <span className="gt-stage-num">{stage.number}</span>
                      <span className="gt-stage-name">{stage.name}</span>
                      {stage.date && <span className="gt-stage-date">{stage.date}</span>}
                      <span className="gt-stage-profile" title={`Profil ${stage.profileIcon ?? '—'}`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`gt-profile-bar${i < profileLevel ? ' filled' : ''}`} />
                        ))}
                      </span>
                      {stage.synced
                        ? <span className="gt-stage-status synced">Résultats</span>
                        : <span className="gt-stage-status pending">À venir</span>
                      }
                    </button>
                  )
                })}
              </div>

              {selectedStage !== null && (
                <div className="gt-stage-panel">
                  <div className="gt-stage-panel-title">
                    {stagesData.stages.find((s) => s.number === selectedStage)?.name ?? `Étape ${selectedStage}`}
                  </div>
                  {!stageStandings || stageStandings.length === 0 ? (
                    <div className="race-empty">Aucun résultat pour cette étape.</div>
                  ) : (
                    <div className="gt-stage-standings">
                      {stageStandings.map((row: StageStanding) => {
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
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Startlist ── */}
          {startlist && startlist.length > 0 && (() => {
            const q = startlistSearch.trim().toLowerCase()
            const filtered = q ? startlist.filter((r) => r.name.toLowerCase().includes(q) || (r.teamName ?? '').toLowerCase().includes(q)) : startlist

            // Group by team
            const byTeam = filtered.reduce<Record<string, typeof filtered>>((acc, rider) => {
              const team = rider.teamName?.replace(/\s*\(.*?\)\s*$/, '') ?? 'Sans équipe'
              if (!acc[team]) acc[team] = []
              acc[team].push(rider)
              return acc
            }, {})
            const teams = Object.entries(byTeam)

            return (
              <section className="race-section">
                <div className="race-section-title">
                  Startlist <span className="race-section-badge">{startlist.length} coureurs · {Object.keys(byTeam).length > 1 ? `${Object.keys(byTeam).length} équipes` : ''}</span>
                </div>
                <input
                  className="startlist-search"
                  type="text"
                  placeholder="Rechercher un coureur ou une équipe…"
                  value={startlistSearch}
                  onChange={(e) => setStartlistSearch(e.target.value)}
                />
                {teams.length === 0 ? (
                  <div className="race-empty">Aucun résultat pour "{startlistSearch}".</div>
                ) : (
                  <div className="startlist-teams">
                    {teams.map(([team, riders]) => (
                      <div key={team} className="startlist-team">
                        <div className="startlist-team-name">{team}</div>
                        <div className="startlist-team-riders">
                          {riders.map((rider) => (
                            <div key={rider.id} className="startlist-rider">
                              {rider.nationality && (
                                <span className="startlist-flag">
                                  {rider.nationality.toUpperCase().replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397))}
                                </span>
                              )}
                              <span className="startlist-rider-name">{rider.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })()}

        </div>
      </AppShell>

      {betOpen && <BetModal race={race} onClose={() => setBetOpen(false)} />}
    </>
  )
}
