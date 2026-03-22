import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/auth'
import './auth.css'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const err   = searchParams.get('error')

    if (err || !token) {
      setError('La connexion avec Google a échoué. Réessaie.')
      return
    }

    // Store token temporarily to make the profile request
    localStorage.setItem('token', token)

    const setup = searchParams.get('setup') === '1'

    authApi.profile()
      .then((res) => {
        setAuth(token, res.data.data)
        navigate(setup ? '/setup-profile' : '/dashboard', { replace: true })
      })
      .catch(() => {
        localStorage.removeItem('token')
        setError('Impossible de récupérer le profil. Réessaie.')
      })
  }, [])

  if (error) {
    return (
      <div className="auth-root">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-title">Erreur</div>
          <div className="auth-error" style={{ marginTop: '1rem' }}>{error}</div>
          <div className="auth-divider" />
          <div className="auth-footer">
            <a href="/login" style={{ color: '#e8c96d' }}>Retour à la connexion</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-root">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-subtitle">Connexion en cours…</div>
      </div>
    </div>
  )
}
