import { useNavigate } from 'react-router-dom'

export default function LandingCta() {
  const navigate = useNavigate()

  return (
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
  )
}
