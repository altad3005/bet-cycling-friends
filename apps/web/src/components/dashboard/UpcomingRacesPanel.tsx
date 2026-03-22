import type { RaceResponse } from '../../api/races'
import { raceDot, raceMultDisplay, raceDateLabel } from './raceDisplay'

interface Props {
  races: RaceResponse[]
}

export default function UpcomingRacesPanel({ races }: Props) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Prochaines courses</div>
        <div className="panel-meta">Calendrier ligue</div>
      </div>

      {races.length > 0 ? races.map((race) => {
        const dot = raceDot(race.status)
        const { mult, multClass } = raceMultDisplay(race)
        return (
          <div key={race.id} className="race-item">
            <div className={`race-dot ${dot}`} />
            <div className="race-info">
              <div className={`race-name${dot === 'done' ? ' dim' : ''}`}>{race.name}</div>
              <div className={`race-date${dot === 'done' ? ' dim' : ''}`}>{raceDateLabel(race)}</div>
            </div>
            <div className={`race-mult ${multClass}${dot === 'done' ? ' dim' : ''}`}>
              {mult}
            </div>
          </div>
        )
      }) : (
        <div style={{ padding: '2rem 1.25rem', textAlign: 'center', fontSize: 13, color: 'rgba(240,237,232,0.25)' }}>
          Aucune course dans cette ligue.
        </div>
      )}
    </div>
  )
}
