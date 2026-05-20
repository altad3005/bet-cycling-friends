import { useNavigate } from 'react-router-dom'
import { RaceStatus, MultiplierType } from '@bcf/shared'
import { useCountdown } from '../../hooks/useCountdown'
import type { RaceResponse } from '../../api/races'
import type { BetResponse } from '../../api/bets'
import { formatDate } from '../../utils/ui'

function typeLabel(race: Pick<RaceResponse, 'raceType' | 'multiplierType' | 'isGrandTour'>) {
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

interface Props {
  race: RaceResponse
  myBet: BetResponse | null | undefined
  onBetClick: () => void
}

export default function RaceHero({ race, myBet, onBetClick }: Props) {
  const navigate = useNavigate()
  const canBet = race.status === RaceStatus.UPCOMING
  const countdown = useCountdown(canBet ? race.startAt ?? null : null)
  const type   = typeLabel(race)
  const status = statusInfo(race.status)
  const mult   = multLabel(race.multiplierType, race.isGrandTour)

  return (
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
        <span>
          {formatDate(race.startAt)}
          {race.endAt && race.startAt !== race.endAt ? ` – ${formatDate(race.endAt)}` : ''}
        </span>
      </div>

      {canBet && countdown && (
        <div className="race-countdown">⏱ Dans {countdown}</div>
      )}

      {canBet && (
        <button className="btn-primary" style={{ marginTop: '1.25rem' }} onClick={onBetClick}>
          {myBet ? 'Modifier mon pari' : 'Parier sur cette course'}
        </button>
      )}
    </div>
  )
}
