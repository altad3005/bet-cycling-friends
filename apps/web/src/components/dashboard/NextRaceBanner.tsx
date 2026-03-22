import { useQuery } from '@tanstack/react-query'
import { betsApi } from '../../api/bets'
import type { RaceResponse } from '../../api/races'
import { raceDot, raceMultDisplay, raceDateLabel } from './raceDisplay'

interface Props {
  race: RaceResponse
  onNavigate: () => void
  onBet?: () => void
}

export default function NextRaceBanner({ race, onNavigate, onBet }: Props) {
  const dot = raceDot(race.status)
  const { mult, multClass } = raceMultDisplay(race)

  const { data: existingBet } = useQuery({
    queryKey: ['bet', race.id],
    queryFn: () => betsApi.myBet(race.id).then((r) => r.data.data.bet),
    enabled: dot === 'upcoming',
  })
  const hasBet = !!existingBet

  const btnLabel = dot === 'live'
    ? 'En cours →'
    : hasBet ? 'Modifier →' : 'Parier →'

  const handleBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (dot === 'upcoming' && onBet) onBet()
    else onNavigate()
  }

  return (
    <div className={`next-race-banner${dot === 'live' ? ' live' : ''}`} onClick={onNavigate}>
      <div className={`next-race-dot ${dot}`} />
      <div className="next-race-info">
        <div className="next-race-name">{race.name}</div>
        <div className="next-race-date">{raceDateLabel(race)}</div>
      </div>
      <div className={`race-mult ${multClass}`}>{mult}</div>
      <button
        className={dot === 'live' || hasBet ? 'btn-ghost-sm' : 'btn-primary'}
        style={{ fontSize: 12, padding: '6px 14px' }}
        onClick={handleBtnClick}
      >
        {btnLabel}
      </button>
    </div>
  )
}
