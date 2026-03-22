import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import LandingNav from '../components/landing/LandingNav'
import LandingHero from '../components/landing/LandingHero'
import LandingFeatures from '../components/landing/LandingFeatures'
import GlobalLeaderboard from '../components/landing/GlobalLeaderboard'
import ScoringSection from '../components/landing/ScoringSection'
import LandingCta from '../components/landing/LandingCta'
import './LandingPage.css'

export default function LandingPage() {
  const token = useAuthStore((s) => s.token)

  if (token) return <Navigate to="/dashboard" replace />

  return (
    <div className="bcf-root">
      <LandingNav />
      <LandingHero />
      <div className="bcf-divider" />
      <LandingFeatures />
      <GlobalLeaderboard />
      <div className="bcf-divider" />
      <ScoringSection />
      <LandingCta />
      <footer className="bcf-footer">
        BetCyclingFriends · Saison 2026 · Fait avec passion pour le cyclisme
      </footer>
    </div>
  )
}
