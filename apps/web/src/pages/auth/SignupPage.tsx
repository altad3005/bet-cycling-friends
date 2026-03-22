import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/auth'
import './auth.css'

export default function SignupPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = useAuthStore((s) => s.token)

  if (token) return <Navigate to="/dashboard" replace />
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.signup(pseudo, email, password)
      setAuth(res.data.data.token, res.data.data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data as
        | { errors?: { message: string }[]; message?: string }
        | undefined
      setError(data?.errors?.[0]?.message ?? data?.message ?? 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <Link to="/" className="auth-logo">BCF</Link>

      <div className="auth-card">
        <div className="auth-title">Inscription</div>
        <div className="auth-subtitle">Rejoins le peloton et défie tes amis.</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Pseudo</label>
            <input
              className="auth-input"
              type="text"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="TonPseudo"
              required
            />
          </div>
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
              minLength={8}
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Inscription…' : "Créer mon compte"}
          </button>
        </form>

        <div className="auth-divider" />
        <div className="auth-footer">
          Déjà un compte ?{' '}
          <Link to="/login">Se connecter</Link>
        </div>
      </div>
    </div>
  )
}
