import { useState } from 'react'
import { RaceStatus } from '@bcf/shared'
import type { RaceResponse } from '../../api/races'
import type { RaceStanding } from '../../api/standings'
import type { BetResponse, BetClassicResponse, BetGrandTourResponse } from '../../api/bets'
import { initials, avatarColor, DATE_FMT, TIME_FMT } from '../../utils/ui'

interface RaceResult {
  rank: number
  riderId: string
  name: string
}

interface LeagueBetsData {
  bets: BetResponse[]
  raceStarted: boolean
}

interface Props {
  race: RaceResponse
  userId: string | undefined
  myBet: BetResponse | null | undefined
  raceStandings: RaceStanding[] | undefined
  leagueBetsData: LeagueBetsData | undefined
  raceResults: RaceResult[] | undefined
}

export default function RaceLeagueStandings({
  race,
  userId,
  myBet,
  raceStandings,
  leagueBetsData,
  raceResults,
}: Props) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null)

  const canBet = race.status === RaceStatus.UPCOMING
  const classicBet = myBet && 'favoriteRider' in myBet ? (myBet as BetClassicResponse) : null
  const gtBet      = myBet && 'riders' in myBet        ? (myBet as BetGrandTourResponse) : null

  return (
    <>
      {/* ── Mon pari ── */}
      <section className="race-section">
        <div className="race-section-title">Mon pari</div>
        {!myBet ? (
          <div className="race-empty">
            {canBet
              ? "Tu n'as pas encore placé de pari sur cette course."
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

      {/* ── GT: Classement & Paris fusionnés (accordion) ── */}
      {race.isGrandTour && race.status !== RaceStatus.UPCOMING && (
        <section className="race-section">
          <div className="race-section-title">
            Classement · Ligue
            {!race.resultsFinal && <span className="race-section-badge">provisoire</span>}
          </div>
          {!raceStandings || raceStandings.length === 0 ? (
            <div className="race-empty">Aucun résultat disponible.</div>
          ) : (
            <div className="results-list">
              {raceStandings.map((row) => {
                const isMe = row.userId === userId
                const col  = avatarColor(row.rank - 1)
                const bet  = leagueBetsData?.raceStarted
                  ? leagueBetsData.bets.find((b) => b.userId === row.userId)
                  : undefined
                const gb = bet && 'riders' in bet ? (bet as BetGrandTourResponse) : null
                const isExpanded = expandedMember === row.userId
                return (
                  <div key={row.userId} className="gt-accordion-item">
                    <div
                      className={`result-row${isMe ? ' me' : ''}${row.rank === 1 ? ' first' : ''}${gb ? ' gt-clickable' : ''}`}
                      onClick={() => gb && setExpandedMember(isExpanded ? null : row.userId)}
                    >
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
                      </div>
                      <div className="result-pts">{row.points.toLocaleString('fr-FR')}</div>
                      {gb && <span className={`gt-chevron${isExpanded ? ' open' : ''}`}>›</span>}
                    </div>
                    {isExpanded && gb?.riders && (
                      <div className="gt-accordion-panel">
                        {gb.riders.map((r) => (
                          <div key={r.id} className="gt-accordion-rider">{r.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── GT upcoming: Paris masqués ── */}
      {race.isGrandTour && race.status === RaceStatus.UPCOMING && (
        <section className="race-section">
          <div className="race-section-title">
            Paris des membres
            {leagueBetsData && (
              <span className="race-section-badge masked">
                {leagueBetsData.bets.length} pari{leagueBetsData.bets.length !== 1 ? 's' : ''} · masqués
              </span>
            )}
          </div>
          <div className="race-empty">Les paris seront révélés au départ de la course.</div>
        </section>
      )}

      {/* ── Résultats officiels ── */}
      {race.resultsFinal && raceResults && raceResults.length > 0 && (
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

      {/* ── Classics: Résultats ligue ── */}
      {!race.isGrandTour && race.status !== RaceStatus.UPCOMING && raceStandings && raceStandings.length > 0 && (
        <section className="race-section">
          <div className="race-section-title">
            Résultats · Ligue
            {!race.resultsFinal && <span className="race-section-badge">provisoire</span>}
            {raceResults && raceResults.length > 0 && (
              <span className="race-section-badge">{raceResults[0].name}</span>
            )}
          </div>
          <div className="results-list">
            {raceStandings.map((row) => {
              const isMe = row.userId === userId
              const col  = avatarColor(row.rank - 1)
              const bet  = leagueBetsData?.raceStarted
                ? leagueBetsData.bets.find((b) => b.userId === row.userId)
                : undefined
              const cb = bet && 'favoriteRider' in bet ? (bet as BetClassicResponse) : null
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
                  </div>
                  <div className="result-pts">{row.points.toLocaleString('fr-FR')}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Classics: Paris des membres ── */}
      {!race.isGrandTour && race.status !== RaceStatus.FINISHED && (
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
                const isMe = bet.userId === userId
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
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </>
  )
}
