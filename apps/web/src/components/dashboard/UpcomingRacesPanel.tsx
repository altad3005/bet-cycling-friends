import { RaceStatus } from '@bcf/shared'
import type { RaceResponse } from '../../api/races'
import { raceDot, raceMultDisplay, raceDateLabel } from './raceDisplay'

interface Props {
  races: RaceResponse[]
}

export default function UpcomingRacesPanel({ races }: Props) {
  const visible = races
    .filter((r) => r.status === RaceStatus.LIVE || r.status === RaceStatus.UPCOMING)
    .sort((a, b) => {
      if (!a.startAt) return 1
      if (!b.startAt) return -1
      return new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    })
    .slice(0, 5)

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Prochaines courses</div>
        <div className="panel-meta">Calendrier ligue</div>
      </div>

      {visible.length > 0 ? visible.map((race) => {
        const dot = raceDot(race.status)
        const { mult, multClass } = raceMultDisplay(race)
        return (
          <div key={race.id} className="race-item">
            <div className={`race-dot ${dot}`} />
            <div className="race-info">
              <div className="race-name">{race.name}</div>
              <div className="race-date">{raceDateLabel(race)}</div>
            </div>
            <div className={`race-mult ${multClass}`}>{mult}</div>
          </div>
        )
      }) : (
        <div style={{ padding: '2rem 1.25rem', textAlign: 'center', fontSize: 13, color: 'rgba(240,237,232,0.25)' }}>
          Aucune course à venir dans cette ligue.
        </div>
      )}
    </div>
  )
}
