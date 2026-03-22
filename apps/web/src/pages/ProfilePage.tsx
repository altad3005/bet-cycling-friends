import { useState } from 'react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../stores/auth'
import AppShell from '../components/AppShell'

export default function ProfilePage() {
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  const [pseudo, setPseudo] = useState(user?.pseudo ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)
    try {
      const res = await authApi.updateProfile(pseudo)
      setUser(res.data.data)
      setSuccess(true)
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
    <AppShell activePage="profile" pageTitle="Mon profil">
      <div style={{ maxWidth: 480, margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{
          background: '#131318',
          border: '0.5px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: '1.75rem',
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f0ede8', marginBottom: '1.5rem' }}>
            Informations du profil
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(240,237,232,0.5)', marginBottom: 6 }}>
                Email
              </label>
              <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.6)', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                {user?.email}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(240,237,232,0.5)', marginBottom: 6 }}>
                Pseudo
              </label>
              <input
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  padding: '0.6rem 0.75rem',
                  color: '#f0ede8',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                type="text"
                value={pseudo}
                onChange={(e) => { setPseudo(e.target.value); setSuccess(false) }}
                required
                minLength={2}
                maxLength={50}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: '#e05c5c', padding: '0.5rem 0.75rem', background: 'rgba(224,92,92,0.08)', borderRadius: 6 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ fontSize: 13, color: '#5cb85c', padding: '0.5rem 0.75rem', background: 'rgba(92,184,92,0.08)', borderRadius: 6 }}>
                Profil mis à jour.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#e8c96d',
                color: '#13110d',
                border: 'none',
                borderRadius: 8,
                padding: '0.65rem 1.25rem',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                alignSelf: 'flex-start',
              }}
            >
              {loading ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
