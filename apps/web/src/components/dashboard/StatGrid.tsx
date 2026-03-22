import type { LeagueStanding } from '../../api/standings'
import { formatGap } from '../../utils/ui'

interface Props {
  myStanding:     LeagueStanding | undefined
  leaderStanding: LeagueStanding | undefined
  memberCount:    number
  userId:         string
}

export default function StatGrid({ myStanding, leaderStanding, memberCount, userId }: Props) {
  return (
    <div className="stat-grid">
      <div className="stat-card">
        <div className="stat-label">Ma position</div>
        <div className={`stat-val${myStanding?.rank === 1 ? ' gold' : ''}`}>
          {myStanding ? `${myStanding.rank}e` : '—'}
        </div>
        <div className="stat-sub">
          sur {memberCount ?? '—'} joueur{(memberCount ?? 0) > 1 ? 's' : ''}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Mes points</div>
        <div className="stat-val">
          {myStanding ? myStanding.totalPoints.toLocaleString('fr-FR') : '—'}
        </div>
        <div className="stat-sub">cette saison</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Courses jouées</div>
        <div className="stat-val">{myStanding?.racesPlayed ?? '—'}</div>
        <div className="stat-sub">pronostics placés</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Écart leader</div>
        <div className="stat-val">
          {myStanding && leaderStanding
            ? formatGap(myStanding.totalPoints - leaderStanding.totalPoints)
            : '—'}
        </div>
        <div className="stat-sub">
          {leaderStanding && leaderStanding.userId !== userId
            ? `${leaderStanding.pseudo} · ${leaderStanding.totalPoints.toLocaleString('fr-FR')} pts`
            : 'Tu mènes la ligue'}
        </div>
      </div>
    </div>
  )
}
