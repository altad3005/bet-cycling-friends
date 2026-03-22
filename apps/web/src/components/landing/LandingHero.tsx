import { useNavigate } from 'react-router-dom'

export default function LandingHero() {
  const navigate = useNavigate()

  return (
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
  )
}
