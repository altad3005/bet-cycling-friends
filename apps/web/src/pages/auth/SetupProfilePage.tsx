import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/auth'
import './auth.css'

export default function SetupProfilePage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  const [pseudo, setPseudo] = useState(user?.pseudo ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.updateProfile(pseudo)
      setUser(res.data.data)
      navigate('/dashboard', { replace: true })
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
      <div className="auth-logo">BCF</div>

      <div className="auth-card">
        <div className="auth-title">Choisis ton pseudo</div>
        <div className="auth-subtitle">Il sera visible par les autres membres de ta ligue.</div>

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
              minLength={2}
              maxLength={50}
              autoFocus
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Enregistrement…' : 'Continuer'}
          </button>
        </form>
      </div>
    </div>
  )
}
