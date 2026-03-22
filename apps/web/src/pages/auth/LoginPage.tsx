import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/auth'
import './auth.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = useAuthStore((s) => s.token)

  if (token) return <Navigate to="/dashboard" replace />
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      setAuth(res.data.data.token, res.data.data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data as
        | { errors?: { message: string }[]; message?: string }
        | undefined
      setError(data?.errors?.[0]?.message ?? data?.message ?? 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <Link to="/" className="auth-logo">BCF</Link>

      <div className="auth-card">
        <div className="auth-title">Connexion</div>
        <div className="auth-subtitle">Content de te revoir dans le peloton.</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.fr"
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Mot de passe</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
            <Link to="/forgot-password" style={{ fontSize: 12, color: 'rgba(240,237,232,0.35)', textDecoration: 'none' }}>
              Mot de passe oublié ?
            </Link>
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-divider" />
        <div className="auth-footer">
          Pas encore de compte ?{' '}
          <Link to="/signup">S'inscrire</Link>
        </div>
      </div>
    </div>
  )
}
