import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import './auth.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/password-reset/request', { email })
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">
      <Link to="/" className="auth-logo">BCF</Link>

      <div className="auth-card">
        <div className="auth-title">Mot de passe oublié</div>
        <div className="auth-subtitle">
          {sent
            ? 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
            : 'Saisis ton email pour recevoir un lien de réinitialisation.'}
        </div>

        {!sent && (
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
                autoFocus
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <div className="auth-divider" />
        <div className="auth-footer">
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}
