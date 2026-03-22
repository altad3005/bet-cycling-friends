import { useNavigate } from 'react-router-dom'
import { SCORING_TABLE } from '@bcf/shared'
import './LandingPage.css'

const LEADERBOARD = [
  { initials: 'RM', name: 'Romain M.', races: 24, pct: 94.2, badge: 'Top 1%', color: '#e8c96d', bg: 'rgba(232,201,109,0.15)', barColor: '#e8c96d' },
  { initials: 'SB', name: 'Sophie B.', races: 22, pct: 88.7, badge: null, color: '#b0b8c8', bg: 'rgba(176,184,200,0.12)', barColor: '#b0b8c8' },
  { initials: 'TL', name: 'Thomas L.', races: 26, pct: 84.1, badge: null, color: '#cd7f32', bg: 'rgba(205,127,50,0.12)', barColor: '#cd7f32' },
  { initials: 'CD', name: 'Clara D.', races: 19, pct: 79.4, badge: null, color: '#5ea0dc', bg: 'rgba(94,160,220,0.12)', barColor: '#e8c96d' },
  { initials: 'MV', name: 'Marc V.', races: 21, pct: 76.0, badge: null, color: '#78b478', bg: 'rgba(120,180,120,0.12)', barColor: '#e8c96d' },
  { initials: 'AP', name: 'Aurélie P.', races: 18, pct: 71.3, badge: null, color: '#c86496', bg: 'rgba(200,100,150,0.12)', barColor: '#e8c96d' },
]

const RANK_CLASSES = ['gold', 'silver', 'bronze', '', '', '']

const ORDINALS = ['1er', '2e', '3e', '4e', '5e', '6e', '7e', '8e', '9e', '10e']

export default function LandingPage() {
  const navigate = useNavigate()

  const scoringEntries = Object.entries(SCORING_TABLE).slice(0, 5)

  return (
    <div className="bcf-root">
      <nav className="bcf-nav">
        <div className="bcf-logo">BCF</div>
        <div className="bcf-nav-links">
          <button className="bcf-nav-link" onClick={() => navigate('/login')}>
            Se connecter
          </button>
          <button className="bcf-nav-cta" onClick={() => navigate('/signup')}>
            Rejoindre
          </button>
        </div>
      </nav>

      <section className="bcf-hero">
        <div className="bcf-pill">Saison 2026 · UCI WorldTour</div>
        <h1 className="bcf-hero-title">
          Pronostics<br /><span>cyclistes</span><br />entre amis
        </h1>
        <p className="bcf-hero-sub">
          Classiques, Grands Tours, Monuments. Pariez sur les coureurs qui feront la différence — et mesurez-vous à vos amis sur chaque épreuve du calendrier.
        </p>
        <div className="bcf-hero-actions">
          <button className="bcf-btn-primary" onClick={() => navigate('/signup')}>
            Créer mon compte
          </button>
          <button className="bcf-btn-ghost" onClick={() => navigate('/login')}>
            Rejoindre une ligue
          </button>
        </div>
      </section>

      <div className="bcf-divider" />

      <div className="bcf-features-wrapper">
        <div className="bcf-features">
          <div className="bcf-feature">
            <div className="bcf-feature-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div className="bcf-feature-title">Monuments & Classiques</div>
            <div className="bcf-feature-desc">
              Paris-Roubaix, Tour des Flandres, Liège. Chaque monument vaut double — l'expertise se récompense.
            </div>
          </div>
          <div className="bcf-feature">
            <div className="bcf-feature-icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="bcf-feature-title">Grands Tours</div>
            <div className="bcf-feature-desc">
              Composez une équipe de 8 coureurs. Points à chaque étape, bonus sur le classement général final.
            </div>
          </div>
          <div className="bcf-feature">
            <div className="bcf-feature-icon">
              <svg viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div className="bcf-feature-title">Ligues privées</div>
            <div className="bcf-feature-desc">
              Jusqu'à 20 participants. Un code d'invitation, vos amis rejoignent et la compétition commence.
            </div>
          </div>
        </div>
      </div>

      <section className="bcf-section" id="classement">
        <div className="bcf-section-header">
          <div className="bcf-section-title">Classement global</div>
          <div className="bcf-section-meta">Saison 2026 · 847 joueurs</div>
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
            {LEADERBOARD.map((row, i) => (
              <tr key={row.initials}>
                <td>
                  <span className={`bcf-rank ${RANK_CLASSES[i]}`}>{i + 1}</span>
                </td>
                <td>
                  <div className="bcf-player-cell">
                    <div
                      className="bcf-avatar"
                      style={{ background: row.bg, color: row.color }}
                    >
                      {row.initials}
                    </div>
                    <div className="bcf-player-name">
                      {row.name}
                      {row.badge && <span className="bcf-badge">{row.badge}</span>}
                    </div>
                  </div>
                </td>
                <td>{row.races}</td>
                <td>
                  <div className="bcf-score-bar-wrap">
                    <div className="bcf-score-bar">
                      <div
                        className="bcf-score-fill"
                        style={{ width: `${row.pct}%`, background: row.barColor }}
                      />
                    </div>
                    <span className="bcf-score-val">{row.pct.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bcf-table-footer">847 joueurs classés · Mis à jour en temps réel</div>
      </section>

      <div className="bcf-divider" />

      <section className="bcf-section" id="bareme">
        <div className="bcf-section-header">
          <div className="bcf-section-title">Barème des points</div>
          <div className="bcf-section-meta">Base Top 10</div>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.4)', lineHeight: 1.6, margin: 0 }}>
          Les points de base sont multipliés selon le prestige de la course — ×2,0 pour les Monuments, ×1,5 pour les Classiques WorldTour.
        </p>
        <div className="bcf-scoring">
          {scoringEntries.map(([pos, pts], i) => (
            <div className="bcf-scoring-item" key={pos}>
              <div className="bcf-scoring-place">{ORDINALS[parseInt(pos) - 1] ?? `${pos}e`}</div>
              <div className={`bcf-scoring-pts${i > 0 ? ' dim' : ''}`}>{pts}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="bcf-cta-section">
        <h2 className="bcf-cta-title">
          Prêt à défier<br />le <span>peloton</span> ?
        </h2>
        <p className="bcf-cta-sub">Créez votre compte gratuitement et rejoignez la prochaine ligue.</p>
        <button
          className="bcf-btn-primary"
          style={{ fontSize: 15, padding: '16px 40px' }}
          onClick={() => navigate('/signup')}
        >
          Commencer maintenant
        </button>
      </div>

      <footer className="bcf-footer">
        BetCyclingFriends · Saison 2026 · Fait avec passion pour le cyclisme
      </footer>
    </div>
  )
}
