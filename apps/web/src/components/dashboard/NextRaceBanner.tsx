import type { RaceResponse } from '../../api/races'
import { raceDot, raceMultDisplay, raceDateLabel } from './raceDisplay'

interface Props {
  race: RaceResponse
  onNavigate: () => void
}

export default function NextRaceBanner({ race, onNavigate }: Props) {
  const dot = raceDot(race.status)
  const { mult, multClass } = raceMultDisplay(race)

  return (
    <div className={`next-race-banner${dot === 'live' ? ' live' : ''}`} onClick={onNavigate}>
      <div className={`next-race-dot ${dot}`} />
      <div className="next-race-info">
        <div className="next-race-name">{race.name}</div>
        <div className="next-race-date">{raceDateLabel(race)}</div>
      </div>
      <div className={`race-mult ${multClass}`}>{mult}</div>
      <button
        className={dot === 'live' ? 'btn-ghost-sm' : 'btn-primary'}
        style={{ fontSize: 12, padding: '6px 14px' }}
        onClick={(e) => { e.stopPropagation(); onNavigate() }}
      >
        {dot === 'live' ? 'En cours →' : 'Parier →'}
      </button>
    </div>
  )
}
