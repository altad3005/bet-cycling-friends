import { useNavigate } from 'react-router-dom'
import type { RaceStage } from '../../api/races'

interface Props {
  raceId: string
  stages: RaceStage[]
  gcSynced: boolean
}

export default function RaceGtStages({ raceId, stages, gcSynced }: Props) {
  const navigate = useNavigate()

  return (
    <>
      <section className="race-section">
        <div className="race-section-title">Général</div>
        <div className="gt-stage-list">
          <button
            className={`gt-stage-row-btn gt-stage-gc${gcSynced ? ' synced' : ''}`}
            onClick={() => gcSynced && navigate(`/races/${raceId}/gc`)}
          >
            <span className="gt-stage-num">GC</span>
            <span className="gt-stage-name">Classement général</span>
            {gcSynced
              ? <span className="gt-stage-status synced">Résultats</span>
              : <span className="gt-stage-status pending">À venir</span>
            }
            {gcSynced && <span className="gt-stage-chevron">›</span>}
          </button>
        </div>
      </section>

      <section className="race-section">
        <div className="race-section-title">Étapes</div>
        <div className="gt-stage-list">
          {stages.map((stage) => {
            const profileLevel = stage.profileIcon ? parseInt(stage.profileIcon.replace('p', '')) : 0
            return (
              <button
                key={stage.number}
                className={`gt-stage-row-btn${stage.synced ? ' synced' : ''}`}
                onClick={() => stage.synced && navigate(`/races/${raceId}/stages/${stage.number}`)}
              >
                <span className="gt-stage-num">{stage.number}</span>
                <span className="gt-stage-name">{stage.name}</span>
                {stage.date && <span className="gt-stage-date">{stage.date}</span>}
                <span className="gt-stage-profile" title={`Profil ${stage.profileIcon ?? '—'}`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`gt-profile-bar${i < profileLevel ? ' filled' : ''}`} />
                  ))}
                </span>
                {stage.synced
                  ? <span className="gt-stage-status synced">Résultats</span>
                  : <span className="gt-stage-status pending">À venir</span>
                }
                {stage.synced && <span className="gt-stage-chevron">›</span>}
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
