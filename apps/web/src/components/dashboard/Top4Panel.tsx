import type { LeagueStanding } from '../../api/standings'
import { initials, avatarColor } from '../../utils/ui'

const PODIUM_CLASSES = ['g', 's', 'b', '']

interface Props {
  standings: LeagueStanding[]
  userId:    string
}

export default function Top4Panel({ standings, userId }: Props) {
  const top4 = standings.slice(0, 4)

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Classement actuel</div>
        <div className="panel-meta">Top 4</div>
      </div>
      <div className="last-race">
        <div className="last-race-label">Points cumulés</div>
        {top4.map((row, i) => {
          const isMe = row.userId === userId
          const col  = avatarColor(i)
          return (
            <div key={row.userId} className="podium-row">
              <div className={`podium-pos ${PODIUM_CLASSES[i] ?? ''}`}>{row.rank}</div>
              <div className="podium-av" style={{ background: col.bg, color: col.color }}>
                {initials(row.pseudo ?? '?')}
              </div>
              <div className="podium-info">
                <div className="podium-name">
                  {row.pseudo}
                  {isMe && <span className="me-badge">Moi</span>}
                </div>
              </div>
              <div className={`podium-pts${row.totalPoints === 0 ? ' dim' : ''}`}>
                {row.totalPoints > 0 ? `${row.totalPoints.toLocaleString('fr-FR')} pts` : '0 pt'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
