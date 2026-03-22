import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import './auth.css'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/password-reset/confirm', { token, password, passwordConfirmation: password })
      navigate('/login')
    } catch {
      setError('Lien invalide ou expiré. Demande un nouveau lien.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-root">
        <Link to="/" className="auth-logo">BCF</Link>
        <div className="auth-card">
          <div className="auth-title">Lien invalide</div>
          <div className="auth-subtitle">Ce lien de réinitialisation est invalide.</div>
          <div className="auth-divider" />
          <div className="auth-footer"><Link to="/forgot-password">Demander un nouveau lien</Link></div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-root">
      <Link to="/" className="auth-logo">BCF</Link>

      <div className="auth-card">
        <div className="auth-title">Nouveau mot de passe</div>
        <div className="auth-subtitle">Choisis un nouveau mot de passe pour ton compte.</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Nouveau mot de passe</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirmer le mot de passe</label>
            <input
              className="auth-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        <div className="auth-divider" />
        <div className="auth-footer">
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}
