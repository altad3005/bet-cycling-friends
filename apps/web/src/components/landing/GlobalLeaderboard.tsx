import { useQuery } from '@tanstack/react-query'
import type { GlobalStanding } from '../../api/standings'
import { initials, avatarColor } from '../../utils/ui'

const RANK_CLASSES = ['gold', 'silver', 'bronze', '', '', '']
const BAR_COLORS   = ['#e8c96d', '#b0b8c8', '#cd7f32', '#e8c96d', '#e8c96d', '#e8c96d']

async function fetchGlobalStandings(): Promise<GlobalStanding[]> {
  const res = await fetch('/api/standings/global')
  const json = await res.json()
  return json.standings ?? json.data?.standings ?? []
}

export default function GlobalLeaderboard() {
  const { data = [] } = useQuery({
    queryKey: ['standings', 'global', 'public'],
    queryFn: fetchGlobalStandings,
    staleTime: 5 * 60_000,
  })

  const top6 = data.slice(0, 6)
  const total = data.length

  return (
    <section className="bcf-section" id="classement">
      <div className="bcf-section-header">
        <div className="bcf-section-title">Classement global</div>
        {total > 0 && (
          <div className="bcf-section-meta">
            Saison 2026 · {total} joueur{total > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <table className="bcf-table">
        <thead>
          <tr>
            <th style={{ width: 32 }}>#</th>
            <th>Joueur</th>
            <th>Courses</th>
            <th>Score normalisé</th>
          </tr>
        </thead>
        <tbody>
          {top6.length > 0 ? (
            top6.map((row, i) => {
              const col = avatarColor(i)
              return (
                <tr key={row.userId}>
                  <td>
                    <span className={`bcf-rank ${RANK_CLASSES[i] ?? ''}`}>{row.rank}</span>
                  </td>
                  <td>
                    <div className="bcf-player-cell">
                      <div className="bcf-avatar" style={{ background: col.bg, color: col.color }}>
                        {initials(row.pseudo ?? '?')}
                      </div>
                      <div className="bcf-player-name">
                        {row.pseudo}
                        {i === 0 && <span className="bcf-badge">Top 1</span>}
                      </div>
                    </div>
                  </td>
                  <td>{row.racesPlayed}</td>
                  <td>
                    <div className="bcf-score-bar-wrap">
                      <div className="bcf-score-bar">
                        <div
                          className="bcf-score-fill"
                          style={{ width: `${row.percentage}%`, background: BAR_COLORS[i] ?? '#e8c96d' }}
                        />
                      </div>
                      <span className="bcf-score-val">{row.percentage.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'rgba(240,237,232,0.25)', padding: '2rem', fontSize: 13 }}>
                Aucun score disponible pour l'instant.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {total > 0 && (
        <div className="bcf-table-footer">
          {total} joueur{total > 1 ? 's' : ''} classé{total > 1 ? 's' : ''} · Mis à jour en temps réel
        </div>
      )}
    </section>
  )
}
