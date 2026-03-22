import { useNavigate } from 'react-router-dom'

export default function LandingNav() {
  const navigate = useNavigate()

  return (
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
  )
}
