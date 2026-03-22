import type { LeagueStanding } from '../../api/standings'
import { initials, avatarColor } from '../../utils/ui'

const RANK_CLASSES = ['g', 's', 'b']

interface Props {
  standings: LeagueStanding[]
  userId:    string
  season:    number
}

export default function LeagueStandingsPanel({ standings, userId, season }: Props) {
  const maxPts     = standings[0]?.totalPoints ?? 1
  const hidden     = standings.length > 8 ? standings.length - 8 : 0
  const visible    = standings.slice(0, 8)

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Classement de la ligue</div>
        <div className="panel-meta">Saison {season}</div>
      </div>

      {standings.length > 0 ? (
        <>
          <div className="standings-col-head" style={{ gap: 12 }}>
            <div style={{ width: 20, flexShrink: 0 }} />
            <div style={{ width: 28, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(240,237,232,0.2)' }}>Joueur</div>
            <div style={{ width: 28, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(240,237,232,0.2)', textAlign: 'center' }}>Crses</div>
            <div style={{ width: 60, flexShrink: 0 }} />
            <div style={{ width: 60, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(240,237,232,0.2)', textAlign: 'right' }}>Pts</div>
          </div>

          {visible.map((row, i) => {
            const isMe     = row.userId === userId
            const col      = avatarColor(i)
            const barPct   = maxPts > 0 ? Math.round((row.totalPoints / maxPts) * 100) : 0
            const barColor = i === 0 ? '#e8c96d' : i === 1 ? '#b0b8c8' : i === 2 ? '#cd7f32' : '#e8c96d'
            return (
              <div key={row.userId} className={`standings-row${isMe ? ' me' : ''}`}>
                <div className={`s-rank ${RANK_CLASSES[i] ?? ''}`}>{row.rank}</div>
                <div className="s-avatar" style={{ background: col.bg, color: col.color }}>
                  {initials(row.pseudo ?? '?')}
                </div>
                <div className="s-name">
                  {row.pseudo}
                  {isMe && <span className="me-badge">Moi</span>}
                </div>
                <div className="s-races">{row.racesPlayed}</div>
                <div className="s-bar">
                  <div className="s-fill" style={{ width: `${barPct}%`, background: barColor }} />
                </div>
                <div className="s-pts">{row.totalPoints.toLocaleString('fr-FR')}</div>
              </div>
            )
          })}

          {hidden > 0 && (
            <div className="standings-footer">
              + {hidden} autre{hidden > 1 ? 's' : ''} joueur{hidden > 1 ? 's' : ''}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '2rem 1.25rem', textAlign: 'center', fontSize: 13, color: 'rgba(240,237,232,0.25)' }}>
          Aucun membre dans cette ligue.
        </div>
      )}
    </div>
  )
}
