import { useNavigate } from 'react-router-dom'
import { RaceStatus } from '@bcf/shared'
import type { RaceResponse } from '../../api/races'
import { raceDot, raceMultDisplay, raceDateLabel } from './raceDisplay'

interface Props {
  races: RaceResponse[]
}

export default function UpcomingRacesPanel({ races }: Props) {
  const navigate = useNavigate()

  const live = races.filter((r) => r.status === RaceStatus.LIVE)
  const upcoming = races
    .filter((r) => r.status === RaceStatus.UPCOMING)
    .sort((a, b) => {
      if (!a.startAt) return 1
      if (!b.startAt) return -1
      return new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    })
    .slice(0, 5)

  const isEmpty = live.length === 0 && upcoming.length === 0

  function RaceRow({ race }: { race: RaceResponse }) {
    const dot = raceDot(race.status)
    const { mult, multClass } = raceMultDisplay(race)
    return (
      <div className="race-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/races/${race.id}`)}>
        <div className={`race-dot ${dot}`} />
        <div className="race-info">
          <div className={`race-name${race.status === RaceStatus.LIVE ? '' : ''}`}>{race.name}</div>
          <div className="race-date">{raceDateLabel(race)}</div>
        </div>
        <div className={`race-mult ${multClass}`}>{mult}</div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Prochaines courses</div>
        <div className="panel-meta">Calendrier ligue</div>
      </div>

      {isEmpty ? (
        <div style={{ padding: '2rem 1.25rem', textAlign: 'center', fontSize: 13, color: 'rgba(240,237,232,0.25)' }}>
          Aucune course à venir dans cette ligue.
        </div>
      ) : (
        <>
          {live.length > 0 && (
            <>
              <div className="race-group-header live">En cours</div>
              {live.map((race) => <RaceRow key={race.id} race={race} />)}
            </>
          )}
          {upcoming.length > 0 && (
            <>
              {live.length > 0 && <div className="race-group-header">À venir</div>}
              {upcoming.map((race) => <RaceRow key={race.id} race={race} />)}
            </>
          )}
        </>
      )}
    </div>
  )
}
