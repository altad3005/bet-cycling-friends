import { SCORING_TABLE } from '@bcf/shared'

const ORDINALS = ['1er', '2e', '3e', '4e', '5e', '6e', '7e', '8e', '9e', '10e']

const scoringEntries = Object.entries(SCORING_TABLE).slice(0, 5)

export default function ScoringSection() {
  return (
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
  )
}
